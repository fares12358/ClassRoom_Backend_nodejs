import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },
  status: { type: String, enum: ["pending", "active"], default: "active" },
  accessToken: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
