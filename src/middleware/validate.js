import mongoose from "mongoose";

const isObjectId = (v) => typeof v === "string" && mongoose.isValidObjectId(v) && /^[a-f\d]{24}$/i.test(v);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Recursively delete keys that start with "$" or contain "." so user input can
 * never become a MongoDB operator or a dotted-path update (NoSQL injection).
 * Mutates in place; req.query is not touched (read-only getter in Express 5).
 */
const strip = (obj, depth = 0) => {
  if (!obj || typeof obj !== "object" || depth > 10) return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) delete obj[key];
    else strip(obj[key], depth + 1);
  }
};

export const sanitizeBody = (req, res, next) => {
  if (Buffer.isBuffer(req.body)) return next(); // Stripe webhook raw body
  strip(req.body);
  next();
};

/**
 * validateBody({ field: rule, ... })
 * rule = "string" | "email" | "objectId" | "number" | { type, optional, min, max, oneOf }
 * Add "?" to a shorthand for optional, e.g. "string?".
 * Fields not listed are left alone; listed fields are type-checked, so an object
 * can never reach a query where a string is expected.
 */
export const validateBody = (schema) => (req, res, next) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const errors = [];

  for (const [field, raw] of Object.entries(schema)) {
    const r = typeof raw === "string" ? { type: raw } : raw;
    const rule = { ...r, type: r.type.replace("?", ""), optional: r.optional || r.type.endsWith("?") };
    const v = body[field];

    if (v === undefined || v === null || v === "") {
      if (!rule.optional) errors.push(`${field} is required`);
      continue;
    }

    switch (rule.type) {
      case "string":
        if (typeof v !== "string") { errors.push(`${field} must be a string`); break; }
        if (v.length > (rule.max ?? 2000)) errors.push(`${field} is too long`);
        if (rule.min && v.length < rule.min) errors.push(`${field} must be at least ${rule.min} characters`);
        if (rule.oneOf && !rule.oneOf.includes(v)) errors.push(`${field} must be one of: ${rule.oneOf.join(", ")}`);
        break;
      case "email":
        if (typeof v !== "string" || v.length > 254 || !EMAIL_RE.test(v)) errors.push(`${field} must be a valid email`);
        break;
      case "objectId":
        if (!isObjectId(v)) errors.push(`${field} must be a valid id`);
        break;
      case "number": {
        const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
        if (!Number.isFinite(n)) { errors.push(`${field} must be a number`); break; }
        if (rule.min !== undefined && n < rule.min) errors.push(`${field} must be >= ${rule.min}`);
        if (rule.max !== undefined && n > rule.max) errors.push(`${field} must be <= ${rule.max}`);
        break;
      }
      default:
        errors.push(`${field}: unknown rule`);
    }
  }

  if (errors.length) return res.status(400).json({ message: "Validation failed", errors });
  next();
};

// Param names used across the routers that hold Mongo ObjectIds.
const ID_PARAMS = ["id", "classId", "studentId", "pdfId", "taskId", "videoId", "noteId", "adminId", "planId", "pendingId"];

/** Reject malformed ids with 400 instead of a Mongoose CastError / 500. */
export const objectIdParams = (router) => {
  for (const name of ID_PARAMS) {
    router.param(name, (req, res, next, value) =>
      isObjectId(value) ? next() : res.status(400).json({ message: `Invalid ${name}` })
    );
  }
};
