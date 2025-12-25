import { Router } from "express";
import { getNotifications, getSavedPins, getUser } from "../controllers/userControllers.js";
import { authRequired } from "../middleware/authRequired.js";

const router = Router();

router.get("/notifications", authRequired, getNotifications);
router.get("/:id", getUser);
router.get("/saved/:userId", getSavedPins);

export default router;