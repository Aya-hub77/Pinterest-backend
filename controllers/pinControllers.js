import Pin from "../models/pin.js";
import Notification from "../models/notification.js";
import { upload, cloudinary } from "../middleware/upload.js";


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


export const createPin = async (req, res, next) => {
  try {
    const { caption, tags } = req.body;
    const userId = req.user._id;
    if (!req.file) return res.status(400).json({ message: "image is required" });
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "portfolio_uploads" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });
    const imgUrl = result.secure_url;
    const tagsArray = tags ? JSON.parse(tags) : [];
    if (!tagsArray.length) { return res.status(400).json({ message: "At least one tag is required" }); };
    const newPin = await Pin.create({ caption, img: imgUrl, owner: userId, tags: tagsArray });
    res.status(201).json({
      id: newPin._id,
      caption: newPin.caption,
      img: newPin.img,
      tags: newPin.tags,
      owner: userId,
      createdAt: newPin.createdAt,
      url: imgUrl,
    });
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
      img: p.img,
      createdAt: p.createdAt,
      url: p.img,
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

export const userPins = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const pins = await Pin.find({ owner: userId }).sort({ createdAt: -1 });
  
    const formatted = pins.map(p => ({
      id: p._id,
      caption: p.caption,
      img: p.img,
      createdAt: p.createdAt,
      url: p.img,
    }));

    res.status(200).json(formatted);
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

export const toggleLikePin = async (req, res, next) => {
  try {
    const pinId = req.params.id;
    const userId = req.user.id;

    const pin = await Pin.findById(pinId);
    if (!pin) return res.status(404).json("Pin not found");

    let liked;

    if (pin.likes.includes(userId)) {
      pin.likes.pull(userId);
      liked = false;
    } else {
      pin.likes.push(userId);
      liked = true;

      if (pin.owner.toString() !== userId.toString()) {
        await Notification.create({
          recipient: pin.owner,
          sender: userId,
          type: "like",
          pin: pin._id
        });
      }
    }

    await pin.save();

    res.status(200).json({
      liked,
      likesCount: pin.likes.length,
    });
  } catch (error) {
    next(error);
  }
};


export const toggleSavePin = async (req, res, next) => {
  try {
    const pinId = req.params.id;
    const userId = req.user.id;

    const pin = await Pin.findById(pinId);
    if (!pin) return res.status(404).json("Pin not found");

    if (pin.saves.includes(userId)) {
      pin.saves.pull(userId);
    } else {
      pin.saves.push(userId);

      if (pin.owner.toString() !== userId) {
        await Notification.create({
          recipient: pin.owner,
          sender: userId,
          type: "save",
          pin: pinId
        });
      }
    }

    await pin.save();

    res.status(200).json({
      saved: pin.saves.includes(userId)
    });
  } catch (error) {
    next(error);
  }
};