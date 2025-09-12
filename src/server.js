import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import connectDB from "./config/db.js";
import AuthRoutes from "./routes/AuthRoutes.js";
import PaymentRoutes from "./routes/paymentRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: "*" }));

// Stripe webhook needs raw body
app.use("/api/payment/webhook", bodyParser.raw({ type: "application/json" }));

// Normal JSON requests
app.use((req, res, next) => {
  if (req.originalUrl === "/api/payment/webhook") next();
  else express.json()(req, res, next);
});

app.use("/api/auth", AuthRoutes);
app.use("/api/payment", PaymentRoutes);


app.get("/", (req, res) => res.send("🚀 Backend running!"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
