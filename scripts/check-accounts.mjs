import "dotenv/config";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  const accounts = await client.query(`
    SELECT count(*)::int AS synthetic_accounts,
      bool_and(u.role = 'patient' AND u.login_name IS NULL
        AND u.password_hash LIKE 'scrypt$%' AND length(u.password_hash) <= 128
        AND p.national_id_lookup ~ '^[a-f0-9]{64}$'
        AND p.national_id_encrypted LIKE 'v1:%') AS secure_storage
    FROM users u JOIN patient_profiles p ON p.patient_id = u.id
    WHERE p.full_name LIKE 'MoRe Synthetic %'
  `);
  const catalog = await client.query(`SELECT
    (SELECT count(*)::int FROM exercise_modules) AS modules,
    (SELECT count(*)::int FROM exercises) AS exercises`);
  console.log(JSON.stringify({ ...accounts.rows[0], ...catalog.rows[0] }));
  if (!accounts.rows[0].secure_storage) process.exitCode = 1;
} catch {
  console.error("Database verification failed; credentials and account values are not logged.");
  process.exitCode = 1;
} finally {
  await client.end();
}
