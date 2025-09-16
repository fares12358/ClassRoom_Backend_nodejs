import express from "express";
import { getAllFilesClass, getFilesClasses, joinClass } from "../controllers/StudentControlles.js";

const router = express.Router();

router.post("/join-class", joinClass);
router.get("class/:classId/files/:pdfId", getFilesClasses);
router.get("class/:classId/Allfiles", getAllFilesClass);


export default router;
