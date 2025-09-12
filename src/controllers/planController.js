import Plan from "../models/Plan.js";

/**
 * Add a new plan
 */
export const addPlan = async (req, res) => {
  try {
    const { name, price, stripePriceId } = req.body;

    if (!name || !price) return res.status(400).json({ message: "Name and price are required" });

    const plan = new Plan({ name, price, stripePriceId });
    await plan.save();

    res.status(201).json({ message: "Plan created successfully", plan });
  } catch (error) {
    res.status(500).json({ message: "Error creating plan", error: error.message });
  }
};

/**
 * Get all plans
 */
export const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find();
    res.json({ plans });
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

    res.json({ plan });
  } catch (error) {
    res.status(500).json({ message: "Error fetching plan", error: error.message });
  }
};
