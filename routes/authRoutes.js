import { Router } from "express";
import { signup, login, logout, refreshToken } from "../controllers/authController.js";
import { sanitizeInput } from "../middleware/sanitizeInput.js";
import { signupValidator } from "../middleware/signupValidator.js";
import { loginValidator } from "../middleware/loginValidator.js";

const router = Router();

router.post("/signup", sanitizeInput(["username", "email", "password"]), signupValidator, signup);
router.post("/login", sanitizeInput(["email", "password"]), loginValidator, login);
router.post("/logout", logout);
router.get("/refresh-token", refreshToken);

export default router;