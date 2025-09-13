import express from 'express';
import { loginUser, getSignupStatus, createPendingUser, forgotPassword, resetPassword, getPendingUser } from '../controllers/AuthControlles.js';

const router = express.Router();

router.post("/pending", createPendingUser); // create pending user before payment
router.get("/pending/:pendingId", getPendingUser); // get pendinguse for cancel redirct
router.get("/status/:pendingId", getSignupStatus); // check signup status

router.post("/login", loginUser); // login active users

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
