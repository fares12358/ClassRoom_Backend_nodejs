import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // Plan title (e.g., Basic, Pro, Premium)
    price: { type: Number, required: true }, // Price in cents (e.g., $20 = 2000)
    duration: { type: String, required: true }, // e.g., "1 month", "6 months", "1 year"
    description: { type: String }, // Plan details/notes
    stripePriceId: { type: String }, // Optional if using Stripe price IDs
    features: [{ type: String }], // Optional: array of plan features
  },
  { timestamps: true } // Adds createdAt & updatedAt
);

export default mongoose.model("Plan", planSchema);
