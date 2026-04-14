import { validateRegisterDTO, validateLoginDTO } from "./auth.dto.mjs";
import { registerUser, loginUser, verifyToken } from "./auth.service.mjs";

// Cookie configuration — httpOnly prevents JavaScript access (XSS-safe)
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  maxAge: 24 * 60 * 60 * 1000, // 24 hours in ms
  path: "/",
};

/**
 * POST /api/auth/register
 */
export async function register(req, res) {
  try {
    const { valid, errors, data } = validateRegisterDTO(req.body);
    if (!valid) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }

    const result = await registerUser(data);

    // Set JWT as httpOnly cookie — never returned in response body
    res.cookie("token", result.token, COOKIE_OPTIONS);

    return res.status(201).json({
      message: "User registered successfully",
      user: result.user,
    });
  } catch (err) {
    console.error("Register error:", err);
    const status = err.status || 500;
    const message = err.message || "Internal server error";
    return res.status(status).json({ error: message });
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req, res) {
  try {
    const { valid, errors, data } = validateLoginDTO(req.body);
    if (!valid) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }

    const result = await loginUser(data);

    // Set JWT as httpOnly cookie
    res.cookie("token", result.token, COOKIE_OPTIONS);

    return res.status(200).json({
      message: "Login successful",
      user: result.user,
    });
  } catch (err) {
    console.error("Login error:", err);
    const status = err.status || 500;
    const message = err.message || "Internal server error";
    return res.status(status).json({ error: message });
  }
}

/**
 * POST /api/auth/logout
 */
export function logout(req, res) {
  res.clearCookie("token", { path: "/" });
  return res.status(200).json({ message: "Logged out successfully" });
}

/**
 * GET /api/auth/me
 * Returns the current authenticated user from the cookie
 */
export function me(req, res) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = verifyToken(token);
    return res.status(200).json({
      user: {
        id: decoded.id,
        fullname: decoded.fullname,
        email: decoded.email,
      },
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      res.clearCookie("token", { path: "/" });
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Not authenticated" });
  }
}
