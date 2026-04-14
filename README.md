# 🎬 Book My Ticket

A completely immersive, full-stack movie seat-booking application built natively with Node.js and PostgreSQL. Designed for high-concurrency booking with industry-standard security practices.

![Seat Booking UI](https://img.shields.io/badge/UI-TailwindCSS-38bdf8?style=flat-square&logo=tailwind-css)
![Backend](https://img.shields.io/badge/Backend-Node.js_&_Express-339933?style=flat-square&logo=nodedotjs)
![Database](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat-square&logo=postgresql)

---

## ✨ Features

- **Movie-Specific Dynamic Seating**: Unlike generic booking systems, seat availability is dynamically computed on-the-fly per movie using relational joins. 
- **Automated Concurrency Handling**: Bookings use strict SQL transaction locks (`FOR UPDATE`) to mathematically prevent race conditions (two people booking the exact same seat at the exact same millisecond).
- **Responsive Seat Map Visualization**: High-end UI with tooltips showing who booked what, and distinction between Standard vs Premium selections.
- **Dashboard & History**: Users can view their past bookings instantly, matched asynchronously from the database.

## 🛡️ Security Implementation
The codebase underwent a complete security hardening phase to meet industry standards:
1. **Stateless JWT via httpOnly Cookies**: Tokens are no longer exposed to JavaScript via `localStorage`, eliminating the risk of Cross-Site Scripting (XSS) token theft.
2. **Brute-Force Protection**: Added `express-rate-limit` on all authentication endpoints to block credential stuffing.
3. **HTTP Header Hardening**: Secured via `Helmet.js` to protect against clickjacking and MIME-sniffing.
4. **DOM Sanitization**: All dynamic HTML insertions (e.g., viewing another user's name on a seat tooltip) run through a strict `escapeHtml()` middleware to avoid DOM-based XSS attacks.

---

## 🛠️ Tech Stack

### Core
- **Node.js**: Server runtime.
- **Express.js**: Network application framework.
- **PostgreSQL**: Robust, relational SQL database (Optimized for Supabase).

### Libraries
- **Drizzle ORM**: Type-safe, headless ORM for querying.
- **bcryptjs**: Deep salt-round password hashing.
- **jsonwebtoken**: Secure, stateless user sessions.
- **cookie-parser / cors / helmet**: HTTP/session middleware.
- **Tailwind CSS**: Rapid UI development via utility classes.

---

## 🚀 Getting Started Locally

### 1. Prerequisites
Ensure you have **Node.js** (v18+) and access to a **PostgreSQL** database.

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-username/book-my-ticket.git
cd book-my-ticket
npm install
```

### 3. Environment Config
Create a `.env` file in the root directory:
```env
PORT=8080
JWT_SECRET=generate_a_random_64_character_hex_string_here

# Local Database Details (Optional if using DATABASE_URL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=sql_class_2_db

# Or use a full connection string:
# DATABASE_URL=postgresql://user:password@host:port/postgres
```

### 4. Database Setup
We provide a setup script that will seamlessly provision your tables (and automatically create a localized database if you aren't using a cloud provider).
```bash
node src/db/db-setup.mjs
```

### 5. Start Server
```bash
node index.mjs
```

The app will be live at `http://localhost:8080`.

---

## ☁️ Deployment (Supabase + Render)

This application is ready for 1-click cloud deployments without any code modifications.

1. Create a database project on **Supabase**. Obtain the **Session Pooler (IPv4)** connection string `DATABASE_URL`.
2. Connect your GitHub repository to **Render.com**.
3. Use the included `render.yaml` infrastructure-as-code file. Supply the `DATABASE_URL` and `JWT_SECRET` when prompted.
4. Render will seamlessly build and deploy your Express server.
