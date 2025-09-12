import express from "express";
import { handleWebhook, initSignup } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/signup/init", initSignup);

// Webhook requires raw body
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

export default router;
