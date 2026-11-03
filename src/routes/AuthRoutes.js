import express from 'express';
import { loginUser, getSignupStatus, createPendingUser, forgotPassword, resetPassword, getPendingUser, logoutUser } from '../controllers/AuthControlles.js';

import { otpRequestLimiters, otpVerifyLimiters, loginLimiters } from '../middleware/rateLimiters.js';
import { validateBody, objectIdParams } from '../middleware/validate.js';
import { authMiddleware, studentTokenMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post("/pending", validateBody({ name: { type: "string", max: 100 }, email: "email", phone: "string?", password: { type: "string", min: 8, max: 128 }, planId: "objectId" }), createPendingUser); // create pending user before payment
objectIdParams(router);

router.get("/pending/:pendingId", getPendingUser); // get pendinguse for cancel redirct
router.get("/status/:id", getSignupStatus); // check signup status

router.post("/login", loginLimiters, validateBody({ email: "string", password: { type: "string", max: 128 }, deviceToken: "string?" }), loginUser); // login user app flutter
router.post("/logout", authMiddleware, studentTokenMiddleware, logoutUser); // logout user app flutter

router.post('/forgot-password', otpRequestLimiters, forgotPassword);
router.post('/reset-password', otpVerifyLimiters, resetPassword);

export default router;