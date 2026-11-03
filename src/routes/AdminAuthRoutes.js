import express from "express";
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware.js";

// ── All original controllers ──────────────────────────────────────────────────
import {
    addAdmin, addClasses, addFilesClass, addNoteClasses, addTaskClass,
    deleteAdmin, deleteFilesClass, deleteNoteClasses,
    deleteTaskClass, forgotAdminPassword, getAdminBYID,
    getAdmins, getAllClasses, getAllFilesClass, getAllStudents, getAllTasksClass,
    getAllTransactions, getclassByID, getdashReport, getFilesClass, gethomeReport,
    getNotesClasses, getStudentClasses, getTaskClass, getTaskesSubmissions,
    getTaskSubmissionsAdmin, getVideos, KickStudentClasses, loginAdmin,
    pendingUsers, reloginAdmin, resendPaymentLink, resetAdminPassword, updateAdmin,
    updateClassByID, updateFilesClass, updateNoteClasses, updateTaskClass, uploadVideo
} from "../controllers/AdminAuthControlles.js";

// ── Patched controllers (fixes YouTube-token / admin-JWT conflict) ────────────
import {
    deleteVideo,
    deleteClasses,
} from "../controllers/patchedControllers.js";

import { otpRequestLimiters, otpVerifyLimiters, loginLimiters } from "../middleware/rateLimiters.js";
import { validateBody, objectIdParams, sanitizeBody } from "../middleware/validate.js";
import { regenerateJoinCode } from "../controllers/joinCodeController.js";
import upload from "../middleware/multer.js";

const router = express.Router();
objectIdParams(router);

// ── Public routes (no auth required) ─────────────────────────────────────────
router.post("/login",           loginLimiters, validateBody({ email: "string", password: { type: "string", max: 128 } }), loginAdmin);
router.get("/me",               reloginAdmin);
router.post("/forgot-password", otpRequestLimiters, forgotAdminPassword);
router.post("/reset-password",  otpVerifyLimiters, resetAdminPassword);

// ── All routes below require a valid ADMIN JWT (student tokens are rejected) ──
router.use(authMiddleware, adminMiddleware);

// ── Admin management ──────────────────────────────────────────────────────────
const superAdminOnly = (req, res, next) =>
    req.user.role === "super-admin"
        ? next()
        : res.status(403).json({ message: "Forbidden: Super-admins only" });

// An admin may read/update their own record; anything else needs super-admin.
const selfOrSuperAdmin = (param) => (req, res, next) => {
    if (req.user.role === "super-admin" || req.user.id === req.params[param]) return next();
    return res.status(403).json({ message: "Forbidden" });
};

// Non-super-admins cannot change their own role or status.
const stripPrivilegedFields = (req, res, next) => {
    if (req.user.role !== "super-admin" && req.body) {
        delete req.body.role;
        delete req.body.status;
    }
    next();
};

router.post("/auth/add",         superAdminOnly, validateBody({ name: { type: "string", max: 100 }, email: "email", phone: "string?", password: { type: "string", min: 8, max: 128 }, role: { type: "string", oneOf: ["admin", "super-admin"], optional: true } }), addAdmin);
router.get("/auth",              superAdminOnly, getAdmins);
router.get("/auth/:id",          selfOrSuperAdmin("id"), getAdminBYID);
router.put("/auth/:adminId",     selfOrSuperAdmin("adminId"), stripPrivilegedFields, validateBody({ name: "string?", phone: "string?", email: "email?", password: { type: "string?", min: 8, max: 128 }, role: { type: "string", oneOf: ["admin", "super-admin"], optional: true }, status: { type: "string", oneOf: ["active", "inactive"], optional: true } }), updateAdmin);
router.delete("/auth/:adminId",  superAdminOnly, deleteAdmin);

// ── Transactions ──────────────────────────────────────────────────────────────
router.get("/transactions", getAllTransactions);

// ── Students ──────────────────────────────────────────────────────────────────
router.get("/students", getAllStudents);

// ── Pending users ─────────────────────────────────────────────────────────────
router.get("/pendingUsers",          pendingUsers);
router.post("/resend-payment-link",  resendPaymentLink);

// ── Classes ───────────────────────────────────────────────────────────────────
router.post("/classe/add",    validateBody({ name: { type: "string", max: 200 }, description: "string?" }), addClasses);
router.get("/classes",        getAllClasses);
router.post("/classe/:id/join-code", regenerateJoinCode);
router.get("/classe/:id",     getclassByID);
router.put("/classe/:id",     validateBody({ name: "string?", description: "string?", status: { type: "string", oneOf: ["active", "pending"], optional: true } }), updateClassByID);
router.delete("/classe/:id",  deleteClasses);   // ✅ patched — no longer misuses admin JWT

// ── Notes ─────────────────────────────────────────────────────────────────────
router.get("/classe/:id/note",             getNotesClasses);
router.post("/classe/:id/note",            validateBody({ msg: { type: "string", max: 5000 } }), addNoteClasses);
router.put("/classe/:id/note/:noteId",     validateBody({ msg: { type: "string", max: 5000 } }), updateNoteClasses);
router.delete("/classe/:id/note/:noteId",  deleteNoteClasses);

// ── Class students ────────────────────────────────────────────────────────────
router.get("/classe/:id/student",                  getStudentClasses);
router.post("/classe/:classId/student/:studentId", KickStudentClasses);

// ── PDFs ──────────────────────────────────────────────────────────────────────
router.post("/classe/:classId/file",          upload.single("pdf"), sanitizeBody, addFilesClass);
router.put("/classe/:classId/file/:pdfId",    upload.single("pdf"), sanitizeBody, updateFilesClass);
router.delete("/classe/:classId/file/:pdfId", deleteFilesClass);
router.get("/classe/:classId/file/:pdfId",    getFilesClass);
router.get("/classe/:classId/Allfiles",       getAllFilesClass);

// ── Tasks ─────────────────────────────────────────────────────────────────────
router.post("/class/:classId/task",                    upload.single("task"), sanitizeBody, addTaskClass);
router.put("/class/:classId/task/:taskId",              upload.single("task"), sanitizeBody, updateTaskClass);
router.delete("/class/:classId/task/:taskId",           deleteTaskClass);
router.get("/class/:classId/task/:taskId",              getTaskClass);
router.get("/class/:classId/tasks",                     getAllTasksClass);
router.get("/class/:classId/task/:taskId/submissions",  getTaskSubmissionsAdmin);
router.get("/class/:classId/tasks/submissions",         getTaskesSubmissions);

// ── Videos ────────────────────────────────────────────────────────────────────
router.post("/classe/:classId/video",            validateBody({ videoId: { type: "string", max: 50 }, name: "string?", description: "string?" }), uploadVideo);
router.get("/classe/:classId/video",             getVideos);
router.delete("/classe/:classId/video/:videoId", deleteVideo);   // ✅ patched

// ── Reports ───────────────────────────────────────────────────────────────────
router.get("/reportes",    getdashReport);
router.get("/homeReport",  gethomeReport);

export default router;
