import { readFileSync } from "node:fs";
import path from "node:path";
import { createJiti } from "jiti";
import dotenv from "dotenv";
dotenv.config({ quiet: true });
const root = process.cwd();
const jiti = createJiti(import.meta.url, { alias: { "@": path.join(root, "src"), "server-only": path.join(root, "node_modules/next/dist/compiled/server-only/empty.js") } });
const { prisma } = await jiti.import(path.join(root, "src/lib/prisma.ts"));
const training = await jiti.import(path.join(root, "src/lib/training-service.ts"));
const manifest = JSON.parse(readFileSync(".demo/manifest.json", "utf8"));
const patient = manifest.patients.find(p => p.hn === "MORE-DEMO-CAMERA").id;
let checks = 0;
const check = (condition, label) => { if (!condition) throw new Error(label); checks++; };
async function denied(action) { try { await action(); throw new Error("Expected rejection"); } catch (error) { check([400, 422].includes(error.status), "invalid or unauthorized override rejected"); } }
try {
  process.env.MORE_DEMO_MODE = "1"; process.env.MORE_CAMERA_TEST_MODE = "1";
  const templates = await training.listTrainingTemplates(patient);
  check(templates.length === 1 && templates[0].code === "DEMO-MOCK-KNEE", "one test choice");
  const reference = await prisma.exercise.findUniqueOrThrow({ where: { code: "seated-leg-raise" } });
  const exercise = await prisma.exercise.findUniqueOrThrow({ where: { id: manifest.exerciseId } });
  check(reference.module_id === exercise.module_id, "test reuses existing module");
  for (const test of [{ sets: 0, reps: 5, side: "left" }, { sets: 1, reps: 101, side: "left" }, { sets: 1, reps: 5, side: "both" }, { sets: 1.5, reps: 5, side: "right" }]) await denied(() => training.selectTrainingTemplate(patient, templates[0].id, new Date(), patient, test));
  const before = await prisma.exerciseSet.count({ where: { status: "saved", session: { dailyExercise: { day: { patient_id: patient } } } } });
  process.env.MORE_CAMERA_TEST_MODE = "0";
  await denied(() => training.selectTrainingTemplate(patient, templates[0].id, new Date(), patient, { sets: 1, reps: 5, side: "left" }));
  check((await training.listTrainingTemplates(patient)).length > 1, "legacy Demo flow restored");
  process.env.MORE_DEMO_MODE = "0";
  check(!(await training.listTrainingTemplates(patient)).some(t => t.code.startsWith("DEMO-")), "test choices hidden when disabled");
  check(!(await training.readDailyTraining(patient)).items.some(t => t.exercise.code === exercise.code), "today hides disabled test exercise");
  check(await training.readTrainingPlan(patient) === null, "disabled test plan hidden");
  check(await prisma.exerciseSet.count({ where: { status: "saved", session: { dailyExercise: { day: { patient_id: patient } } } } }) === before, "disabling retains recorded results");
  console.log(JSON.stringify({ cameraPolicyChecks: checks }));
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await prisma.$disconnect(); }
