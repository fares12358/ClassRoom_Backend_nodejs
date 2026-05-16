import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";

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

import upload from "../middleware/multer.js";

const router = express.Router();

// ── Public routes (no auth required) ─────────────────────────────────────────
router.post("/login",           loginAdmin);
router.get("/me",               reloginAdmin);
router.post("/forgot-password", forgotAdminPassword);
router.post("/reset-password",  resetAdminPassword);

// ── Admin management ──────────────────────────────────────────────────────────
router.post("/auth/add",         addAdmin);
router.get("/auth",              getAdmins);
router.get("/auth/:id",          getAdminBYID);
router.put("/auth/:adminId",     updateAdmin);
router.delete("/auth/:adminId",  deleteAdmin);

// ── All routes below require a valid admin JWT ────────────────────────────────
router.use(authMiddleware);

// ── Transactions ──────────────────────────────────────────────────────────────
router.get("/transactions", getAllTransactions);

// ── Students ──────────────────────────────────────────────────────────────────
router.get("/students", getAllStudents);

// ── Pending users ─────────────────────────────────────────────────────────────
router.get("/pendingUsers",          pendingUsers);
router.post("/resend-payment-link",  resendPaymentLink);

// ── Classes ───────────────────────────────────────────────────────────────────
router.post("/classe/add",    addClasses);
router.get("/classes",        getAllClasses);
router.get("/classe/:id",     getclassByID);
router.put("/classe/:id",     updateClassByID);
router.delete("/classe/:id",  deleteClasses);   // ✅ patched — no longer misuses admin JWT

// ── Notes ─────────────────────────────────────────────────────────────────────
router.get("/classe/:id/note",             getNotesClasses);
router.post("/classe/:id/note",            addNoteClasses);
router.put("/classe/:id/note/:noteId",     updateNoteClasses);
router.delete("/classe/:id/note/:noteId",  deleteNoteClasses);

// ── Class students ────────────────────────────────────────────────────────────
router.get("/classe/:id/student",                  getStudentClasses);
router.post("/classe/:classId/student/:studentId", KickStudentClasses);

// ── PDFs ──────────────────────────────────────────────────────────────────────
router.post("/classe/:classId/file",          upload.single("pdf"), addFilesClass);
router.put("/classe/:classId/file/:pdfId",    upload.single("pdf"), updateFilesClass);
router.delete("/classe/:classId/file/:pdfId", deleteFilesClass);
router.get("/classe/:classId/file/:pdfId",    getFilesClass);
router.get("/classe/:classId/Allfiles",       getAllFilesClass);

// ── Tasks ─────────────────────────────────────────────────────────────────────
router.post("/class/:classId/task",                    upload.single("task"), addTaskClass);
router.put("/class/:classId/task/:taskId",              upload.single("task"), updateTaskClass);
router.delete("/class/:classId/task/:taskId",           deleteTaskClass);
router.get("/class/:classId/task/:taskId",              getTaskClass);
router.get("/class/:classId/tasks",                     getAllTasksClass);
router.get("/class/:classId/task/:taskId/submissions",  getTaskSubmissionsAdmin);
router.get("/class/:classId/tasks/submissions",         getTaskesSubmissions);

// ── Videos ────────────────────────────────────────────────────────────────────
router.post("/classe/:classId/video",            uploadVideo);
router.get("/classe/:classId/video",             getVideos);
router.delete("/classe/:classId/video/:videoId", deleteVideo);   // ✅ patched

// ── Reports ───────────────────────────────────────────────────────────────────
router.get("/reportes",    getdashReport);
router.get("/homeReport",  gethomeReport);

export default router;
