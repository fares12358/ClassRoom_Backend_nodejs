import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  paid: { type: Boolean, default: false },
  stripePaymentIntentId: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", UserSchema);
