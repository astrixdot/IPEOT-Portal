import express, { Router } from "express";
import cors from "cors";
import pg from "pg";
import { sessionMiddleware } from "./session.js";
import { sessionPrincipal } from "./directory.js";
import adminRoutes from "./routes/admin.js";
import portalRoutes from "./routes/portal.js";
import proposalRoutes from "./routes/proposals.js";

const app = express();
const port = Number(process.env.PORT || process.env.DEV_PORT || 3034);

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "8mb" }));

if (process.env.CORS_RELAXED === "true") {
  app.use(cors({ origin: true, credentials: true }));
}

app.get("/ping", async (_req, res) => {
  const out = { ok: true, service: "ipeot-crudservice", db: null };
  if (!process.env.DEV_DB_HOST) {
    res.json(out);
    return;
  }
  const client = new pg.Client({
    host: process.env.DEV_DB_HOST,
    port: Number(process.env.DEV_DB_PORT || 5432),
    user: process.env.DEV_DB_USER,
    password: process.env.DEV_DB_PASSWORD,
    database: process.env.DEV_DB_NAME,
    ssl: process.env.DEV_DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  });
  try {
    await client.connect();
    const result = await client.query("SELECT current_database() AS db");
    out.db = result.rows[0]?.db;
    res.json(out);
  } catch (err) {
    out.ok = false;
    out.db = { error: err.message };
    res.status(503).json(out);
  } finally {
    await client.end().catch(() => {});
  }
});

app.use(sessionMiddleware());

async function attachUser(req, res, next) {
  try {
    if (!req.session?.user?.id) return next();
    const principal = await sessionPrincipal(req.session.user.id);
    if (!principal) return res.status(401).json({ error: "unauthenticated" });
    req.session.user = principal;
    return next();
  } catch (err) {
    return next(err);
  }
}

function requireAuth(req, res, next) {
  if (!req.session?.user?.id) return res.status(401).json({ error: "unauthenticated" });
  return next();
}

const api = Router();
api.use(requireAuth);
api.use(adminRoutes);
api.use(portalRoutes);
api.use(proposalRoutes);
app.use("/api/crud/v1", attachUser, api);

app.use((req, res) => {
  res.status(404).json({ error: "not_found", path: req.path });
});

app.use((err, _req, res, _next) => {
  if (err.code === "23505") return res.status(409).json({ error: "already_exists" });
  if (err.code === "23503") return res.status(400).json({ error: "invalid_reference" });
  if (err instanceof SyntaxError && "body" in err) return res.status(400).json({ error: "invalid_json" });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  return res.status(status).json({ error: status >= 500 ? "internal_error" : err.message });
});

app.listen(port, () => {
  console.log(`ipeot-crudservice listening on ${port}`);
});
