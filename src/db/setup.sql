-- ===========================================
-- Book My Ticket - Database Setup
-- ===========================================
-- Run this AFTER the existing seats table is created.
-- This adds the users and bookings tables.
-- ===========================================

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bookings table - associates a user with a seat for a specific movie
-- UNIQUE constraint on (seat_id, movie_id) prevents duplicate seat bookings per movie
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    seat_id INT NOT NULL REFERENCES seats(id),
    movie_id INT NOT NULL,
    booked_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(seat_id, movie_id)
);
