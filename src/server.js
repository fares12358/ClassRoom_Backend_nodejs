import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cors from 'cors';
import AuthRoutes from './routes/AuthRoutes.js';
import paymentRoutes from "./routes/paymentRoutes.js";
import bodyParser from "body-parser";

// ✅ Load env first
dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();
app.use(cors({
  origin: "*"
}));

// ✅ Stripe webhook needs raw body
app.use("/api/payment/webhook", bodyParser.raw({ type: "application/json" }));

// ✅ Normal requests use JSON
app.use((req, res, next) => {
  if (req.originalUrl === "/api/payment/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});


// ✅ Connect MongoDB
connectDB();

// ✅ Routes
app.use('/api/auth', AuthRoutes);
app.use("/api/payment", paymentRoutes);

app.get('/', (req, res) => {
  res.send('🚀 Aamana Backend running with Stripe + Auth!');
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

export default app;
