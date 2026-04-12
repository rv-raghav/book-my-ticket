import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../auth/auth.service.mjs";

/**
 * Authentication middleware
 * Verifies the JWT token from the Authorization header
 * Attaches the decoded user to req.user
 */
export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    // Verify and decode the token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user info to request object for downstream handlers
    req.user = {
      id: decoded.id,
      fullname: decoded.fullname,
      email: decoded.email,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired. Please login again." });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token." });
    }
    return res.status(500).json({ error: "Authentication failed." });
  }
}
