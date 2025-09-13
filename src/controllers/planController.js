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
    let { title, description, price, durationValue, durationType } = req.body;

    if (!title || !price || !durationValue || !durationType) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const amountInCents = Math.round(price * 100);

    const plan = new Plan({
      title,
      description,
      price: amountInCents,
      durationValue,
      durationType
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
