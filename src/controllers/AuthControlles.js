import bcrypt from "bcrypt";
import User from "../models/Users.js";
import PendingUser from "../models/PendingUser.js";
import Plan from "../models/Plan.js";
import { generateAccessToken } from "../utils/tokens.js";

/**
 * Create pending user before payment
 */
export const createPendingUser = async (req, res) => {
  const { name, email, phone, password, planId } = req.body;

  try {
    const existing = await PendingUser.findOne({ email }) || await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const plan = await Plan.findById(planId);
    if (!plan) return res.status(400).json({ message: "Invalid plan selected" });

    const hashed = await bcrypt.hash(password, 10);
    const pendingUser = new PendingUser({ name, email, phone, password: hashed, planId });
    await pendingUser.save();

    res.status(201).json({ message: "Pending user created", pendingId: pendingUser._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getPendingUser = async (req, res) => {
  try {
    const { pendingId } = req.params;
    const pendingUser = await PendingUser.findById(pendingId).populate("planId");

    if (!pendingUser) {
      return res.status(404).json({ message: "Pending payment not found" });
    }

    res.status(200).json(pendingUser);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending payment", error: error.message });
  }
}
/**
 * Check signup status using pendingId
 */
export const getSignupStatus = async (req, res) => {
  try {
    const { pendingId } = req.params;
    const pending = await PendingUser.findById(pendingId).populate("planId");

    if (pending) return res.json({ status: "pending", plan: pending.planId });

    const user = await User.findById(pendingId);
    if (user) return res.json({ status: "active", user: { id: user._id, email: user.email } });

    res.json({ status: "not_found" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * Login only active users
 */

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // Check if subscription expired
    if (user.expiresAt && new Date() > user.expiresAt) {
      user.status = "pending"; // expire account
      await user.save();
    }

    const accessToken = generateAccessToken(user);

    res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        plan: user.plan,
        expiresAt: user.expiresAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login error", error: error.message });
  }
};


export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    user.resetOTP = otp;
    user.resetOTPExpires = expiry;
    await user.save();

    await sendEmail(
      email,
      'Password Reset OTP',
      `<p>Your OTP code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`
    );

    res.json({ message: 'OTP sent to email' });

  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP', error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.resetOTP || !user.resetOTPExpires)
      return res.status(400).json({ message: 'Invalid or expired OTP' });

    if (user.resetOTP !== otp)
      return res.status(400).json({ message: 'Incorrect OTP' });

    if (user.resetOTPExpires < new Date())
      return res.status(400).json({ message: 'OTP expired' });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.resetOTP = null;
    user.resetOTPExpires = null;

    await user.save();

    res.json({ message: 'Password reset successful' });

  } catch (error) {
    res.status(500).json({ message: 'Reset failed', error: error.message });
  }
};
