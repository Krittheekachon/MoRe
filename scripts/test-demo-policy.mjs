import path from "node:path";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createJiti } from "jiti";
import dotenv from "dotenv";
dotenv.config({ quiet: true });
const root = process.cwd();
const jiti = createJiti(import.meta.url, { alias: { "@": path.join(root, "src"), "server-only": path.join(root, "node_modules/next/dist/compiled/server-only/empty.js") } });
const { prisma } = await jiti.import(path.join(root, "src/lib/prisma.ts"));
const policy = await jiti.import(path.join(root, "src/lib/demo-policy.ts"));
const training = await jiti.import(path.join(root, "src/lib/training-service.ts"));
const { recordingService } = await jiti.import(path.join(root, "src/lib/recording-service.ts"));
const { dateLabel } = await jiti.import(path.join(root, "src/lib/demo-data.ts"));
const { jointAngle, pointConfidence, RepetitionCycle } = await jiti.import(path.join(root, "src/lib/pose/cycle.ts"));
let checks = 0;
function check(value, label) { if (!value) throw new Error(label); checks++; }
async function rejects(run, status) { let denied = false; try { await run(); } catch (error) { denied = error.status === status; } check(denied, "Expected policy rejection"); }
try {
  const manifest = JSON.parse(readFileSync(".demo/manifest.json", "utf8"));
  process.env.MORE_DEMO_MODE = "1";
  check(await policy.isDemoPatient(manifest.patients[0].id), "DB-bound identity");
  const definition = await policy.demoCriteria(manifest.patients[0].id, manifest.exerciseId, "left");
  const landmarks = Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0, visibility: 0.9 }));
  landmarks[23].x = 1; landmarks[27].y = 1;
  check(Math.abs(jointAngle(landmarks, definition, 640, 480) - 90) < 0.001 && pointConfidence(landmarks[23]) === 0.9, "actual MediaPipe landmark shape does not require absent presence");
  check(pointConfidence({ ...landmarks[23], presence: 0.1 }) === 0.1 && pointConfidence({ x: 0, y: 0, z: 0 }) === 0, "explicit poor or unknown confidence still rejected");
  const cycle = new RepetitionCycle(definition); let at = Date.now() - 5000;
  for (const angle of [90, 90, 90, 125, 150, 150, 90, 90, 90]) { cycle.sample(angle, at, 0.9); at += 120; }
  check(cycle.repetitions.length === 1 && cycle.repetitions[0].peakAngle === 150, "completed-cycle regression");
  for (const angle of [125, 150, null, 90, 90, 90]) { cycle.sample(angle, at, 0.9); at += 120; }
  check(cycle.repetitions.length === 1, "tracking loss cannot finish previous cycle");
  for (const angle of [125, 150, 150]) { cycle.sample(angle, at, 0.9); at += 120; } cycle.interrupt();
  for (const angle of [90, 90, 90]) { cycle.sample(angle, at, 0.9); at += 120; }
  check(cycle.repetitions.length === 1, "pause cannot complete unfinished cycle");
  const normal = await prisma.patientProfile.findFirst({ where: { patient_id: { notIn: manifest.patients.map(patient => patient.id) } }, select: { patient_id: true } });
  if (normal) {
    check(!await policy.demoCriteria(normal.patient_id, manifest.exerciseId, "left"), "real identity cannot use demo criteria");
    check((await training.listTrainingTemplates(normal.patient_id)).every(template => !template.code.startsWith("DEMO-")), "real identity cannot list demo");
    const demoTemplate = (await training.listTrainingTemplates(manifest.patients[0].id))[0];
    await rejects(() => training.selectTrainingTemplate(normal.patient_id, demoTemplate.id), 422);
  }
  process.env.MORE_DEMO_MODE = "0";
  check(!await policy.demoCriteria(manifest.patients[0].id, manifest.exerciseId, "left"), "flag off blocks fixture criteria");
  check((await training.listTrainingTemplates(manifest.patients[0].id)).every(template => !template.code.startsWith("DEMO-")), "flag off hides demo templates");
  const today = await training.readDailyTraining(manifest.patients[0].id);
  if (today.items[0]?.canStart) await rejects(() => recordingService.configuration(manifest.patients[0].id, today.items[0].id, today.items[0].side), 422);
  check(dateLabel("") === "ไม่ระบุ" && dateLabel("invalid") === "ไม่ระบุ" && dateLabel("1960-01-01") !== "ไม่ระบุ", "nullable diagnosis date regression");
  async function snapshot() {
    return { counts: await Promise.all([prisma.user.count(), prisma.patientProfile.count(), prisma.exerciseModule.count(), prisma.exercise.count(), prisma.exerciseAngleMetric.count(), prisma.exerciseCheckpoint.count(), prisma.rehabilitationTemplate.count(), prisma.rehabilitationPlan.count(), prisma.rehabilitationDay.count(), prisma.dailyExercise.count(), prisma.exerciseSession.count(), prisma.exerciseSet.count(), prisma.repetition.count(), prisma.repetitionMetric.count(), prisma.repetitionCheckpointResult.count()]),
      users: await prisma.user.findMany({ orderBy: { id: "asc" }, select: { id: true, password_hash: true, updated_at: true } }),
      templates: await prisma.rehabilitationTemplate.findMany({ orderBy: { id: "asc" }, select: { id: true, name_th: true, updated_at: true } }),
      profiles: await prisma.patientProfile.findMany({ orderBy: { patient_id: "asc" }, select: { patient_id: true, updated_at: true } }) };
  }
  const before = await snapshot();
  execFileSync(process.execPath, ["scripts/seed-demo.mjs"], { stdio: "pipe", timeout: 60000 });
  check(JSON.stringify(before) === JSON.stringify(await snapshot()), "seed rerun preserves counts, hashes and edits");
  console.log(JSON.stringify({ policyChecks: checks, seedIdempotent: true, originalCatalogRetained: true }));
} catch { console.error("Demo policy verification failed; no credentials or medical data printed."); process.exitCode = 1; }
finally { await prisma.$disconnect(); }
