import jwt from "jsonwebtoken";

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

// Check admin role
export const adminMiddleware = (req, res, next) => {
  if (!req.user || !["admin", "super-admin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }
  next();
};
