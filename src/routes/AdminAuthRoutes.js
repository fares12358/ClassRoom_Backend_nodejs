import express from "express";
import { adminMiddleware, authMiddleware } from "../middleware/authMiddleware.js";
import { addAdmin, deleteAdmin, forgotAdminPassword, getAdmins, getAllTransactions, loginAdmin, reloginAdmin, resetAdminPassword, updateAdmin } from "../controllers/AdminAuthControlles.js";

const router = express.Router();

// Admin login (public)
router.post("/login", loginAdmin);
router.get("/me", reloginAdmin);

router.post("/forgot-password", forgotAdminPassword);
router.post("/reset-password", resetAdminPassword);

// Protect all other routes
// router.use(authMiddleware);

// Admin management routes
router.post("/add", addAdmin);
router.get("/", getAdmins);
router.put("/:adminId", updateAdmin);
router.delete("/:adminId", deleteAdmin);

router.get("/transactions", getAllTransactions);


export default router;
