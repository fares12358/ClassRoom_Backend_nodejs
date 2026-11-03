import rateLimit from "express-rate-limit";

/**
 * Rate limiters.
 *
 * Store: in memory by default (per process — on Vercel serverless each instance
 * has its own counters). Set REDIS_URL to share counters across instances
 * (Upstash / any Redis). If Redis is unreachable the limiters fail OPEN
 * (requests are allowed) rather than taking the API down.
 */
let makeStore = () => undefined;

if (process.env.REDIS_URL) {
  const { createClient } = await import("redis");
  const { RedisStore } = await import("rate-limit-redis");
  const client = createClient({ url: process.env.REDIS_URL });
  client.on("error", (err) => console.error("Redis (rate limit) error:", err.message));
  client.connect().catch((err) => console.error("Redis connect failed:", err.message));
  makeStore = (name) =>
    new RedisStore({ sendCommand: (...args) => client.sendCommand(args), prefix: `rl:${name}:` });
}

const tooMany = (message) => (req, res) => res.status(429).json({ message });

const mk = (name, { windowMs, limit, message, keyGenerator, ...rest }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    passOnStoreError: true,
    store: makeStore(name),
    ...(keyGenerator ? { keyGenerator } : {}),
    handler: tooMany(message),
    ...rest,
  });

const MIN15 = 15 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const emailKey = (req) => String(req.body?.email ?? "none").toLowerCase();

// ── Payments ─────────────────────────────────────────────────────────────────
// Per client IP: caps Stripe session creation and outgoing payment emails.
export const paymentIpLimiter = mk("pay-ip", {
  windowMs: MIN15, limit: 10, message: "Too many payment requests, please try again later",
});
// Per target account (pendingId / id in the body), regardless of IP.
export const paymentTargetLimiter = mk("pay-target", {
  windowMs: HOUR, limit: 5, message: "Too many attempts for this account, please try again later",
  keyGenerator: (req) => String(req.body?.pendingId || req.body?.id || "none"),
});
// Authenticated renewal endpoint: keyed by user, not IP.
export const subscriptionLimiter = mk("subscribe", {
  windowMs: MIN15, limit: 10, message: "Too many subscription requests, please try again later",
  keyGenerator: (req) => String(req.user?.userId || "anon"),
});

// ── Password reset ───────────────────────────────────────────────────────────
export const otpRequestIpLimiter = mk("otp-req-ip", { windowMs: HOUR, limit: 10, message: "Too many requests, please try again later" });
export const otpRequestEmailLimiter = mk("otp-req-email", { windowMs: HOUR, limit: 3, message: "Too many requests, please try again later", keyGenerator: emailKey });
export const otpVerifyIpLimiter = mk("otp-verify-ip", { windowMs: MIN15, limit: 20, message: "Too many attempts, please try again later" });
export const otpVerifyEmailLimiter = mk("otp-verify-email", { windowMs: MIN15, limit: 10, message: "Too many attempts, please try again later", keyGenerator: emailKey });

export const otpRequestLimiters = [otpRequestIpLimiter, otpRequestEmailLimiter];
export const otpVerifyLimiters = [otpVerifyIpLimiter, otpVerifyEmailLimiter];

// ── Login brute force ────────────────────────────────────────────────────────
// Only failed credentials (401) count; successful logins and other statuses don't.
const failedLogin = { requestWasSuccessful: (req, res) => res.statusCode !== 401, skipSuccessfulRequests: true };

export const loginIpLimiter = mk("login-ip", { windowMs: MIN15, limit: 20, message: "Too many failed login attempts, please try again later", ...failedLogin });
// Per target account, so a distributed attack on one account is also capped
export const loginEmailLimiter = mk("login-email", { windowMs: MIN15, limit: 5, message: "Too many failed login attempts for this account, please try again later", keyGenerator: emailKey, ...failedLogin });
export const loginLimiters = [loginIpLimiter, loginEmailLimiter];

// ── Class join codes: stop guessing, keyed by the authenticated student ──────
export const joinClassLimiter = mk("join-class", {
  windowMs: MIN15, limit: 10, message: "Too many join attempts, please try again later",
  keyGenerator: (req) => String(req.user?._id || "anon"),
});
