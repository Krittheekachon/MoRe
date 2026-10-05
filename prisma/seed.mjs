import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ quiet: true });

// Catalog only: no identities, prescriptions, tutorials, or clinical criteria.
const modules = [
  { number: 1, name: "การควบคุมลำตัวและการทำงานของขาเบื้องต้น" },
  { number: 2, name: "การควบคุมลำตัวและการเคลื่อนไหวของขา" },
];
const exercises = [
  { code: "seated-trunk", module: 1, name: "บริหารลำตัวขณะนั่ง", english: "Seated Trunk Exercise", side: false, order: 1 },
  { code: "ankle-pump", module: 1, name: "กระดกข้อเท้า", english: "Ankle Pumping Exercise", side: true, order: 2 },
  { code: "seated-leg-raise", module: 2, name: "ยกขาขณะนั่ง", english: "Seated Leg Raise", side: true, order: 1 },
  { code: "sit-to-stand", module: 2, name: "ลุกยืนจากท่านั่ง", english: "Sit to Stand", side: false, order: 2 },
  { code: "bridging", module: 2, name: "ยกสะโพก", english: "Bridging Exercise", side: false, order: 3 },
];

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw Object.assign(new Error("DATABASE_URL is required."), { code: "MISSING_DATABASE_URL" });
  }
  // Standalone CLI uses the existing pg driver; application queries stay in src/lib/prisma.ts.
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    await client.query("BEGIN");
    let insertedModules = 0;
    let insertedExercises = 0;
    const moduleIds = new Map();
    for (const exerciseModule of modules) {
      const inserted = await client.query(
        `INSERT INTO exercise_modules (module_number, name_th, sort_order)
         VALUES ($1, $2, $1) ON CONFLICT (module_number) DO NOTHING`,
        [exerciseModule.number, exerciseModule.name],
      );
      insertedModules += inserted.rowCount ?? 0;
      const result = await client.query("SELECT id FROM exercise_modules WHERE module_number = $1", [exerciseModule.number]);
      moduleIds.set(exerciseModule.number, result.rows[0].id);
    }
    for (const exercise of exercises) {
      const inserted = await client.query(
        `INSERT INTO exercises (module_id, code, name_th, name_en, supports_side_selection, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (code) DO NOTHING`,
        [moduleIds.get(exercise.module), exercise.code, exercise.name, exercise.english, exercise.side, exercise.order],
      );
      insertedExercises += inserted.rowCount ?? 0;
    }
    await client.query("COMMIT");
    console.log(`Catalog seed complete: inserted ${insertedModules} modules and ${insertedExercises} exercises; existing records preserved.`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

seed().catch(error => {
  // Driver messages can contain connection details; expose only the error code.
  console.error("Catalog seed failed:", error.code ?? "DATABASE_ERROR");
  process.exitCode = 1;
});
