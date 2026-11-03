import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { jsonApp, serve } from "./helpers.js";
import { sanitizeBody, validateBody, objectIdParams } from "../src/middleware/validate.js";

const app = jsonApp();
app.use(sanitizeBody);
const r = express.Router();
objectIdParams(r);
r.post("/login", validateBody({ email: "string", password: { type: "string", max: 10 } }), (q, s) => s.json(q.body));
r.post(
  "/p",
  validateBody({
    planId: "objectId",
    price: { type: "number", min: 1 },
    role: { type: "string?", oneOf: ["a", "b"] },
    mail: "email?",
  }),
  (q, s) => s.json(q.body)
);
r.get("/c/:classId", (q, s) => s.json({ ok: 1 }));
app.use(r);

const post = (base, path, body) =>
  fetch(base + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

let srv;
test.before(async () => { srv = await serve(app); });
test.after(() => srv.close());

test("operator objects are rejected where a string is expected", async () => {
  assert.equal((await post(srv.base, "/login", { email: { $ne: null }, password: "x" })).status, 400);
  assert.equal((await post(srv.base, "/login", { email: "a@b.c", password: "x" })).status, 200);
});

test("$ and dotted keys are stripped from bodies", async () => {
  const res = await post(srv.base, "/p", { planId: "507f1f77bcf86cd799439011", price: 5, x: { $gt: 1, "a.b": 2, ok: 3 } });
  assert.deepEqual((await res.json()).x, { ok: 3 });
});

test("objectId, number, enum, email and length rules", async () => {
  const good = { planId: "507f1f77bcf86cd799439011", price: 5 };
  assert.equal((await post(srv.base, "/p", { ...good, planId: "nope" })).status, 400);
  assert.equal((await post(srv.base, "/p", { ...good, price: 0 })).status, 400);
  assert.equal((await post(srv.base, "/p", { ...good, role: "root" })).status, 400);
  assert.equal((await post(srv.base, "/p", { ...good, mail: "not-an-email" })).status, 400);
  assert.equal((await post(srv.base, "/login", { email: "a@b.c", password: "x".repeat(11) })).status, 400);
  assert.equal((await post(srv.base, "/p", good)).status, 200);
});

test("malformed ObjectId route params return 400", async () => {
  assert.equal((await fetch(srv.base + "/c/123")).status, 400);
  assert.equal((await fetch(srv.base + "/c/507f1f77bcf86cd799439011")).status, 200);
});
