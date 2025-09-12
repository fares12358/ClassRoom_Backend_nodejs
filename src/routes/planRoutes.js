import express from "express";
import { addPlan, getAllPlans, getPlanById } from "../controllers/planController.js";

const router = express.Router();

// Add a new plan
router.post("/add", addPlan);

// Get all plans
router.get("/", getAllPlans);

// Get plan by ID
router.get("/:id", getPlanById);

export default router;
