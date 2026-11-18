import pg from "pg";
import { catalogue } from "./catalogue-data.js";

const pool = new pg.Pool({
  host: process.env.DEV_DB_HOST || "127.0.0.1",
  port: Number(process.env.DEV_DB_PORT || 5490),
  user: process.env.DEV_DB_USER || "digi_user",
  password: process.env.DEV_DB_PASSWORD || "digi_password",
  database: process.env.DEV_DB_NAME || "ipeot",
});

const client = await pool.connect();
try {
  await client.query("BEGIN");
  for (const type of catalogue.extraTypes) {
    await client.query(
      `INSERT INTO ipeot.project_types (code, name, department_id, work_centre_id)
       SELECT $1, $2, d.id, w.id
       FROM ipeot.departments d
       LEFT JOIN ipeot.work_centres w ON w.code = $3
       WHERE d.code = $4
       ON CONFLICT (code) DO NOTHING`,
      [type.code, type.name, type.workCentre, type.department],
    );
  }
  for (const [code, study] of Object.entries(catalogue.studies)) {
    await client.query(
      `INSERT INTO ipeot.study_catalogue (
         project_type_code, sample_report, inputs, specimens, equipment, tests, software, form_schema
       )
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb)
       ON CONFLICT (project_type_code) DO UPDATE SET
         sample_report = EXCLUDED.sample_report,
         inputs = EXCLUDED.inputs,
         specimens = EXCLUDED.specimens,
         equipment = EXCLUDED.equipment,
         tests = EXCLUDED.tests,
         software = EXCLUDED.software,
         form_schema = EXCLUDED.form_schema,
         updated_at = now()`,
      [
        code,
        study.sampleReport || null,
        JSON.stringify(study.inputs),
        JSON.stringify(study.specimens),
        JSON.stringify(study.equipment),
        JSON.stringify(study.tests),
        JSON.stringify(study.software),
        study.formSchema ? JSON.stringify(study.formSchema) : null,
      ],
    );
  }
  await client.query("COMMIT");
  const { rows } = await client.query("SELECT count(*)::int AS total FROM ipeot.study_catalogue");
  console.log(`study catalogue rows: ${rows[0].total}`);
} catch (err) {
  await client.query("ROLLBACK");
  throw err;
} finally {
  client.release();
  await pool.end();
}
