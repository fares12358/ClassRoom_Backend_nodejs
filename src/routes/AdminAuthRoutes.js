import express from "express";
import { adminMiddleware, authMiddleware } from "../middleware/authMiddleware.js";
import {
    addAdmin, addClasses, addFilesClass, addNoteClasses,
    deleteAdmin, deleteClasses, deleteFilesClass, deleteNoteClasses, forgotAdminPassword,
    getAdminBYID, getAdmins, getAllClasses, getAllFilesClass, getAllStudents, getAllTransactions,
    getFilesClass,
    getNotesClasses, getStudentClasses, loginAdmin,
    pendingUsers,
    reloginAdmin, resetAdminPassword, updateAdmin, updateClasses, updateFilesClass, updateNoteClasses
} from "../controllers/AdminAuthControlles.js";
import upload from "../middleware/multer.js";

const router = express.Router();

// Admin login (public)
router.post("/login", loginAdmin);
router.get("/me", reloginAdmin);
router.post("/forgot-password", forgotAdminPassword);
router.post("/reset-password", resetAdminPassword);


// Admin management routes
router.post("/auth/add", addAdmin);
router.get("/auth", getAdmins);
router.get("/auth/:id", getAdminBYID);
router.put("/auth/:adminId", updateAdmin);
router.delete("/auth/:adminId", deleteAdmin);

//transactions
router.get("/transactions", getAllTransactions);
//students
router.get("/students", getAllStudents);
//pending users
router.get("/pendingUsers", pendingUsers);

//classes
router.get("/classes", getAllClasses);
router.post("/classes/add", addClasses);
router.put("/classes/:id", updateClasses);
router.delete("/classes/:id", deleteClasses);
// class matrial

//notes
router.get("/classe/:id/note", getNotesClasses);
router.post("/classe/:id/note", addNoteClasses);
router.put("/classe/:id/note/:noteId", updateNoteClasses);
router.delete("/classe/:id/note/:noteId", deleteNoteClasses);

//students
router.get("/classe/:id/student", getStudentClasses);

//bdfs
router.post("/classe/:classId/file", upload.single("pdf"), addFilesClass);
router.put("/classe/:classId/file/:pdfId", upload.single("pdf"),updateFilesClass);
router.delete("/classe/:classId/file/:pdfId",deleteFilesClass);
router.get("/classe/:classId/file/pdfId",getFilesClass);
router.get("/classe/:classId/Allfiles",getAllFilesClass);


export default router;
