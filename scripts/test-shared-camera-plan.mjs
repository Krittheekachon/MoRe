import path from "node:path";
import { randomUUID } from "node:crypto";
import { createJiti } from "jiti";
import dotenv from "dotenv";
dotenv.config({ quiet: true });
const root = process.cwd();
const jiti = createJiti(import.meta.url, { alias: { "@": path.join(root, "src"), "server-only": path.join(root, "node_modules/next/dist/compiled/server-only/empty.js") } });
const { prisma } = await jiti.import(path.join(root, "src/lib/prisma.ts"));
const training = await jiti.import(path.join(root, "src/lib/training-service.ts"));
const policy = await jiti.import(path.join(root, "src/lib/demo-policy.ts"));
const { recordingService } = await jiti.import(path.join(root, "src/lib/recording-service.ts"));
const patients = []; const prefix = `Shared Camera Test ${randomUUID()}`;
let checks = 0;
function check(value, label) { if (!value) throw new Error(label); checks++; }
try {
  check(["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL).hostname), "local database required");
  process.env.MORE_DEMO_MODE = "0"; process.env.MORE_CAMERA_TEST_MODE = "1";
  for (let i = 0; i < 2; i++) {
    const user = await prisma.user.create({ data: { role: "patient", display_name: `${prefix} ${i}`, password_hash: "disabled-test-account", created_at: new Date(), updated_at: new Date(), patientProfile: { create: { full_name: `${prefix} ${i}`, national_id_lookup: randomUUID(), national_id_encrypted: "test-only", updated_at: new Date() } } } });
    patients.push(user.id);
  }
  const templates = await training.listTrainingTemplates(patients[0]);
  const template = templates.find(item => item.code === "DEMO-MOCK-KNEE");
  check(!!template && template.items.length === 1, "shared single-exercise template available without Demo");
  check(!await policy.isDemoPatient(patients[0]), "ordinary patient outside private manifest");
  check((await training.listTrainingTemplates(patients[1])).some(item => item.id === template.id), "second ordinary patient sees same central template");
  const now = new Date();
  await training.selectTrainingTemplate(patients[0], template.id, now, patients[0], { sets: 1, reps: 5, side: "right" });
  const today = await training.readDailyTraining(patients[0], now); const daily = today.items[0];
  check(daily.targetSets === 1 && daily.targetReps === 5 && daily.side === "right", "normal plan snapshots targets and side");
  check((await training.readCameraAssignment(patients[0], daily.id, daily.exercise.code, false, now)).id === daily.id, "normal camera ownership flow");
  try { await training.readCameraAssignment(patients[1], daily.id); throw new Error("ownership bypass"); } catch (error) { check(error.status === 404, "other patient cannot access camera assignment"); }
  const slot = await recordingService.start(patients[0], daily.id, { side: "right" }, now);
  const criteria = await recordingService.configuration(patients[0], daily.id, "right");
  check(!!criteria, "real camera runtime receives isolated test adapter");
  check(criteria.criteriaVersion === 5 && criteria.start.min === 60 && criteria.start.max === 115 && criteria.correctPeak.min === 160 && criteria.correctPeak.max === 170 && !!criteria.preparation, "mock v5 preparation and target published");
  const repetitions = Array.from({length:7},(_,i)=>({startedAt:now.getTime()+10+i*1100,completedAt:now.getTime()+1010+i*1100,startAngle:90,peakAngle:165,endAngle:90,confidence:1}));
  const saved = await recordingService.save(patients[0], slot.setId, { side: "right", metricId: criteria.metricId, definitionVersion: criteria.definitionVersion, criteriaVersion: criteria.criteriaVersion, elapsedSeconds: 8, repetitions }, new Date(now.getTime() + 8000));
  check(saved.reps === 7 && slot.targetReps === 5, "save all seven repetitions against unchanged target five");
  check(await prisma.repetition.count({where:{set_id:slot.setId}}) === 7, "over-target repetitions persist without truncation");
  const stored = await prisma.repetition.findFirstOrThrow({ where: { set_id: slot.setId } });
  check(stored.is_correct && stored.criteria_version === 5, "165-degree full round saves as correct mock v5");
  check((await training.readDailyTraining(patients[0])).savedSets === 1, "partial save updates test progress");
  check((await training.readTrainingHistory(patients[0])).recent.length === 1, "test history available separately");
  process.env.MORE_CAMERA_TEST_MODE = "0";
  check(!(await training.listTrainingTemplates(patients[1])).some(item => item.id === template.id), "disable hides shared test choice");
  check((await training.readDailyTraining(patients[0])).items.length === 0, "disable hides test daily assignment");
  check(await prisma.exerciseSet.count({ where: { id: slot.setId, status: "saved" } }) === 1, "disable preserves stored result");
  console.log(JSON.stringify({ sharedCameraChecks: checks, physicalCameraTested: false }));
} catch (error) { console.error(error.stack); process.exitCode = 1; }
finally {
  const daily = { day: { patient_id: { in: patients } } }; const session = { dailyExercise: daily }; const repetition = { set: { session } };
  if (patients.length) await prisma.$transaction(async tx => {
    const owned = await tx.user.count({ where: { id: { in: patients }, display_name: { startsWith: prefix } } });
    if (owned !== patients.length) throw new Error("Fixture ownership guard");
    await tx.repetitionCheckpointResult.deleteMany({ where: { repetition } }); await tx.repetitionMetric.deleteMany({ where: { repetition } }); await tx.repetition.deleteMany({ where: repetition });
    await tx.cameraCheck.deleteMany({ where: { session } }); await tx.exerciseSet.deleteMany({ where: { session } }); await tx.exerciseSession.deleteMany({ where: session });
    await tx.dailyExercise.deleteMany({ where: daily }); await tx.rehabilitationDay.deleteMany({ where: { patient_id: { in: patients } } });
    await tx.planExerciseWeekday.deleteMany({ where: { planExercise: { plan: { patient_id: { in: patients } } } } }); await tx.planExercise.deleteMany({ where: { plan: { patient_id: { in: patients } } } }); await tx.rehabilitationPlan.deleteMany({ where: { patient_id: { in: patients } } });
    await tx.patientProfile.deleteMany({ where: { patient_id: { in: patients } } }); await tx.user.deleteMany({ where: { id: { in: patients }, display_name: { startsWith: prefix } } });
  });
  await prisma.$disconnect();
}
