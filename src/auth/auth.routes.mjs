import { Router } from "express";
import { register, login } from "./auth.controller.mjs";

const authRouter = Router();

// POST /api/auth/register - Create a new user account
authRouter.post("/register", register);

// POST /api/auth/login - Authenticate and get a token
authRouter.post("/login", login);

export default authRouter;
