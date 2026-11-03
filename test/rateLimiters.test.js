import test from "node:test";
import assert from "node:assert/strict";
delete process.env.REDIS_URL;
const { loginEmailLimiter, paymentTargetLimiter } = await import("../src/middleware/rateLimiters.js");
const { jsonApp, serve } = await import("./helpers.js");

const app = jsonApp();
app.post("/login", loginEmailLimiter, (q, s) =>
  s.status(q.body.password === "good" ? 200 : q.body.password === "locked" ? 403 : 401).json({})
);
app.post("/pay", paymentTargetLimiter, (q, s) => s.json({}));

let srv;
test.before(async () => { srv = await serve(app); });
test.after(() => srv.close());

const post = (path, body) =>
  fetch(srv.base + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.status);

test("only failed (401) logins count toward the per-email limit", async () => {
  for (let i = 0; i < 4; i++) assert.equal(await post("/login", { email: "A@x.io", password: "bad" }), 401);
  assert.equal(await post("/login", { email: "a@x.io", password: "locked" }), 403); // not counted
  assert.equal(await post("/login", { email: "a@x.io", password: "good" }), 200); // not counted
  assert.equal(await post("/login", { email: "a@x.io", password: "bad" }), 401); // 5th failure
  assert.equal(await post("/login", { email: "a@x.io", password: "bad" }), 429); // blocked (case-insensitive key)
});

test("payment limiter is keyed per target id", async () => {
  for (let i = 0; i < 5; i++) assert.equal(await post("/pay", { pendingId: "p1" }), 200);
  assert.equal(await post("/pay", { pendingId: "p1" }), 429);
  assert.equal(await post("/pay", { pendingId: "p2" }), 200);
});
