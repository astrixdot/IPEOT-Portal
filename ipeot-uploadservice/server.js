import express from "express";

const app = express();
const port = Number(process.env.PORT || 5051);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "ipeot-uploadservice" });
});

app.listen(port, () => {
  console.log(`ipeot-uploadservice listening on ${port}`);
});
