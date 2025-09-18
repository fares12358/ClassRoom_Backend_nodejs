import express from "express";
import { getAllFilesClass, getAllTasksForStudent, getFilesClasses, getStudentClasseNote, getStudentClasses, getStudentVideoById, getStudentVideos, getTaskForStudent, joinClass } from "../controllers/StudentControlles.js";

const router = express.Router();


router.post("/join-class", joinClass);
router.get("/:studentId/classes", getStudentClasses);

router.get("/classes/:classId/notes", getStudentClasseNote);

router.get("/class/:classId/files/:pdfId", getFilesClasses);

router.get("/class/:classId/Allfiles", getAllFilesClass);


router.get("/class/:classId/tasks", getAllTasksForStudent);
router.get("/class/:classId/task/:taskId", getTaskForStudent);

// need authMiddleware
router.get("/class/:classId/videos", getStudentVideos);
router.get("/class/:classId/video/:videoId", getStudentVideoById);

export default router;
