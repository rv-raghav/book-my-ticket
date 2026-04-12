import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db/db.mjs";
import { usersTable } from "../db/schema.mjs";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "book-my-ticket-secret-key-2026";
const JWT_EXPIRES_IN = "24h";

/**
 * Register a new user
 */
export async function registerUser(dto) {
  const { fullname, email, phone, password } = dto;

  // Check if user already exists
  const existingUsers = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

  if (existingUsers.length > 0) {
    throw { status: 409, message: "An account with this email already exists" };
  }

  // Hash password (salt rounds = 10)
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user into database
  const result = await db.insert(usersTable).values({
    fullname,
    email,
    phone,
    password: hashedPassword
  }).returning({
    id: usersTable.id,
    fullname: usersTable.fullname,
    email: usersTable.email,
    phone: usersTable.phone,
    created_at: usersTable.created_at
  });

  const user = result[0];

  // Generate JWT token
  const token = generateToken(user);

  return { token, user };
}

/**
 * Login an existing user
 */
export async function loginUser(dto) {
  const { email, password } = dto;

  // Find user by email
  const result = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

  if (result.length === 0) {
    throw { status: 401, message: "Invalid email or password" };
  }

  const user = result[0];

  // Compare password with stored hash
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw { status: 401, message: "Invalid email or password" };
  }

  // Remove password from user object before returning
  const { password: _, ...userWithoutPassword } = user;

  // Generate JWT token
  const token = generateToken(userWithoutPassword);

  return { token, user: userWithoutPassword };
}

/**
 * Generate a JWT token for the given user
 * @param {Object} user - User object with id, fullname, email
 * @returns {string} JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, fullname: user.fullname, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export { JWT_SECRET };
