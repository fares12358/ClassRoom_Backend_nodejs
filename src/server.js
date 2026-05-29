import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
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

app.use(cors({ origin: true, credentials: true }));

// Stripe webhook needs raw body
app.use("/api/payment/webhook", bodyParser.raw({ type: "application/json" }));

// Normal JSON requests
app.use((req, res, next) => {
  if (req.originalUrl === "/api/payment/webhook") next();
  else express.json()(req, res, next);
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
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));