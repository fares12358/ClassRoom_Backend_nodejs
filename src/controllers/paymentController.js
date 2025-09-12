import Stripe from "stripe";
import PendingUser from "../models/PendingUser.js";
import User from "../models/Users.js";
import { generateAccessToken } from "../utils/tokens.js";
import dotenv from "dotenv";
dotenv.config(); // MUST be first line

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });

/**
 * Create checkout session
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const { pendingId } = req.body;
    const pendingUser = await PendingUser.findById(pendingId).populate("planId");
    if (!pendingUser) return res.status(404).json({ error: "Pending user not found" });
    if (!pendingUser.planId) return res.status(400).json({ error: "Plan not found" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: pendingUser.planId.name },
          unit_amount: pendingUser.planId.price,
        },
        quantity: 1,
      }],
      metadata: { pendingId: pendingUser._id.toString() },
      success_url: `${process.env.FRONTEND_URL}/success?pendingId=${pendingUser._id}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel?pendingId=${pendingUser._id}`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Create Checkout Error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Stripe webhook
 */
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const pendingId = session.metadata.pendingId;
      const pendingUser = await PendingUser.findById(pendingId).populate("planId");
      if (!pendingUser) return res.sendStatus(404);

      const newUser = new User({
        name: pendingUser.name,
        email: pendingUser.email,
        phone: pendingUser.phone,
        password: pendingUser.password,
        plan: pendingUser.planId._id,
        status: "active",
      });

      newUser.accessToken = generateAccessToken(newUser);
      await newUser.save();
      await PendingUser.findByIdAndDelete(pendingId);

      console.log(`✅ User ${newUser.email} activated after payment`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};
