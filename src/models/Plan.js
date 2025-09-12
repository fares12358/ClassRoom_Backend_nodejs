import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true }, // in cents, e.g., $20 = 2000
  stripePriceId: { type: String }, // optional if using Stripe price IDs
});

export default mongoose.model("Plan", planSchema);

