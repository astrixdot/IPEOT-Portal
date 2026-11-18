import { pool } from "./db.js";

export async function sessionPrincipal(userId) {
  const { rows } = await pool.query("SELECT ipeot.session_principal($1::bigint) AS principal", [userId]);
  return rows[0]?.principal ?? null;
}
