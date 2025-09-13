import Plan from "../models/Plan.js";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Add a new plan (with Stripe price)
 */
export const addPlan = async (req, res) => {
  try {
    let { title, price, duration, description, features } = req.body;

    if (!title || !price || !duration) {
      return res.status(400).json({ message: "Title, price, and duration are required" });
    }

    // ✅ Convert to cents (Stripe expects smallest unit)
    const amountInCents = Math.round(price * 100);

    // ✅ Create a Stripe Price
    const stripePrice = await stripe.prices.create({
      unit_amount: amountInCents,
      currency: "usd",
      product_data: {
        name: title,
        description: description || "",
      },
    });

    // ✅ Save in MongoDB
    const plan = new Plan({
      title,
      price: amountInCents, // store in cents
      duration,
      description,
      features: features || [],
      stripePriceId: stripePrice.id,
    });

    await plan.save();

    res.status(201).json({
      message: "Plan created successfully",
      plan,
    });
  } catch (error) {
    console.error("Error creating plan:", error);
    res.status(500).json({ message: "Error creating plan", error: error.message });
  }
};

/**
 * Get all plans
 */
export const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find();

    // ✅ Convert cents → dollars for frontend
    const formattedPlans = plans.map((plan) => ({
      ...plan._doc,
      price: (plan.price / 100).toFixed(2),
    }));

    res.json({ plans: formattedPlans });
  } catch (error) {
    res.status(500).json({ message: "Error fetching plans", error: error.message });
  }
};

/**
 * Get a single plan by ID
 */
export const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await Plan.findById(id);

    if (!plan) return res.status(404).json({ message: "Plan not found" });

    // ✅ Convert cents → dollars
    res.json({
      plan: {
        ...plan._doc,
        price: (plan.price / 100).toFixed(2),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching plan", error: error.message });
  }
};
