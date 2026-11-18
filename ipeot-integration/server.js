import express from "express";

const app = express();
const port = Number(process.env.PORT || 3035);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "ipeot-integration" });
});

app.listen(port, () => {
  console.log(`ipeot-integration listening on ${port}`);
});
