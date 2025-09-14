import express from "express";
import { joinClass } from "../controllers/StudentControlles.js";

const router = express.Router();

router.post("/join-class", joinClass);

export default router;
