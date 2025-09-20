import express from "express";
import { getAllFilesClass, getAllTasksForStudent, getFilesClasses, getStudentClasseNote, getStudentClasses, getStudentVideoById, getStudentVideos, getTaskForStudent, joinClass, submitTaskSolution, updateStudentData } from "../controllers/StudentControlles.js";
import upload from "../middleware/multer.js";
const router = express.Router();

router.post("/join-class", joinClass);

router.get("/:studentId/classes", getStudentClasses);

router.put("/:studentId/updateUser", updateStudentData);
//notes
router.get("/classes/:classId/notes", getStudentClasseNote);
//files
router.get("/class/:classId/files/:pdfId", getFilesClasses);
router.get("/class/:classId/Allfiles", getAllFilesClass);
//taskes
router.get("/class/:classId/tasks", getAllTasksForStudent);
router.get("/class/:classId/task/:taskId", getTaskForStudent);
//recived
router.post(
    "/class/:classId/task/:taskId/solution",
    upload.single("solution"),
    submitTaskSolution
);

// need authMiddleware
router.get("/class/:classId/videos", getStudentVideos);
router.get("/class/:classId/video/:videoId", getStudentVideoById);

export default router;
