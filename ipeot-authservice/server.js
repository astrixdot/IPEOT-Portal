import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { pool, recordAudit } from "./db.js";
import { sessionMiddleware } from "./session.js";
import { findActiveUserIdByCpf, sessionPrincipal } from "./directory.js";
import { LdapError, authenticateLdap } from "./ldap.js";

const app = express();
const port = Number(process.env.PORT || 9991);
const dummyHash = bcrypt.hashSync("ipeot-timing-pad", 10);

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "32kb" }));

if (process.env.CORS_RELAXED === "true") {
  app.use(cors({ origin: true, credentials: true }));
}

app.get("/ping", (_req, res) => {
  res.json({ ok: true, service: "ipeot-authservice" });
});

app.use(sessionMiddleware());
app.use("/api/auth", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.get("/api/auth/config", (_req, res) => {
  const devHint = process.env.NODE_ENV !== "production" && !process.env.LDAP_URL;
  res.json({
    ldap: Boolean(process.env.LDAP_URL),
    devHint: devHint ? { cpf: "100001", password: "Ipeot@123" } : null,
  });
});

async function localUserId(cpf, password) {
  const { rows } = await pool.query(
    "SELECT id, password_hash FROM ipeot.users WHERE cpf = $1 AND active",
    [cpf],
  );
  const hash = rows[0]?.password_hash || dummyHash;
  const matches = await bcrypt.compare(password, hash);
  if (!rows[0]?.password_hash || !matches) return null;
  return rows[0].id;
}

app.post("/api/auth/login", async (req, res, next) => {
  const cpf = String(req.body?.cpf || "").trim();
  const password = String(req.body?.password || "");
  if (!/^[A-Za-z0-9._-]{1,64}$/.test(cpf) || !password) {
    return res.status(401).json({ error: "invalid_credentials" });
  }
  const method = process.env.LDAP_URL ? "ldap" : "local";
  try {
    let userId = null;
    if (method === "ldap") {
      try {
        await authenticateLdap(cpf, password);
      } catch (err) {
        if (err instanceof LdapError && err.kind === "invalid") {
          await recordAudit({ entity: "user", action: "login_failed", payload: { cpf, method } });
          return res.status(401).json({ error: "invalid_credentials" });
        }
        console.error("ldap", err);
        return res.status(503).json({ error: "ldap_unavailable" });
      }
      userId = await findActiveUserIdByCpf(cpf);
      if (!userId) return res.status(403).json({ error: "user_not_provisioned" });
    } else {
      userId = await localUserId(cpf, password);
      if (!userId) {
        await recordAudit({ entity: "user", action: "login_failed", payload: { cpf, method } });
        return res.status(401).json({ error: "invalid_credentials" });
      }
    }
    const user = await sessionPrincipal(userId);
    if (!user) return res.status(401).json({ error: "invalid_credentials" });
    await pool.query("UPDATE ipeot.users SET last_login_at = now() WHERE id = $1", [userId]);
    await recordAudit({
      entity: "user",
      entityId: userId,
      action: "login",
      actorId: userId,
      payload: { method },
    });
    req.session.user = user;
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

app.post("/api/auth/logout", (req, res, next) => {
  const actorId = req.session?.user?.id ?? null;
  req.session.destroy(async (err) => {
    if (err) return next(err);
    res.clearCookie("IPEOT_SESSION", { path: "/" });
    try {
      if (actorId) {
        await recordAudit({ entity: "user", entityId: actorId, action: "logout", actorId, payload: {} });
      }
    } catch (auditErr) {
      console.error(auditErr);
    }
    return res.json({ ok: true });
  });
});

app.get("/api/auth/me", async (req, res, next) => {
  if (!req.session?.user?.id) return res.status(401).json({ error: "unauthenticated" });
  try {
    const user = await sessionPrincipal(req.session.user.id);
    if (!user) return res.status(401).json({ error: "unauthenticated" });
    req.session.user = user;
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "internal_error" });
});

app.listen(port, () => {
  console.log(`ipeot-authservice listening on ${port}`);
});
