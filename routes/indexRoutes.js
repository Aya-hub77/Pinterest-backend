import { Router } from "express";
import { login, signup, logout, getPins, createPin, getPin, getUser, userPins, searchPins, getSuggestions } from "../controllers/controllers";
import {sanitizeInput} from '../middleware/sanitizeInput';
import {signupValidator} from '../middleware/signupValidator';
import {loginValidator} from '../middleware/loginValidator';
import { verifySession } from "../middleware/verifySession";
import upload from "../middleware/upload";

const router = Router();
router.post('/signup', signupValidator, sanitizeInput(["username", "email", "password"]), signup );
router.post('/login', loginValidator, sanitizeInput(["email", "password"]), login)
router.post("/logout", verifySession, logout);
router.get("/pins", verifySession, getPins);
router.get("/pin/:id", verifySession, getPin);
router.post("/pin", verifySession, upload.single("image"), sanitizeInput(["caption"]), createPin);
router.get("/user/:userId", userPins);
router.get("/:id", verifySession, getUser);
router.get("/search", verifySession, searchPins);
router.get("/suggestions", verifySession, getSuggestions);
router.get("/", (req, res) => {
  res.send("API is running...");
});

export default router;