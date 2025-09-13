import express from "express";
import { adminMiddleware, authMiddleware } from "../middleware/authMiddleware.js";
import { addAdmin, deleteAdmin, forgotAdminPassword, getAdmins, loginAdmin, reloginAdmin, resetAdminPassword, updateAdmin } from "../controllers/AdminAuthControlles.js";

const router = express.Router();

// Admin login (public)
router.post("/login", loginAdmin);
router.get("/me", reloginAdmin);

router.post("/forgot-password", forgotAdminPassword);
router.post("/reset-password", resetAdminPassword);

// Protect all other routes
// router.use(authMiddleware);
// router.use(adminMiddleware);

// Admin management routes
router.post("/add", addAdmin);
router.get("/", getAdmins);
router.put("/:adminId", updateAdmin);
router.delete("/:adminId", deleteAdmin);


export default router;
