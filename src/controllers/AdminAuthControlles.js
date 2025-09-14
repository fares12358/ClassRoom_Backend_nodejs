import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import { sendOTPEmail } from "./emailController.js";
import Transaction from "../models/Transaction.js";

// Add new admin
export const addAdmin = async (req, res) => {
    const { name, email,phone, password, role } = req.body;
    try {
        const existing = await Admin.findOne({ email });
        if (existing) return res.status(400).json({ message: "Admin already exists" });

        // Hash password here
        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = new Admin({
            name,
            email,
            phone,
            password: hashedPassword, // hashed in controller
            role: role || "admin",
        });

        await admin.save();
        res.status(201).json({ message: "Admin added successfully", admin });
    } catch (error) {
        res.status(500).json({ message: "Error adding admin", error: error.message });
    }
};

// Admin login
export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email});
        if (!admin) return res.status(401).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        const token = jwt.sign(
            { id: admin._id, role: admin.role, email: admin.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            message: "Admin login successful",
            accessToken: token,
            admin: {
                id: admin._id,
                name: admin.name,
                phone:admin.phone,
                email: admin.email,
                role: admin.role,
                status: admin.status,
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Login failed", error: err.message });
    }
};

export const reloginAdmin = async (req, res) => {
    const authHeader = req.headers.authorization;
  
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  
    const token = authHeader.split(" ")[1];
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      const admin = await Admin.findById(decoded.id).select("-password -resetOTP -resetOTPExpires");
      if (!admin) return res.status(401).json({ message: "Admin not found" });
  
      res.status(200).json({ admin });
    } catch (err) {
      res.status(401).json({ message: "Invalid or expired token" });
    }
  };

// Get all admins
export const getAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().select("-password");
        res.json({ admins });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch admins", error: err.message });
    }
};

// Update admin info
export const updateAdmin = async (req, res) => {
    const { adminId } = req.params;
    const { name,phone, email, password, role, status } = req.body;

    try {
        const admin = await Admin.findById(adminId);
        if (!admin) return res.status(404).json({ message: "Admin not found" });

        if (name) admin.name = name;
        if (email) admin.email = email;
        if (role) admin.role = role;
        if (status) admin.status = status;
        if (phone) admin.phone = phone;
        if (password) admin.password = await bcrypt.hash(password, 10);

        await admin.save();
        res.json({ message: "Admin updated successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to update admin", error: err.message });
    }
};

// Delete admin
export const deleteAdmin = async (req, res) => {
    const { adminId } = req.params;

    try {
        const admin = await Admin.findByIdAndDelete(adminId);
        if (!admin) return res.status(404).json({ message: "Admin not found" });

        res.json({ message: "Admin deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete admin", error: err.message });
    }
};


export const forgotAdminPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(404).json({ message: "Admin not found" });

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        admin.resetOTP = otp;
        admin.resetOTPExpires = expiry;
        await admin.save();

        const encodedEmail = encodeURIComponent(admin.email);
        const resetLink = `${process.env.FRONTEND_URL}/Pages/Auth/reset-password/${encodedEmail}/${otp}`;

        await sendOTPEmail(admin, otp, resetLink);

        res.json({ message: "OTP sent to your email" });
    } catch (err) {
        res.status(500).json({ message: "Failed to send OTP", error: err.message });
    }
};

// --- Reset Password ---
export const resetAdminPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (!admin || !admin.resetOTP || !admin.resetOTPExpires)
            return res.status(400).json({ message: "Invalid or expired OTP" });

        if (admin.resetOTP !== otp)
            return res.status(400).json({ message: "Incorrect OTP" });

        if (admin.resetOTPExpires < new Date())
            return res.status(400).json({ message: "OTP expired" });

        // Hash new password
        admin.password = await bcrypt.hash(newPassword, 10);

        // Clear OTP
        admin.resetOTP = null;
        admin.resetOTPExpires = null;

        await admin.save();

        res.json({ message: "Password reset successful" });
    } catch (err) {
        res.status(500).json({ message: "Password reset failed", error: err.message });
    }
};



/**
 * Get all transactions (admin)
 */
export const getAllTransactions = async (req, res) => {
    try {
      const transactions = await Transaction.find()
        .populate("user", "name email")       // populate user name & email
        .populate("pendingUser", "name email") // optional before activation
        .populate("plan", "title price durationValue durationType") // plan details
        .sort({ createdAt: -1 }); // newest first
  
      res.status(200).json({ success: true, data: transactions });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Failed to fetch transactions" });
    }
  };