import express from "express";

// Start an express app on an ephemeral port; returns { base, close }.
export const serve = (app) =>
  new Promise((resolve) => {
    const server = app.listen(0, () => {
      resolve({
        base: `http://127.0.0.1:${server.address().port}`,
        close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(r); }),
      });
    });
  });

export const jsonApp = () => {
  const a = express();
  a.set("trust proxy", 1);
  a.use(express.json());
  return a;
};
