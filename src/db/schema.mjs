import { serial, varchar, timestamp, integer, pgTable, unique } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  fullname: varchar("fullname", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  password: varchar("password", { length: 255 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const seatsTable = pgTable("seats", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  isbooked: integer("isbooked").default(0),
});

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => usersTable.id),
  seat_id: integer("seat_id").notNull().references(() => seatsTable.id),
  movie_id: integer("movie_id").notNull(),
  booked_at: timestamp("booked_at").defaultNow(),
}, (t) => ({
  unq: unique().on(t.seat_id, t.movie_id)
}));
