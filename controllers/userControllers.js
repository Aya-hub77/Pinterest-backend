import User from '../models/user.js';
import Notification from '../models/notification.js';
import Pin from '../models/pin.js';


export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("username email");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .populate("sender", "username profilePic");
    res.status(200).json(notifications);
  } catch (err) {
    next(err);
  }
};

export const getSavedPins = async (req, res, next) => {
  try {
    const pins = await Pin.find({ saves: req.params.userId });
    res.status(200).json(pins);
  } catch (err) {
    next(err);
  }
};