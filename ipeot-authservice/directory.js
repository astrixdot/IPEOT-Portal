import { pool } from "./db.js";

export async function sessionPrincipal(userId) {
  const { rows } = await pool.query("SELECT ipeot.session_principal($1::bigint) AS principal", [userId]);
  return rows[0]?.principal ?? null;
}

export async function findActiveUserIdByCpf(cpf) {
  const { rows } = await pool.query("SELECT id FROM ipeot.users WHERE cpf = $1 AND active", [cpf]);
  return rows[0]?.id ?? null;
}
