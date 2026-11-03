import multer from "multer";

// Every upload in this app is a PDF (class files, tasks, student solutions).
const MAX_MB = Number(process.env.UPLOAD_MAX_MB) || 10;

const storage = multer.memoryStorage(); // buffered, then streamed to Cloudinary

const raw = multer({
  storage,
  limits: {
    fileSize: MAX_MB * 1024 * 1024,
    files: 1,
    fields: 20,
    fieldSize: 100 * 1024, // text fields (name, description…)
    parts: 30,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

const fail = (res, status, message) => res.status(status).json({ message });

/**
 * Drop-in replacement for `upload.single(field)`:
 *  - enforces size / count / mime limits
 *  - verifies the file really starts with "%PDF-" (mimetype is client-controlled)
 *  - turns multer errors into 4xx JSON instead of an unhandled 500
 */
const single = (field) => (req, res, next) => {
  raw.single(field)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") return fail(res, 413, `File too large (max ${MAX_MB} MB)`);
      if (err.code === "LIMIT_UNEXPECTED_FILE") return fail(res, 400, "Only PDF files are allowed");
      return fail(res, 400, "Invalid upload");
    }
    if (err) return next(err);

    if (req.file && req.file.buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
      return fail(res, 400, "Only PDF files are allowed");
    }
    next();
  });
};

export default { single };
