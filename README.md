# Book My Ticket 🎬

A simplified movie seat booking platform built with **Express.js** and **PostgreSQL**.

Users can register, login, and book seats for movies. The system prevents duplicate seat bookings and associates all bookings with authenticated users.

---

## Tech Stack

- **Backend**: Node.js, Express.js 5
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **Frontend**: HTML + TailwindCSS (CDN)

---

## Setup & Installation

### Prerequisites
- Node.js (v18+)
- PostgreSQL running on port `5433` (or update `index.mjs` pool config)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd book-my-ticket
npm install
```

### 2. Database Setup

Connect to PostgreSQL and create the database (if not already done):

```sql
CREATE DATABASE sql_class_2_db;
```

Then run the seed tables. First, the original seats table (from starter code):

```sql
CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    isbooked INT DEFAULT 0
);

INSERT INTO seats (isbooked)
SELECT 0 FROM generate_series(1, 20);
```

Then run the new tables for auth & bookings:

```bash
psql -h localhost -p 5433 -U postgres -d sql_class_2_db -f setup.sql
```

Or manually run the contents of `setup.sql` in your SQL client.

### 3. Start the Server

```bash
node index.mjs
```

Server starts on `http://localhost:8080`

---

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Serve the seat booking UI |
| GET | `/seats` | Get all seats (original) |
| GET | `/api/seats` | Get all seats (JSON) |
| GET | `/api/movies` | Get mock movie list |
| PUT | `/:id/:name` | Book a seat by ID and name (original) |
| GET | `/login` | Serve the login page |
| GET | `/signup` | Serve the signup page |

### Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |

### Protected Endpoints (require `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/book` | Book a seat for a movie |
| GET | `/api/my-bookings` | Get logged-in user's bookings |

---

## API Usage Examples

### Register

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "John Doe",
    "email": "john@example.com",
    "password": "Password123",
    "confirmPassword": "Password123"
  }'
```

### Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

### Book a Seat (Protected)

```bash
curl -X POST http://localhost:8080/api/book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "seatId": 1,
    "movieId": 1
  }'
```

### Get My Bookings (Protected)

```bash
curl http://localhost:8080/api/my-bookings \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## Project Structure

```
book-my-ticket/
├── index.mjs               ← Main server (original + extended endpoints)
├── index.html               ← Seat booking UI (original starter)
├── db.mjs                   ← Shared PostgreSQL pool export
├── setup.sql                ← DB migration (users + bookings tables)
├── package.json
│
├── src/
│   ├── auth/                ← Auth module (DTO-styled)
│   │   ├── auth.dto.mjs     ← Request validation (register/login DTOs)
│   │   ├── auth.service.mjs ← Business logic (hash, verify, JWT)
│   │   ├── auth.controller.mjs ← Request handlers
│   │   └── auth.routes.mjs  ← Router (POST /register, /login)
│   │
│   └── middleware/
│       └── auth.middleware.mjs ← JWT verification middleware
│
├── login/                   ← Login page template
├── sign-up/                 ← Sign-up page template
└── css/                     ← Stylesheets
```

---

## Authentication Flow

1. **Register** → `POST /api/auth/register` with `{ fullname, email, password, confirmPassword }`
2. **Login** → `POST /api/auth/login` with `{ email, password }`
3. Receive JWT token in response
4. Include token in `Authorization: Bearer <token>` header for protected endpoints
5. **Book a seat** → `POST /api/book` with `{ seatId, movieId }`
6. **View bookings** → `GET /api/my-bookings`

---

## Booking Logic

- Uses PostgreSQL transactions with `FOR UPDATE` row locks to prevent race conditions
- Duplicate bookings are prevented at 3 levels:
  1. **Application-level check**: `isbooked = 0` before update
  2. **Application-level check**: Query `bookings` table for existing entry
  3. **Database constraint**: `UNIQUE(seat_id, movie_id)` on bookings table
- All bookings are associated with the authenticated user via `user_id` foreign key

---

## License

ISC
