import bcrypt from "bcrypt";
import { stripe } from "../config/stripe.js";
import PendingUser from "../models/PendingUser.js";
import User from "../models/Users.js";

const PRICE_MAP = {
  basic: 500, // $5.00 in cents
  pro: 1500,  // $15.00 in cents
};

export const initSignup = async (req, res) => {
  try {
    const { name, email, phone, password, planId } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Missing fields" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const pending = await PendingUser.create({ name, email, phone, password: hashed, planId });

    const amount = PRICE_MAP[planId] ?? PRICE_MAP.basic;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: { pendingUserId: pending._id.toString() },
      automatic_payment_methods: { enabled: true },
      receipt_email: email,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      pendingId: pending._id,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const pendingUserId = paymentIntent.metadata?.pendingUserId;

    if (pendingUserId) {
      const pending = await PendingUser.findById(pendingUserId);
      if (pending) {
        const already = await User.findOne({ email: pending.email });
        if (!already) {
          const user = new User({
            name: pending.name,
            email: pending.email,
            phone: pending.phone,
            password: pending.password,
            paid: true,
            stripePaymentIntentId: paymentIntent.id,
          });
          await user.save();
        }
        await PendingUser.findByIdAndDelete(pendingUserId);
      }
    }
  }

  res.json({ received: true });
};
