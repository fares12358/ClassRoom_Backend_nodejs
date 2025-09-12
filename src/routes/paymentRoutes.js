import express from "express";
import { createCheckoutSession, stripeWebhook } from "../controllers/paymentController.js";
import bodyParser from "body-parser";

const router = express.Router();

// ⚠️ Stripe needs raw body for webhook
router.post("/webhook", bodyParser.raw({ type: "application/json" }), stripeWebhook);

// Checkout route
router.post("/create-checkout-session", createCheckoutSession);

export default router;
