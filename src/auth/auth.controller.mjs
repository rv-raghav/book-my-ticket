import { validateRegisterDTO, validateLoginDTO } from "./auth.dto.mjs";
import { registerUser, loginUser } from "./auth.service.mjs";

/**
 * POST /api/auth/register
 * Handles user registration
 */
export async function register(req, res) {
  try {
    // Validate DTO
    const { valid, errors, data } = validateRegisterDTO(req.body);
    if (!valid) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }

    // Call service
    const result = await registerUser(data);

    return res.status(201).json({
      message: "User registered successfully",
      token: result.token,
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
 * Handles user login
 */
export async function login(req, res) {
  try {
    // Validate DTO
    const { valid, errors, data } = validateLoginDTO(req.body);
    if (!valid) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }

    // Call service
    const result = await loginUser(data);

    return res.status(200).json({
      message: "Login successful",
      token: result.token,
      user: result.user,
    });
  } catch (err) {
    console.error("Login error:", err);
    const status = err.status || 500;
    const message = err.message || "Internal server error";
    return res.status(status).json({ error: message });
  }
}
