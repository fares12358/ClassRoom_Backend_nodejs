import test from "node:test";
import assert from "node:assert/strict";
process.env.UPLOAD_MAX_MB = "1";
const { default: upload } = await import("../src/middleware/multer.js");
const { jsonApp, serve } = await import("./helpers.js");

const app = jsonApp();
app.post("/up", upload.single("pdf"), (q, s) => s.json({ ok: !!q.file }));

let srv;
test.before(async () => { srv = await serve(app); });
test.after(() => srv.close());

const send = async (buf, type) => {
  const f = new FormData();
  f.append("pdf", new Blob([buf], { type }), "a.pdf");
  return (await fetch(srv.base + "/up", { method: "POST", body: f })).status;
};

test("accepts a real PDF", async () => assert.equal(await send(Buffer.from("%PDF-1.4 x"), "application/pdf"), 200));
test("rejects wrong mimetype", async () => assert.equal(await send(Buffer.from("%PDF-1.4"), "image/png"), 400));
test("rejects a fake PDF (bad signature)", async () => assert.equal(await send(Buffer.from("MZ binary"), "application/pdf"), 400));
test("rejects oversize files with 413", async () =>
  assert.equal(await send(Buffer.concat([Buffer.from("%PDF-"), Buffer.alloc(2 * 1024 * 1024)]), "application/pdf"), 413));
