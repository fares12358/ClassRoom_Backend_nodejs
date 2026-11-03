import test from "node:test";
import assert from "node:assert/strict";
process.env.JWT_SECRET = "test-secret";
const { issueResetOtp, consumeResetOtp, OTP_MAX_ATTEMPTS } = await import("../src/utils/otp.js");

test("OTP is 6 digits and stored hashed", () => {
  const doc = {};
  const otp = issueResetOtp(doc);
  assert.match(otp, /^\d{6}$/);
  assert.notEqual(doc.resetOTP, otp);
  assert.equal(doc.resetOTP.length, 64);
});

test("correct OTP works once", () => {
  const doc = {};
  const otp = issueResetOtp(doc);
  assert.equal(consumeResetOtp(doc, otp), true);
  assert.equal(consumeResetOtp(doc, otp), false);
});

test("OTP is invalidated after too many wrong guesses", () => {
  const doc = {};
  const otp = issueResetOtp(doc);
  const wrong = otp === "000000" ? "111111" : "000000";
  for (let i = 0; i < OTP_MAX_ATTEMPTS; i++) assert.equal(consumeResetOtp(doc, wrong), false);
  assert.equal(consumeResetOtp(doc, otp), false);
});

test("expired OTP is rejected; missing doc is rejected", () => {
  const doc = {};
  const otp = issueResetOtp(doc);
  doc.resetOTPExpires = new Date(Date.now() - 1);
  assert.equal(consumeResetOtp(doc, otp), false);
  assert.equal(consumeResetOtp(null, "123456"), false);
});
