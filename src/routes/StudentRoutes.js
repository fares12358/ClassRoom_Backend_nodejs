import express from "express";
import { getAllFilesClass, getAllTasksForStudent, getFilesClasses, getStudentClasseNote, getStudentClasses, getStudentData, getStudentPlan, getStudentVideoById, getStudentVideos, getTaskForStudent, joinClass, submitTaskSolution, updateStudentData } from "../controllers/StudentControlles.js";
import { validateBody, objectIdParams, sanitizeBody } from "../middleware/validate.js";
import { joinClassLimiter } from "../middleware/rateLimiters.js";
import upload from "../middleware/multer.js";
import { userActiveMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

objectIdParams(router);
router.use(userActiveMiddleware);

// ── Ownership guards ─────────────────────────────────────────────────────────
// req.user is the DB user loaded by userActiveMiddleware.
// :studentId must be the authenticated student.
const ownStudent = (req, res, next) =>
    req.params.studentId === String(req.user._id)
        ? next()
        : res.status(403).json({ message: "Forbidden" });

// :classId must be a class the authenticated student has joined.
const enrolled = (req, res, next) =>
    (req.user.classes || []).some((c) => String(c) === req.params.classId)
        ? next()
        : res.status(403).json({ message: "You are not enrolled in this class" });


//class
router.post("/join-class", joinClassLimiter, validateBody({ classId: "objectId", joinCode: { type: "string", max: 32 } }), joinClass);
router.get("/:studentId/classes", ownStudent, getStudentClasses);

// profile
router.get("/:studentId/data", ownStudent, getStudentData);
router.put("/:studentId/updateUser", ownStudent, validateBody({ name: { type: "string?", max: 100 }, phone: "string?", email: "email?", password: { type: "string?", min: 8, max: 128 } }), updateStudentData);
router.get("/plan/:planId", getStudentPlan);
//notes
router.get("/classes/:classId/notes", enrolled, getStudentClasseNote);
//files
router.get("/class/:classId/files/:pdfId", enrolled, getFilesClasses);
router.get("/class/:classId/Allfiles", enrolled, getAllFilesClass);
//taskes
router.get("/class/:classId/tasks", enrolled, getAllTasksForStudent);
router.get("/class/:classId/task/:taskId", enrolled, getTaskForStudent);
//recived
router.post(
    "/:studentId/class/:classId/task/:taskId/solution",
    ownStudent,
    enrolled,
    upload.single("solution"),
    sanitizeBody,
    submitTaskSolution
);

router.get("/class/:classId/videos", enrolled, getStudentVideos);
router.get("/class/:classId/video/:videoId", enrolled, getStudentVideoById);

export default router;
