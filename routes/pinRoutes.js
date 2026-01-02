import { Router } from "express";
import { createPin, getPin, getPins, getSuggestions, searchPins, userPins, toggleLikePin, toggleSavePin } from "../controllers/pinControllers.js";
import { upload } from "../middleware/upload.js";
import { sanitizeInput } from "../middleware/sanitizeInput.js";
import { authRequired } from "../middleware/authRequired.js";

const router = Router();

router.get("/", getPins);
router.get("/search", searchPins);
router.get("/suggestions", getSuggestions);
router.get("/user/:userId", userPins);
router.get("/:id", getPin);
router.post("/", authRequired, upload.single("image"), sanitizeInput(["caption"]), createPin);
router.put("/:id/like", authRequired, toggleLikePin);
router.put("/:id/save", authRequired, toggleSavePin);

export default router;