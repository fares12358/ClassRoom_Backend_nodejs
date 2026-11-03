import crypto from "crypto";

// 10 hex chars (40 bits), uppercase: easy to read out/type, infeasible to guess
// under the join-class rate limit.
export const generateJoinCode = () => crypto.randomBytes(5).toString("hex").toUpperCase();

export const joinCodesMatch = (expected, provided) => {
  if (typeof expected !== "string" || typeof provided !== "string" || !expected || !provided) return false;
  const a = Buffer.from(expected.trim().toUpperCase());
  const b = Buffer.from(provided.trim().toUpperCase());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
