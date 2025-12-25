import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  type: { type: String, enum: ["like", "comment", "follow", "save"], required: true },
  pin: { type: mongoose.Schema.Types.ObjectId, ref: "pin" },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Notification", notificationSchema);
