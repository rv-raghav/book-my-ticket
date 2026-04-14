import { Router } from "express";
import { register, login, logout, me } from "./auth.controller.mjs";

const authRouter = Router();

// POST /api/auth/register - Create a new user account
authRouter.post("/register", register);

// POST /api/auth/login - Authenticate and get a token
authRouter.post("/login", login);

// POST /api/auth/logout - Clear the auth cookie
authRouter.post("/logout", logout);

// GET /api/auth/me - Check current auth state
authRouter.get("/me", me);

export default authRouter;
