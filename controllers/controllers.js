import User from "../models/user.js";
import bcrypt from "bcryptjs";
import Pin from "../models/pin.js";
import { validationResult } from "express-validator";

export const signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { username, email, password } = req.body;
    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ message: "Email already used" });
    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ username, email, password: hashed });
    req.session.user = { id: user._id.toString(), username: user.username, email: user.email, };
    req.session.save((err) => {
      if (err) return next(err);
        res.status(201).json({ message: 'User created', user: req.session.user });
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message:"Invalid credentials" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({message:"Invalid credentials" });
    req.session.regenerate((error) => {
      if (error) return next(error);
      req.session.user = { id: user._id.toString(), username: user.username, email: user.email };
      req.session.save((error) => {
        if (error) return next(error);
        res.status(200).json({ message:'Logged in', user: req.session.user });
      });
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
    });
    res.status(200).json({ message: 'Logged out successfully' });
  });
};

export const me = (req, res, next) => {
  try {
    const user = req.session.user;
    if (!user) return res.status(401).json({message: "Not logged in"});
    const { id, username, email } = user;
    res.json({id, email, username});
  } catch (error) {
    next(error);
  }
};

export const getPins = async (req, res, next) => {
  try {
    const pins = await Pin.find();
    const shuffled = pins.sort(() => 0.5 - Math.random());
    const formatted = shuffled.map((p) => ({
      id: p._id,
      caption: p.caption,
      img: `${process.env.BACKEND_URL}/uploads/${p.img}`,
      createdAt: p.createdAt,
    }));
    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

export const getPin = async (req, res, next) => {
  try {
    const pin = await Pin.findById (req.params.id).populate("owner", "username");
    res.json(pin);
  } catch (error) {
    console.error("Error fetching pin:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createPin = async (req, res, next) => {
  try {
    const { caption, tags } = req.body;
    const userId = req.session.user.id;
    if (!req.file) return res.status(400).json({ message: "image is required" });
    const img = req.file.filename;
    const tagsArray = Array.isArray(tags) ? tags : JSON.parse(tags)
    if (!tagsArray.length) { return res.status(400).json({ message: "At least one tag is required" }); };
    const newPin = await Pin.create({ caption, img, owner: userId, tags: tagsArray });
    res.status(201).json({
      id: newPin._id,
      caption: newPin.caption,
      img: `${process.env.BACKEND_URL}/uploads/${newPin.img}`,
      tags: newPin.tags,
      owner: userId,
      createdAt: newPin.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("username email");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const userPins = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const pins = await Pin.find({ owner: userId }).sort({ createdAt: -1 });
    const formatted = pins.map(p => ({
      id: p._id,
      caption: p.caption,
      img: `${process.env.BACKEND_URL}/uploads/${p.img}`,
      createdAt: p.createdAt,
    }));
    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

export const searchPins = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Search query is required" });
    const words = q.toLowerCase().trim().split(/\s+/);
    const orConditions = words.map(word => ({
      $or: [
        { tags: { $elemMatch: { $regex: word, $options: "i" } } },
        { caption: { $regex: word, $options: "i" } }
      ]
    }));
    const results = await Pin.find({ $or: orConditions }).sort({ createdAt: -1 });
    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

export const getSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) return res.json([]);

    const queryWords = q.toLowerCase().trim().split(/\s+/);

    const orConditions = queryWords.map(word => ({
      $or: [
        { tags: { $elemMatch: { $regex: word, $options: "i" } } },
        { caption: { $regex: word, $options: "i" } }
      ]
    }));

    const pins = await Pin.find({ $or: orConditions })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("tags caption");

    const suggestionsSet = new Set();
    pins.forEach(pin => {
      pin.tags?.forEach(t => {
        if (t.toLowerCase().startsWith(q.toLowerCase())) suggestionsSet.add(t);
      });
      pin.caption?.split(" ").forEach(w => {
        if (w.toLowerCase().startsWith(q.toLowerCase())) suggestionsSet.add(w);
      });
    });

    res.json([...suggestionsSet].slice(0, 8));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to search pins" });
  }
};