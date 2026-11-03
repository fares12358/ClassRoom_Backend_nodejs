import express from "express";
import { createCheckoutSession, manageSubscription, retryPayment, stripeWebhook } from "../controllers/paymentController.js";
import bodyParser from "body-parser";
import { paymentIpLimiter, paymentTargetLimiter, subscriptionLimiter } from "../middleware/rateLimiters.js";
import { validateBody } from "../middleware/validate.js";
import { authMiddleware, studentTokenMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// ⚠️ Stripe needs raw body for webhook
router.post("/webhook", bodyParser.raw({ type: "application/json" }), stripeWebhook);

// Checkout route
router.post("/create-checkout-session", validateBody({ pendingId: "objectId" }), paymentIpLimiter, paymentTargetLimiter, createCheckoutSession);
router.post("/re-payment", validateBody({ id: "objectId" }), paymentIpLimiter, paymentTargetLimiter, retryPayment);

// re sub
router.post("/subscripe", authMiddleware, studentTokenMiddleware, subscriptionLimiter, validateBody({ planId: "objectId" }), manageSubscription);



export default router;
