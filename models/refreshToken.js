import mongoose from "mongoose";

const RefreshTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true }
});

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const RefreshTokenModel = mongoose.model("RefreshToken", RefreshTokenSchema);