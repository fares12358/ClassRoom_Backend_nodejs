import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cors from 'cors';
import AuthRoutes from './routes/AuthRoutes.js';
import paymentRoutes from "./routes/paymentRoutes.js";
import bodyParser from "body-parser";

const PORT = process.env.PORT || 5000;
const app = express();
// Use JSON except for webhook
app.use("/api/payment/webhook", bodyParser.raw({ type: "application/json" }));
app.use(express.json());
app.use(cors({
  // origin: process.env.FRONT_BASE_URL, // ✅ Allow requests only from this origin (frontend)
  // credentials: true                // ✅ Allow cookies, tokens, or headers like Authorization
}));

dotenv.config();
// Connect to MongoDB
connectDB();


// Routes

// Auth routes
app.use('/api/auth', AuthRoutes);
app.use("/api/payment", paymentRoutes);

app.get('/', (req, res) => {
  res.send('Hello, aamana Backend!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});