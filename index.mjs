//  CREATE TABLE seats (
//      id SERIAL PRIMARY KEY,
//      name VARCHAR(255),
//      isbooked INT DEFAULT 0
//  );
// INSERT INTO seats (isbooked)
// SELECT 0 FROM generate_series(1, 20);

import "dotenv/config";
import express from "express";
import pg from "pg";
import { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

// --- NEW IMPORTS for auth & booking ---
import authRouter from "./src/auth/auth.routes.mjs";
import { authMiddleware } from "./src/middleware/auth.middleware.mjs";
import { db } from "./src/db/db.mjs";
import { usersTable, seatsTable, bookingsTable } from "./src/db/schema.mjs";
import { asc, desc, eq, and } from "drizzle-orm";

const __dirname = dirname(fileURLToPath(import.meta.url));

const port = process.env.PORT || 8080;

const app = new express();

// --- Security middleware ---
// Helmet sets security headers (X-Content-Type-Options, X-Frame-Options, etc.)
// We allow inline scripts/styles since the app uses them in HTML files
app.use(helmet({
  contentSecurityPolicy: false, // disabled because index.html uses inline scripts & CDN tailwind
}));

// CORS — restrict to same origin (cookies require credentials)
app.use(cors({
  origin: process.env.CORS_ORIGIN || true, // true reflects the requester's origin dynamically
  credentials: true,
}));

// Rate limiting on auth endpoints — prevents brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // max 15 attempts per window
  message: { error: "Too many attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Parse cookies and JSON ---
app.use(cookieParser());
app.use(express.json());

// --- Serve static files (css, etc.) ---
app.use("/css", express.static(__dirname + "/css"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// --- Serve login and signup pages from client folder ---
app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/client/login.html");
});

app.get("/signup", (req, res) => {
  res.sendFile(__dirname + "/client/signup.html");
});

// --- Mount auth routes with rate limiting ---
app.use("/api/auth", authLimiter, authRouter);

// --- Mock movie data ---
const movies = [
  { id: 1, title: "Interstellar", genre: "Sci-Fi / Adventure", duration: "2h 49m", showtime: "7:15 PM" },
  { id: 2, title: "Oppenheimer", genre: "Biography / Drama", duration: "3h 00m", showtime: "8:30 PM" },
  { id: 3, title: "The Batman", genre: "Action / Crime", duration: "2h 56m", showtime: "9:00 PM" },
  { id: 4, title: "Dune: Part Two", genre: "Sci-Fi / Adventure", duration: "2h 46m", showtime: "6:45 PM" },
  { id: 5, title: "Spider-Man: No Way Home", genre: "Action / Sci-Fi", duration: "2h 28m", showtime: "10:15 PM" },
  { id: 6, title: "Top Gun: Maverick", genre: "Action / Drama", duration: "2h 10m", showtime: "5:30 PM" },
];

// GET /api/movies - Get list of available movies (public)
app.get("/api/movies", (req, res) => {
  res.json(movies);
});

// --- Get seats dynamically for a specific movie ---
app.get("/api/movies/:id/seats", async (req, res) => {
  try {
    const movieId = Number(req.params.id);
    
    // Get all 100 physical seats
    const allSeats = await db.select().from(seatsTable).orderBy(asc(seatsTable.id));
    
    // Get bookings for this specific movie
    const bookings = await db.select({
      seat_id: bookingsTable.seat_id,
      user_name: usersTable.fullname
    })
    .from(bookingsTable)
    .innerJoin(usersTable, eq(bookingsTable.user_id, usersTable.id))
    .where(eq(bookingsTable.movie_id, movieId));

    // Create a map of booked seats (seat_id -> user_name)
    const bookedSeatsMap = {};
    for (const b of bookings) {
      bookedSeatsMap[b.seat_id] = b.user_name;
    }

    // Merge static seats with dynamic booking status for this movie
    const result = allSeats.map(seat => ({
      ...seat,
      isbooked: bookedSeatsMap[seat.id] ? 1 : 0,
      name: bookedSeatsMap[seat.id] || null // Name of the booker!
    }));

    res.json(result);
  } catch (ex) {
    console.error("Fetch seats error:", ex);
    res.status(500).json({ error: "Failed to fetch seats" });
  }
});

//book a seat give the seatId and your name

app.put("/:id/:name", async (req, res) => {
  try {
    const id = req.params.id;
    const name = req.params.name;
    // payment integration should be here
    // verify payment
    const conn = await pool.connect(); // pick a connection from the pool
    //begin transaction
    // KEEP THE TRANSACTION AS SMALL AS POSSIBLE
    await conn.query("BEGIN");
    //getting the row to make sure it is not booked
    /// $1 is a variable which we are passing in the array as the second parameter of query function,
    // Why do we use $1? -> this is to avoid SQL INJECTION
    // (If you do ${id} directly in the query string,
    // then it can be manipulated by the user to execute malicious SQL code)
    const sql = "SELECT * FROM seats where id = $1 and isbooked = 0 FOR UPDATE";
    const result = await conn.query(sql, [id]);

    //if no rows found then the operation should fail can't book
    // This shows we Do not have the current seat available for booking
    if (result.rowCount === 0) {
      res.send({ error: "Seat already booked" });
      return;
    }
    //if we get the row, we are safe to update
    const sqlU = "update seats set isbooked = 1, name = $2 where id = $1";
    const updateResult = await conn.query(sqlU, [id, name]); // Again to avoid SQL INJECTION we are using $1 and $2 as placeholders

    //end transaction by committing
    await conn.query("COMMIT");
    conn.release(); // release the connection back to the pool (so we do not keep the connection open unnecessarily)
    res.send(updateResult);
  } catch (ex) {
    console.log(ex);
    res.send(500);
  }
});

// ============================================================
// Protected Booking Endpoints (require authentication)
// ============================================================

// POST /api/book - Book a seat for a movie (protected)
app.post("/api/book", authMiddleware, async (req, res) => {
  try {
    const { seatId, movieId } = req.body;
    const userId = req.user.id;
    const userName = req.user.fullname;

    if (!seatId || !movieId) {
      return res.status(400).json({ error: "seatId and movieId are required" });
    }

    const movie = movies.find((m) => m.id === Number(movieId));
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    const bookingResult = await db.transaction(async (tx) => {
      // NOT checking seatsTable.isbooked because seats are now movie-specific!
      // This checking is entirely handled by the duplicate check below.

      // Check for duplicate booking
      const dupResult = await tx
        .select({ id: bookingsTable.id })
        .from(bookingsTable)
        .where(
          and(
            eq(bookingsTable.seat_id, seatId),
            eq(bookingsTable.movie_id, movieId)
          )
        );

      if (dupResult.length > 0) {
        throw new Error("Conflict: This seat is already booked for this movie");
      }

      // We DO NOT update seatsTable anymore, because seat booking is local to the movie!
      
      // Insert booking record
      const insertData = await tx
        .insert(bookingsTable)
        .values({
          user_id: userId,
          seat_id: seatId,
          movie_id: movieId,
        })
        .returning({
          id: bookingsTable.id,
          seat_id: bookingsTable.seat_id,
          movie_id: bookingsTable.movie_id,
          booked_at: bookingsTable.booked_at,
        });

      return insertData[0];
    });

    res.status(201).json({
      message: "Seat booked successfully",
      booking: {
        ...bookingResult,
        movie: movie.title,
        user: userName,
      },
    });
  } catch (ex) {
    console.log("Booking error:", ex);
    
    if (ex.message.startsWith("Conflict")) {
      return res.status(409).json({ error: ex.message.replace("Conflict: ", "") });
    }
    
    res.status(500).json({ error: "Booking failed" });
  }
});

// GET /api/my-bookings - Get all bookings for the logged-in user (protected)
app.get("/api/my-bookings", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Join bookings with seats
    const result = await db.select({
      id: bookingsTable.id,
      seat_id: bookingsTable.seat_id,
      movie_id: bookingsTable.movie_id,
      booked_at: bookingsTable.booked_at,
      booked_name: seatsTable.name
    })
    .from(bookingsTable)
    .innerJoin(seatsTable, eq(bookingsTable.seat_id, seatsTable.id))
    .where(eq(bookingsTable.user_id, userId))
    .orderBy(desc(bookingsTable.booked_at));

    // Enrich with movie data from our mock array
    const bookings = result.map((row) => {
      const movie = movies.find((m) => m.id === row.movie_id);
      return {
        ...row,
        movie_title: movie ? movie.title : "Unknown",
        movie_showtime: movie ? movie.showtime : "N/A",
      };
    });

    res.json({ bookings });
  } catch (ex) {
    console.log("My bookings error:", ex);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

app.listen(port, () => console.log("Server starting on port: " + port));
