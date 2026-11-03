import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import helmet from "helmet";
import crypto from "crypto";
import { startCleanupJob, cleanExpiredUsers } from "./controllers/handleAutoManage.js";
import { sanitizeBody } from "./middleware/validate.js";
import connectDB from "./config/db.js";
import AuthRoutes from "./routes/AuthRoutes.js";
import PaymentRoutes from "./routes/paymentRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import AdminAuthRoutes from "./routes/AdminAuthRoutes.js";
import StudentRoutes from "./routes/StudentRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
connectDB();

const app = express();

// Behind Vercel's proxy: use the real client IP (needed by rate limiting)
app.set("trust proxy", 1);

// CORS allowlist: FRONTEND_URL + optional CORS_ORIGINS (comma-separated).
// Requests without an Origin header (mobile app, Stripe webhook, curl) are not
// subject to CORS and are allowed through.
const allowedOrigins = new Set(
  [process.env.FRONTEND_URL, ...(process.env.CORS_ORIGINS || "").split(",")]
    .map((o) => o && o.trim().replace(/\/+$/, ""))
    .filter(Boolean)
);
if (process.env.NODE_ENV !== "production") allowedOrigins.add("http://localhost:3000");

app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.has(origin)),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  })
);

// Security headers (CSP off: /api/docs loads the Tailwind CDN and inline scripts)
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Stripe webhook needs raw body
app.use("/api/payment/webhook", bodyParser.raw({ type: "application/json" }));

// Normal JSON requests
app.use((req, res, next) => {
  if (req.originalUrl === "/api/payment/webhook") next();
  else express.json({ limit: "100kb" })(req, res, next);
});

// Strip $-operators / dotted keys from every JSON body
app.use(sanitizeBody);

// Vercel Cron (see vercel.json) calls this with "Authorization: Bearer $CRON_SECRET".
// Disabled (404) unless CRON_SECRET is set.
app.get("/api/cron/cleanup", async (req, res) => {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.authorization || "";
  if (!secret) return res.status(404).json({ message: "Not found" });
  const ok = given.length === `Bearer ${secret}`.length &&
    crypto.timingSafeEqual(Buffer.from(given), Buffer.from(`Bearer ${secret}`));
  if (!ok) return res.status(401).json({ message: "Unauthorized" });
  res.json({ ok: true, ...(await cleanExpiredUsers()) });
});

app.use("/api/auth", AuthRoutes);
app.use("/api/payment", PaymentRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/admin", AdminAuthRoutes);
app.use("/api/student", StudentRoutes);

// Serve API documentation
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/api/docs", express.static(path.join(__dirname, "docs")));
app.get("/api/docs", (req, res) => {
  res.sendFile(path.join(__dirname, "docs", "docs.html"));
});

app.get("/", (req, res) => res.send("🚀 Backend running!"));

const PORT = process.env.PORT || 5000;
if (process.env.ENABLE_CRON === "true") startCleanupJob(); // opt-in; needs a long-running host (not Vercel serverless)

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));