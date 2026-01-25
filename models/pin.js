import mongoose from "mongoose";

const pinSchema = new mongoose.Schema(
{
  img: {type: String, required: true },
  caption: {type: String },
  tags: {type: [String], required: true, validate: [arr => arr.length > 0, "At least one tag is required"]  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
}, 
{ timestamps: true }
);

pinSchema.index({ caption: "text", tags: "text" });

export default mongoose.model("pin", pinSchema);