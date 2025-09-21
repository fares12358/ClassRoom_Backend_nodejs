import Stripe from "stripe";
import dotenv from "dotenv";
import PendingUser from "../models/PendingUser.js";
import User from "../models/Users.js";
import Plan from "../models/Plan.js";
import Transaction from "../models/Transaction.js";
import { generateAccessToken } from "../utils/tokens.js";
import { sendPaymentSuccessEmail, sendPendingPaymentEmail } from "./emailController.js";
dotenv.config(); // MUST be first line

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
          product_data: { name: pendingUser.planId.title },
          unit_amount: pendingUser.planId.price,
        },
        quantity: 1,
      }],
      metadata: { pendingId: pendingUser._id.toString() },
      success_url: `${process.env.FRONTEND_URL}/Pages/success?id=${pendingUser._id}`,
      cancel_url: `${process.env.FRONTEND_URL}/Pages/cancel?id=${pendingUser._id}`,
    });
    // ✅ Create transaction entry
    const transaction = new Transaction({
      pendingUser: pendingUser._id,
      plan: pendingUser.planId._id,
      stripeSessionId: session.id,
      amount: pendingUser.planId.price,
      currency: "usd",
      status: "pending",
      checkoutUrl: session.url,
    });
    await transaction.save();

    pendingUser.checkoutUrl = session.url;
    await pendingUser.save();
    await sendPendingPaymentEmail(pendingUser, session.url);
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

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Metadata can contain either pendingId OR (userId + planId)
      const { pendingId, userId, planId } = session.metadata || {};

      // ⚡ Case 1: NEW USER SIGNUP (from PendingUser)
      if (pendingId) {
        const pendingUser = await PendingUser.findById(pendingId).populate("planId");
        if (!pendingUser) return res.sendStatus(404);

        const plan = pendingUser.planId;

        // Calculate expiration date
        let expiresAt = new Date();
        switch (plan.durationType) {
          case "day":
            expiresAt.setDate(expiresAt.getDate() + plan.durationValue);
            break;
          case "week":
            expiresAt.setDate(expiresAt.getDate() + plan.durationValue * 7);
            break;
          case "month":
            expiresAt.setMonth(expiresAt.getMonth() + plan.durationValue);
            break;
          case "year":
            expiresAt.setFullYear(expiresAt.getFullYear() + plan.durationValue);
            break;
        }

        // Create user from pending
        const newUser = new User({
          _id: pendingUser._id, // force same ID
          name: pendingUser.name,
          email: pendingUser.email,
          phone: pendingUser.phone,
          password: pendingUser.password,
          plan: plan._id,
          status: "active",
          expiresAt,
        });

        newUser.accessToken = generateAccessToken(newUser);
        await newUser.save();

        // Update transaction
        await Transaction.findOneAndUpdate(
          { stripeSessionId: session.id },
          {
            user: newUser._id,
            stripePaymentId: session.payment_intent,
            status: "succeeded",
          }
        );

        // Remove pending user
        await PendingUser.findByIdAndDelete(pendingId);

        await sendPaymentSuccessEmail(newUser);
      }

      // ⚡ Case 2: EXISTING USER RESUB / PLAN CHANGE
      if (userId && planId) {
        const user = await User.findById(userId);
        const plan = await Plan.findById(planId);
        if (!user || !plan) return res.sendStatus(404);

        let expiresAt = new Date();

        // If still active, extend; else reset from today
        if (user.expiresAt && user.expiresAt > new Date()) {
          expiresAt = new Date(user.expiresAt);
        }

        switch (plan.durationType) {
          case "day":
            expiresAt.setDate(expiresAt.getDate() + plan.durationValue);
            break;
          case "week":
            expiresAt.setDate(expiresAt.getDate() + plan.durationValue * 7);
            break;
          case "month":
            expiresAt.setMonth(expiresAt.getMonth() + plan.durationValue);
            break;
          case "year":
            expiresAt.setFullYear(expiresAt.getFullYear() + plan.durationValue);
            break;
        }

        user.plan = plan._id;
        user.status = "active";
        user.expiresAt = expiresAt;
        await user.save();

        // Update transaction
        await Transaction.findOneAndUpdate(
          { stripeSessionId: session.id },
          {
            stripePaymentId: session.payment_intent,
            status: "succeeded",
          }
        );

        await sendPaymentSuccessEmail(user);
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("❌ Webhook processing error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * repay if payment canceled
 */

export const retryPayment = async (req, res) => {
  try {
    const { id } = req.body;

    // 1. Find pending user with plan
    const pendingUser = await PendingUser.findById(id).populate("planId");
    if (!pendingUser) {
      return res.status(404).json({ message: "Pending user not found" });
    }

    // 2. Create a new Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: pendingUser.planId.title },
            unit_amount: pendingUser.planId.price, // ⚠️ Make sure stored in cents
          },
          quantity: 1,
        },
      ],
      metadata: { pendingId: pendingUser._id.toString() },
      customer_email: pendingUser.email,
      success_url: `${process.env.FRONTEND_URL}/Pages/success?id=${pendingUser._id}`,
      cancel_url: `${process.env.FRONTEND_URL}/Pages/cancel?id=${pendingUser._id}`,
    });

    // 3. Update Transaction (reuse old if exists, otherwise create new)
    let transaction = await Transaction.findOne({ pendingUser: pendingUser._id, status: "pending" });
    if (!transaction) {
      transaction = new Transaction({
        pendingUser: pendingUser._id,
        plan: pendingUser.planId._id,
        amount: pendingUser.planId.price,
        currency: "usd",
        status: "pending",
      });
    }
    transaction.stripeSessionId = session.id;
    transaction.checkoutUrl = session.url;
    await transaction.save();

    // 4. Update pending user checkout link
    pendingUser.checkoutUrl = session.url;
    await pendingUser.save();

    res.json({ url: session.url });
  } catch (err) {
    console.error("Retry Payment Error:", err);
    res.status(500).json({ message: "Error retrying payment", error: err.message });
  }
};

// re subscription
export const manageSubscription = async (req, res) => {
  try {
    const { userId, planId } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({ error: "userId and planId are required" });
    }

    // 1. Find user and plan
    const user = await User.findById(userId).populate("plan");
    if (!user) return res.status(404).json({ error: "User not found" });

    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    // 2. Check subscription state
    const now = new Date();
    const isExpired = user.expiresAt && user.expiresAt < now;
    const isPending = user.status === "pending";
    const isChangingPlan = user.plan && user.plan._id.toString() !== planId;

    if (!isExpired && !isPending && !isChangingPlan) {
      return res.status(400).json({
        error: "Subscription still active with same plan",
      });
    }

    // 3. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: plan.title },
            unit_amount: plan.price, // must be in cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: user._id.toString(),
        planId: plan._id.toString(),
      },
      customer_email: user.email,
      success_url: `${process.env.FRONTEND_URL}/Pages/success?id=${user._id}`,
      cancel_url: `${process.env.FRONTEND_URL}/Pages/cancel?id=${user._id}`,
    });

    // 4. Create/Update transaction
    let transaction = await Transaction.findOne({
      user: user._id,
      status: "pending",
    });
    if (!transaction) {
      transaction = new Transaction({
        user: user._id,
        plan: plan._id,
        amount: plan.price,
        currency: "usd",
        status: "pending",
      });
    }
    transaction.stripeSessionId = session.id;
    transaction.checkoutUrl = session.url;
    await transaction.save();

    // 5. Update user as pending
    user.plan = plan._id;
    user.status = "pending";
    user.expiresAt = null; // will be set in webhook
    await user.save();

    await sendPendingPaymentEmail(user, session.url);

    res.json({ url: session.url });
  } catch (error) {
    console.error("Manage Subscription Error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Stripe webhook for payment confirmation
 */
export const subscriptionWebhook = async (req, res) => {
  console.log("🔔 Subscription webhook triggered:", req.body);
  const sig = req.headers["stripe-signature"];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const { userId, planId } = session.metadata;

      const user = await User.findById(userId);
      const plan = await Plan.findById(planId);

      if (!user || !plan) return res.sendStatus(404);

      // 1️⃣ Calculate new expiration date
      let expiresAt = new Date();

      switch (plan.durationType) {
        case "day":
          expiresAt.setDate(expiresAt.getDate() + plan.durationValue);
          break;
        case "week":
          expiresAt.setDate(expiresAt.getDate() + plan.durationValue * 7);
          break;
        case "month":
          expiresAt.setMonth(expiresAt.getMonth() + plan.durationValue);
          break;
        case "year":
          expiresAt.setFullYear(expiresAt.getFullYear() + plan.durationValue);
          break;
      }

      // ⚡ If user already had time left and is renewing → extend instead of overwrite
      if (user.expiresAt && user.expiresAt > new Date()) {
        expiresAt = new Date(user.expiresAt); // start from old expiry
        switch (plan.durationType) {
          case "day":
            expiresAt.setDate(expiresAt.getDate() + plan.durationValue);
            break;
          case "week":
            expiresAt.setDate(expiresAt.getDate() + plan.durationValue * 7);
            break;
          case "month":
            expiresAt.setMonth(expiresAt.getMonth() + plan.durationValue);
            break;
          case "year":
            expiresAt.setFullYear(expiresAt.getFullYear() + plan.durationValue);
            break;
        }
      }

      // 2️⃣ Update user details
      user.plan = plan._id;
      user.status = "active";
      user.expiresAt = expiresAt;
      await user.save();

      // 3️⃣ Update transaction
      await Transaction.findOneAndUpdate(
        { stripeSessionId: session.id },
        {
          stripePaymentId: session.payment_intent,
          status: "succeeded",
        }
      );

      // 4️⃣ Send success email
      await sendPaymentSuccessEmail(user);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};