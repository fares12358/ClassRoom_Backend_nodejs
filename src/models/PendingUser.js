import mongoose from "mongoose";

const PendingUserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true },
  phone: String,
  password: String, // hashed
  planId: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("PendingUser", PendingUserSchema);
