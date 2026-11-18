import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db.js";

const PgSession = connectPgSimple(session);

export function sessionMiddleware() {
  const secret = process.env.SESSION_SECRET || "";
  if (secret.length < 16) {
    throw new Error("SESSION_SECRET must be at least 16 characters");
  }
  return session({
    name: "IPEOT_SESSION",
    secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    proxy: true,
    store: new PgSession({
      pool,
      schemaName: "ipeot",
      tableName: "user_sessions",
      createTableIfMissing: false,
    }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000,
      path: "/",
    },
  });
}
