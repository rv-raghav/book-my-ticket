import { verifyToken } from "../auth/auth.service.mjs";

/**
 * Authentication middleware
 * Reads the JWT from the httpOnly cookie (set by login/register)
 * Falls back to Authorization header for API clients
 * Attaches the decoded user to req.user
 */
export function authMiddleware(req, res, next) {
  try {
    // Primary: read from httpOnly cookie
    let token = req.cookies?.token;

    // Fallback: Authorization header (for API/testing tools)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    // Verify and decode the token
    const decoded = verifyToken(token);

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
