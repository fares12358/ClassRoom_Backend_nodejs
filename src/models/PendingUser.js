import mongoose from "mongoose";

const pendingUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  password: { type: String, required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("PendingUser", pendingUserSchema);
