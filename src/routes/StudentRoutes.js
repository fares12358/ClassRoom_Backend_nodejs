import express from "express";
import { getAllFilesClass, getFilesClasses, getStudentClasses, getStudentVideoById, getStudentVideos, joinClass } from "../controllers/StudentControlles.js";

const router = express.Router();


router.post("/join-class", joinClass);
router.get("/:studentId/classes", getStudentClasses);
router.get("/class/:classId/files/:pdfId", getFilesClasses);
router.get("/class/:classId/Allfiles", getAllFilesClass);
// need authMiddleware
router.get("/class/:classId/videos", getStudentVideos);
router.get("/class/:classId/video/:videoId", getStudentVideoById);

export default router;
