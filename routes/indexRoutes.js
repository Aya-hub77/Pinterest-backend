import { Router } from "express";
import { login, signup, logout, getPins, createPin, getPin, getUser, userPins, searchPins, getSuggestions, me } from "../controllers/controllers.js";
import {sanitizeInput} from '../middleware/sanitizeInput.js';
import {signupValidator} from '../middleware/signupValidator.js';
import {loginValidator} from '../middleware/loginValidator.js';
import { verifySession } from "../middleware/verifySession.js";
import upload from "../middleware/upload.js";

const router = Router();
router.post('/signup', signupValidator, sanitizeInput(["username", "email", "password"]), signup );
router.post('/login', loginValidator, sanitizeInput(["email", "password"]), login)
router.post("/logout", verifySession, logout);
router.get("/me", verifySession, me);
router.get("/pins", getPins);
router.get("/pin/:id", getPin);
router.post("/pin", upload.single("image"), sanitizeInput(["caption"]), createPin);
router.get("/user/:userId", userPins);
router.get("/search", searchPins);
router.get("/suggestions", getSuggestions);
router.get("/:id", verifySession, getUser);
router.get("/", (req, res) => {
  res.send("API is running...");
});

export default router;