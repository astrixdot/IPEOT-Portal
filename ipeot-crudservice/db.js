import pg from "pg";

pg.types.setTypeParser(20, (value) => Number(value));

export const pool = new pg.Pool({
  host: process.env.DEV_DB_HOST,
  port: Number(process.env.DEV_DB_PORT || 5432),
  user: process.env.DEV_DB_USER,
  password: process.env.DEV_DB_PASSWORD,
  database: process.env.DEV_DB_NAME,
  ssl: process.env.DEV_DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: 10,
  application_name: "ipeot-crudservice",
});

pool.on("error", (err) => {
  console.error("pg pool error", err);
});

export async function recordAudit({ entity, entityId, action, actorId, payload }) {
  await pool.query(
    `INSERT INTO ipeot.audit_log (entity, entity_id, action, actor_id, payload)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [entity, entityId == null ? null : String(entityId), action, actorId ?? null, JSON.stringify(payload ?? {})],
  );
}
