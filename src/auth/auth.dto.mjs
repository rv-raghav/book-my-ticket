// DTO validation for authentication endpoints
// DTOs ensure incoming data is well-formed before hitting the service layer

/**
 * Validates the registration payload
 */
export function validateRegisterDTO(body) {
  const errors = [];
  const { fullname, email, phone, password, confirmPassword } = body || {};

  if (!fullname || typeof fullname !== "string" || fullname.trim().length < 2) {
    errors.push("Full name is required and must be at least 2 characters");
  }

  if (!email || typeof email !== "string") {
    errors.push("Email is required");
  } else {
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push("Invalid email format");
    }
  }

  if (!password || typeof password !== "string") {
    errors.push("Password is required");
  } else if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }

  if (password !== confirmPassword) {
    errors.push("Passwords do not match");
  }

  if (phone && typeof phone === "string" && phone.trim().length > 20) {
    errors.push("Phone number is too long");
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      fullname: fullname?.trim(),
      email: email?.trim().toLowerCase(),
      phone: phone?.trim() || null,
      password,
    },
  };
}

/**
 * Validates the login payload
 */
export function validateLoginDTO(body) {
  const errors = [];
  const { email, password } = body || {};

  if (!email || typeof email !== "string") {
    errors.push("Email is required");
  }

  if (!password || typeof password !== "string") {
    errors.push("Password is required");
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      email: email?.trim().toLowerCase(),
      password,
    },
  };
}
