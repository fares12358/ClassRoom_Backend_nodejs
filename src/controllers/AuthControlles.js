import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/Users.js';
import { generateAccessToken } from '../utils/tokens.js';
import sendEmail from '../utils/sendEmail.js';
import PendingUserSchema from '../models/PendingUser.js';

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // Generate only access token
    const accessToken = generateAccessToken(user);

    // Save access token in DB (optional)
    user.accessToken = accessToken;
    await user.save();

    // Remove sensitive fields before sending response
    const { password: _, accessToken: __, ...safeUser } = user.toObject();

    res.status(200).json({
      message: "Login successful",
      accessToken, // only access token returned
      user: safeUser,
    });

  } catch (error) {
    res.status(500).json({ message: "Login error", error: error.message });
  }
};

export const getSignupStatus = async (req, res) => {
  try {
    const { pendingId } = req.params;

    const pending = await PendingUserSchema.findById(pendingId);
    if (pending) return res.json({ status: "pending" });

    const user = await User.findOne({ _id: pendingId });
    if (user) return res.json({ status: "created", user: { id: user._id, email: user.email } });

    res.json({ status: "not_found" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.accessToken = accessToken;
    user.refreshToken = refreshToken;

    await user.save();

    res.status(201).json({
      message: 'Registration successful',
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email },
    });

  } catch (error) {
    res.status(500).json({ message: 'Registration error', error: error.message });
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
