/**
 * patchedControllers.js
 *
 * ─── WHY THIS FILE EXISTS ─────────────────────────────────────────────────────
 * The original AdminAuthControlles.js has two critical bugs:
 *
 *  1. deleteVideo()  — reads req.headers.authorization as a YouTube OAuth token.
 *     After the frontend fix, that header now carries the admin JWT, which is
 *     NOT a valid YouTube access token.  Passing it to the YouTube API causes a
 *     401 and could leak the JWT.
 *
 *  2. deleteClasses() — same issue: tries to use the admin JWT as a YouTube
 *     access_token when deleting embedded videos inside a class.
 *
 * FIX: Both functions now use YOUTUBE_REFRESH_TOKEN from .env (server-side
 * OAuth) to obtain a fresh YouTube access token when needed, and never touch
 * req.headers.authorization for YouTube purposes.  If YOUTUBE_REFRESH_TOKEN is
 * not set, YouTube deletion is skipped gracefully (the video record is still
 * removed from MongoDB).
 * ──────────────────────────────────────────────────────────────────────────────
 */

import Class from "../models/Class.js";
import Users from "../models/Users.js";
import cloudinary from "../config/cloudinary.js";
import { google } from "googleapis";

/** Build an authenticated YouTube client using the server-side refresh token */
const getYouTubeClient = () => {
    if (!process.env.YOUTUBE_REFRESH_TOKEN) return null;
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });
    return google.youtube({ version: "v3", auth: oauth2Client });
};

/** Attempt to delete a single YouTube video by ID.  Failures are non-fatal. */
const tryDeleteYouTubeVideo = async (videoId) => {
    const youtube = getYouTubeClient();
    if (!youtube) {
        console.warn("⚠️  YOUTUBE_REFRESH_TOKEN not configured — skipping YouTube delete for", videoId);
        return;
    }
    try {
        await youtube.videos.delete({ id: videoId });
        console.log("✅ YouTube video deleted:", videoId);
    } catch (err) {
        console.warn("⚠️  YouTube delete failed (non-fatal):", err.response?.data?.error?.message || err.message);
    }
};

// ── FIXED: deleteVideo ────────────────────────────────────────────────────────
export const deleteVideo = async (req, res) => {
    try {
        const { classId, videoId } = req.params;

        const classroom = await Class.findById(classId);
        if (!classroom) return res.status(404).json({ message: "Class not found" });

        const video = classroom.videos.id(videoId);
        if (!video) return res.status(404).json({ message: "Video not found" });

        // Delete from YouTube (uses env refresh token, never the admin JWT)
        await tryDeleteYouTubeVideo(video.videoId);

        // Remove from MongoDB
        classroom.videos = classroom.videos.filter(v => v._id.toString() !== videoId);
        await classroom.save();

        res.status(200).json({ message: "Video deleted successfully" });
    } catch (err) {
        console.error("❌ Error deleting video:", err);
        res.status(500).json({ message: err.message });
    }
};

// ── FIXED: deleteClasses ──────────────────────────────────────────────────────
export const deleteClasses = async (req, res) => {
    try {
        const { id } = req.params;

        const classDoc = await Class.findById(id);
        if (!classDoc) return res.status(404).json({ success: false, message: "Class not found" });

        // 1️⃣  Delete YouTube videos (server-side auth, never the admin JWT)
        for (const video of classDoc.videos) {
            await tryDeleteYouTubeVideo(video.videoId);
        }

        // 2️⃣  Delete PDFs from Cloudinary
        for (const pdf of classDoc.pdfs) {
            if (pdf.public_id) {
                try {
                    await cloudinary.uploader.destroy(pdf.public_id, {
                        resource_type: "raw",
                        type: "private",
                    });
                } catch (e) {
                    console.warn("⚠️  Cloudinary PDF delete failed:", e.message);
                }
            }
        }

        // 3️⃣  Delete task files + submissions from Cloudinary
        for (const task of classDoc.tasks) {
            if (task.public_id) {
                try {
                    await cloudinary.uploader.destroy(task.public_id, {
                        resource_type: "raw",
                        type: "private",
                    });
                } catch (e) {
                    console.warn("⚠️  Cloudinary task delete failed:", e.message);
                }
            }
            for (const sub of task.submissions || []) {
                if (sub.public_id) {
                    try {
                        await cloudinary.uploader.destroy(sub.public_id, {
                            resource_type: "raw",
                            type: "private",
                        });
                    } catch (e) {
                        console.warn("⚠️  Cloudinary submission delete failed:", e.message);
                    }
                }
            }
        }

        // 4️⃣  Remove class reference from all students
        await Users.updateMany({ classes: id }, { $pull: { classes: id } });

        // 5️⃣  Delete class from DB
        await Class.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Class and all related data deleted successfully",
        });
    } catch (err) {
        console.error("❌ Error deleting class:", err);
        res.status(500).json({ success: false, message: "Failed to delete class" });
    }
};
