import { Router } from "express";
import pinRoutes from "./pinRoutes.js";
import authRoutes from "./authRoutes.js"
import userRoutes from "./userRoutes.js"
import { authRequired } from "../middleware/authRequired.js";

const router = Router();
router.use("/auth", authRoutes);
router.use("/pin", authRequired, pinRoutes);
router.use("/user", userRoutes)
router.get("/", (req, res) => {
  res.send("API is running...");
});

export default router;