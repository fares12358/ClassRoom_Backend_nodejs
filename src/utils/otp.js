import crypto from "crypto";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

// 6-digit OTP from a CSPRNG
export const generateOtp = () => String(crypto.randomInt(100000, 1000000));

// Only a keyed hash is stored, never the OTP itself
const hashOtp = (otp) =>
  crypto.createHmac("sha256", process.env.JWT_SECRET).update(String(otp)).digest("hex");

/** Create an OTP on a user/admin document (caller saves). Returns the plain OTP to email. */
export const issueResetOtp = (doc) => {
  const otp = generateOtp();
  doc.resetOTP = hashOtp(otp);
  doc.resetOTPExpires = new Date(Date.now() + OTP_TTL_MS);
  doc.resetOTPAttempts = 0;
  return otp;
};

const clear = (doc) => {
  doc.resetOTP = null;
  doc.resetOTPExpires = null;
  doc.resetOTPAttempts = 0;
};

/**
 * Check an OTP. Returns true if valid (and clears it, so it is single use).
 * Wrong guesses are counted; after OTP_MAX_ATTEMPTS the OTP is invalidated.
 * The caller must `await doc.save()` afterwards in every case.
 */
export const consumeResetOtp = (doc, otp) => {
  if (!doc || !doc.resetOTP || !doc.resetOTPExpires) return false;
  if (doc.resetOTPExpires < new Date()) { clear(doc); return false; }

  const a = Buffer.from(hashOtp(otp));
  const b = Buffer.from(doc.resetOTP);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (ok) { clear(doc); return true; }

  doc.resetOTPAttempts = (doc.resetOTPAttempts || 0) + 1;
  if (doc.resetOTPAttempts >= OTP_MAX_ATTEMPTS) clear(doc);
  return false;
};
