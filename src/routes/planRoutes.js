import express from "express";
import { addPlan, deletePlanById, getAllPlans, getPlanById, updatePlanById } from "../controllers/planController.js";
import { validateBody, objectIdParams } from "../middleware/validate.js";
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware.js";

const DURATION_TYPES = ["day", "week", "month", "year"];
const planRules = (optional) => ({
  title: { type: "string", max: 100, optional },
  description: { type: "string", max: 1000, optional: true },
  price: { type: "number", min: 0.5, max: 100000, optional },
  durationValue: { type: "number", min: 1, max: 1000, optional },
  durationType: { type: "string", oneOf: DURATION_TYPES, optional },
});

const router = express.Router();
objectIdParams(router);

router.get("/", getAllPlans);
router.get("/:id", getPlanById);

router.use(authMiddleware, adminMiddleware);
// Add a new plan
router.post("/add", validateBody(planRules(false)), addPlan);
// Get all plans
// Get plan by ID
router.put("/:id", validateBody(planRules(true)), updatePlanById);
router.delete("/:id", deletePlanById);

export default router;
