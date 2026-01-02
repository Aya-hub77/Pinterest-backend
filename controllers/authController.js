import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { RefreshTokenModel } from "../models/refreshToken.js";
import { validationResult } from "express-validator";

const ACCESS_EXPIRES = "15m";
const REFRESH_EXPIRES = 7 * 24 * 60 * 60 * 1000;

function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id, roles: user.roles, iss: "pinterest-clone" },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );
}
function createRefreshToken() {
  return crypto.randomBytes(40).toString("hex");
}
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ----------------- SIGNUP
export const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { username, email, password } = req.body;
    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ message: "Email already used" });

    let hashed;
    try {
      hashed = await bcrypt.hash(password, 12);
    } catch (e) {
      console.error("Hashing error:", e);
      return res.status(500).json({ message: "Error hashing password" });
    }

    let user;
    try {
      user = await User.create({ username, email, password: hashed });
      console.log("User created:", user);
    } catch (e) {
      console.error("User creation error:", e);
      return res.status(500).json({ message: "Error creating user", error: e.message });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = createRefreshToken();
    const hashedToken = hashToken(refreshToken);

    try {
      await RefreshTokenModel.create({
        userId: user._id,
        tokenHash: hashedToken,
        expiresAt: new Date(Date.now() + REFRESH_EXPIRES),
      });
    } catch (e) {
      console.error("Refresh token creation error:", e);
      return res.status(500).json({ message: "Error creating refresh token" });
    }

    res.status(201).json({ message: "User created", user: { id: user._id, username: user.username }, accessToken, refreshToken});
  } catch (err) {
    next(err);
  }
};

// ------------------------- LOGIN
export const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const accessToken = signAccessToken(user);
    const refreshToken = createRefreshToken();
    const hashedToken = hashToken(refreshToken);

    await RefreshTokenModel.create({
      userId: user._id,
      tokenHash: hashedToken,
      expiresAt: new Date(Date.now() + REFRESH_EXPIRES)
    });

    res.json({ message: "Logged in", user: { id: user._id, username: user.username }, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

// ------------------------- LOGOUT (current device only)
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      const hashed = hashToken(refreshToken);
      await RefreshTokenModel.findOneAndDelete({ tokenHash: hashed });
    }
    res.clearCookie("refreshToken", { path: "/" });
    res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
};

// ------------------------- REFRESH TOKEN (with rotation)
export const refreshToken = async (req, res, next) => {
  try {
    const token = req.body.token;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const hashed = hashToken(token);
    const tokenDoc = await RefreshTokenModel.findOne({ tokenHash: hashed });
    if (!tokenDoc) return res.status(401).json({ message: "Invalid refresh token" });

    const user = await User.findById(tokenDoc.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    const accessToken = signAccessToken(user);

    res.json({ accessToken, refreshToken: token, user: { id: user._id, username: user.username } });
  } catch (err) {
    next(err);
  }
};