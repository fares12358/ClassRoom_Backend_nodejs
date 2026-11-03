import jwt from "jsonwebtoken";
import Users from "../models/Users.js";
import Admin from "../models/Admin.js";

// Verify JWT
export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Admin guard: token must be an admin token AND the admin must still exist and be
// active. Role is re-read from the DB so demotions/disabling take effect immediately.
export const adminMiddleware = async (req, res, next) => {
  if (!req.user?.id) return res.status(403).json({ message: "Forbidden: Admins only" });
  try {
    const admin = await Admin.findById(req.user.id).select("role status");
    if (!admin || admin.status !== "active" || !["admin", "super-admin"].includes(admin.role)) {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }
    req.user.role = admin.role;
    next();
  } catch (err) {
    console.error("adminMiddleware error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Require a student token (carries userId). Rejects admin tokens.
// Signature-only on purpose: expired/pending students must still be able to renew.
export const studentTokenMiddleware = (req, res, next) => {
  if (!req.user?.userId) return res.status(403).json({ message: "Forbidden: student token required" });
  next();
};

export const userActiveMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    // Verify and decode the JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.scope === "renew") {
      return res.status(403).json({ message: "Renew-only token" });
    }

    // Get user from MongoDB using ID from token
    const user = await Users.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check user status from DB
    if (user.expiresAt && user.expiresAt < new Date()) {
      return res.status(403).json({ message: "Subscription expired" });
    }
    if (user.status === "pending") {
      return res.status(403).json({ message: "Account pending approval" });
    }
    
    // Attach fresh user object to request
    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Invalid token" });
  }
};