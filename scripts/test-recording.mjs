import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createJiti } from "jiti";
import dotenv from "dotenv";
dotenv.config({ quiet: true });
const origin = process.env.MORE_TEST_ORIGIN || "http://localhost:3000";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": path.join(root, "src"), "server-only": path.join(root, "node_modules/next/dist/compiled/server-only/empty.js") } });
const { prisma } = await jiti.import(path.join(root, "src/lib/prisma.ts"));
const { createRecordingService, recordingService } = await jiti.import(path.join(root, "src/lib/recording-service.ts"));
const { RepetitionCycle, jointAngle } = await jiti.import(path.join(root, "src/lib/pose/cycle.ts"));
const { trainingDay } = await jiti.import(path.join(root, "src/lib/training-calendar.ts"));
const security = await jiti.import(path.join(root, "src/lib/account-security.ts"));
const training = await jiti.import(path.join(root, "src/lib/training-service.ts"));
const patients = []; let fixtureExercise; const prefix = "MoRe Recording Test";
let logicChecks = 0; let serviceChecks = 0; let apiChecks = 0;
const generated = path.join(root, "output/playwright/recording-code.js");
function check(value, label, type = "service") { if (!value) throw Object.assign(new Error(label), { testLabel: label }); if (type === "logic") logicChecks++; else if (type === "api") apiChecks++; else serviceChecks++; }
async function rejects(run, status, label) { try { await run(); check(false, label); } catch (error) { check(error.status === status, label); } }
async function main() {
  check(["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL).hostname), "local database only");
  const now = new Date(); const beginning = new Date(now.getTime() - 10000); const tag = randomUUID().slice(0, 8);
  const catalog = await prisma.exercise.findUnique({ where: { code: "seated-leg-raise" } });
  check(!!catalog, "existing catalog required");
  fixtureExercise = await prisma.exercise.create({ data: { module_id: catalog.module_id, code: `test-knee-${tag}`, name_th: `${prefix} ${tag}`, supports_side_selection: true, sort_order: 99 } });
  const metric = await prisma.exerciseAngleMetric.create({ data: { exercise_id: fixtureExercise.id, metric_code: "test-only-angle", label_th: "Software fixture only", landmark_a: "LEFT_HIP", landmark_b: "LEFT_KNEE", landmark_c: "LEFT_ANKLE", is_primary: true } });
  const checkpointIds = {};
  for (const phase of ["start", "peak", "return"]) {
    const item = await prisma.exerciseCheckpoint.create({ data: { exercise_id: fixtureExercise.id, metric_id: metric.id, code: `test-${phase}`, phase, min_value: phase === "peak" ? 140 : 85, max_value: phase === "peak" ? 175 : 95 } });
    checkpointIds[phase === "return" ? "returned" : phase] = item.id;
  }
  // Numeric thresholds are deliberately confined to synthetic software fixtures.
  const criteria = { exerciseCode: fixtureExercise.code, metricId: metric.id, definitionVersion: 1, criteriaVersion: 1, landmarks: [23, 25, 27], coordinates: "image-2d", start: { min: 85, max: 95 }, departureMin: 120, correctPeak: { min: 140, max: 175 }, stableMs: 100, maxGapMs: 500, minVisibility: 0.5, checkpointIds };
  const cycle = new RepetitionCycle(criteria); let time = beginning.getTime() + 1000;
  const sample = angle => { const result = cycle.sample(angle, time); time += 100; return result; };
  [90, 90, 121, 90, 90].forEach(sample); check(cycle.repetitions.length === 0, "jitter does not count", "logic");
  [125, 130, 150, 90, 90, 90, 90].forEach(sample); check(cycle.repetitions.length === 1 && cycle.repetitions[0].peakAngle === 150, "one full cycle keeps max and counts once", "logic");
  [130, 140, null, 90, 90].forEach(sample); check(cycle.repetitions.length === 1, "tracking interruption discards unfinished cycle", "logic");
  [125, 135].forEach(sample); cycle.interrupt(); [90, 90].forEach(sample); check(cycle.repetitions.length === 1, "pause resume cannot finish old cycle", "logic");
  [125, 135, 90, 90].forEach(sample); check(cycle.repetitions.length === 2, "incorrect peak still counts completed cycle", "logic");
  cycle.sample(150, time - 1000); check(cycle.repetitions.length === 2, "old duplicate frame ignored", "logic");
  [125, 160].forEach(sample); time += 1000; [90, 90].forEach(sample); check(cycle.repetitions.length === 2, "frame gap cannot make phantom rep", "logic");
  [125, 150].forEach(sample); check(cycle.repetitions.length === 2, "incomplete cycle excluded from save", "logic");
  const reps = structuredClone(cycle.repetitions); cycle.reset(); check(cycle.repetitions.length === 0, "reset removes only local draft", "logic");
  const points = Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0, visibility: 1, presence: 1 })); points[23].x = 1; points[27].y = 1;
  check(Math.abs(jointAngle(points, criteria, 820, 390) - 90) < 0.001, "aspect corrected angle", "logic");
  points[23].visibility = 0; check(jointAngle(points, criteria, 820, 390) === null, "poor visibility rejected", "logic");
  const service = createRecordingService((code, side) => code === fixtureExercise.code && side === "left" ? criteria : undefined);
  const accounts = []; const dailyIds = [];
  for (const suffix of ["A", "B"]) {
    const nationalId = `0${String(BigInt(`0x${randomBytes(6).toString("hex")}`) % 1000000000000n).padStart(12, "0")}`; const password = randomBytes(24).toString("hex");
    const user = await prisma.user.create({ data: { role: "patient", display_name: `${prefix} ${suffix} ${tag}`, password_hash: await security.hashPassword(password), created_at: beginning, updated_at: beginning, patientProfile: { create: { full_name: `${prefix} ${suffix} ${tag}`, national_id_lookup: security.nationalIdLookup(nationalId), national_id_encrypted: security.encryptNationalId(nationalId), updated_at: beginning } } } });
    patients.push(user.id); accounts.push({ nationalId, password });
    const plan = await prisma.rehabilitationPlan.create({ data: { patient_id: user.id, created_by: user.id, plan_code: `RT-${tag}-${suffix}`, created_at: beginning, updated_at: beginning, exercises: { create: [fixtureExercise.id, catalog.id].map(exercise_id => ({ exercise_id, selected_side: "left", target_sets: 2, target_reps_per_set: 10, effective_from: beginning, version_number: 1, configured_by: user.id })) } }, include: { exercises: true } });
    const day = await prisma.rehabilitationDay.create({ data: { patient_id: user.id, local_date: trainingDay(now).storedDate, dailyExercises: { create: plan.exercises.map(item => ({ plan_exercise_id: item.id, exercise_id: item.exercise_id, selected_side: "left", target_sets: 2, target_reps_per_set: 10 })) } }, include: { dailyExercises: true } });
    dailyIds.push(day.dailyExercises.find(item => item.exercise_id === fixtureExercise.id).id);
    if (suffix === "A") accounts[0].cameraDaily = day.dailyExercises.find(item => item.exercise_id === catalog.id).id;
    if (suffix === "A" && process.env.MORE_CAMERA_HYDRATION === "1") {
      const mock = await prisma.exercise.findUniqueOrThrow({ where: { code: "demo-knee-extension" } });
      for (const [index, side] of ["right", null].entries()) {
        const item = await prisma.planExercise.create({ data: { plan_id: plan.id, exercise_id: mock.id, selected_side: side, target_sets: 2, target_reps_per_set: 5, effective_from: beginning, version_number: index + 1, configured_by: user.id } });
        const daily = await prisma.dailyExercise.create({ data: { rehabilitation_day_id: day.id, plan_exercise_id: item.id, exercise_id: mock.id, selected_side: side, target_sets: 2, target_reps_per_set: 5 } });
        accounts[0][index ? "cameraFreeDaily" : "cameraAssignedDaily"] = daily.id;
      }
    }
  }
  const [a, b] = patients; const [dailyA, dailyB] = dailyIds;
  const slots = await Promise.all(Array.from({ length: 5 }, () => service.start(a, dailyA, { side: "left" }, beginning)));
  const slot = slots[0]; check(slots.every(item => item.setId === slot.setId), "concurrent start allocates one set");
  const payload = { side: "left", metricId: metric.id, definitionVersion: 1, criteriaVersion: 1, elapsedSeconds: 5, repetitions: reps };
  await rejects(() => service.save(b, slot.setId, payload, now), 404, "other patient cannot save");
  await rejects(() => service.state(b, slot.setId, { action: "exit", elapsedSeconds: 5 }, now), 404, "other patient cannot discard");
  await rejects(() => service.start(a, dailyB, { side: "left" }, now), 404, "other patient cannot allocate");
  await rejects(() => recordingService.start(a, dailyA, { side: "left" }, now), 422, "production registry never approves fixture");
  await rejects(() => service.save(a, slot.setId, { ...payload, is_correct: true }, now), 400, "client cannot assign correctness");
  await rejects(() => service.save(a, slot.setId, { ...payload, metricId: metric.id + 1 }, now), 409, "wrong metric blocked");
  await rejects(() => service.save(a, slot.setId, { ...payload, repetitions: [{ ...reps[0], endAngle: 120 }] }, now), 400, "unfinished rep blocked");
  await service.state(a, slot.setId, { action: "pause", elapsedSeconds: 5 }, now);
  check((await prisma.exerciseSet.findUnique({ where: { id: slot.setId } })).status === "paused" && await prisma.repetition.count({ where: { set_id: slot.setId } }) === 0, "pause persists state but not draft results");
  await service.state(a, slot.setId, { action: "resume", elapsedSeconds: 5 }, now);
  const results = await Promise.all(Array.from({ length: 5 }, () => service.save(a, slot.setId, payload, now)));
  check(results.every(item => item.savedSets === 1 && item.reps === 2 && item.maxAngle === 150 && item.averageAngle === 142.5), "partial save and retries have correct MAX AVG");
  check(await prisma.repetition.count({ where: { set_id: slot.setId } }) === 2 && await prisma.repetitionMetric.count({ where: { repetition: { set_id: slot.setId } } }) === 2, "retry creates no duplicate results");
  const persisted = await prisma.repetition.findMany({ where: { set_id: slot.setId }, orderBy: { rep_number: "asc" } });
  check(persisted[0].is_correct && !persisted[1].is_correct && persisted.every(item => item.quality_score === null), "correctness follows fixture criteria only and no guessed score");
  await rejects(() => service.save(a, slot.setId, { ...payload, elapsedSeconds: 6 }, now), 409, "changed retry conflicts");
  await rejects(() => service.state(a, slot.setId, { action: "restart", elapsedSeconds: 5 }, now), 409, "saved set cannot be reset");
  const second = await service.start(a, dailyA, { side: "left" }, beginning);
  await service.state(a, second.setId, { action: "restart", elapsedSeconds: 0 }, now);
  await rejects(() => service.state(a, second.setId, { action: "resume", elapsedSeconds: 0 }, now), 409, "cancelled draft cannot resume");
  check(await prisma.exerciseSet.count({ where: { status: "saved", session: { daily_exercise_id: dailyA } } }) === 1, "restart preserves earlier saved results");
  await rejects(() => service.save(a, second.setId, { ...payload, elapsedSeconds: 0, repetitions: [] }, now), 409, "cancelled draft cannot save");
  const third = await service.start(a, dailyA, { side: "left" }, beginning);
  const empty = { ...payload, elapsedSeconds: 0, repetitions: [] };
  const last = await service.save(a, third.setId, empty, now); check(last.savedSets === 2 && last.reps === 0 && last.maxAngle === null, "zero completed reps does not fabricate angles");
  await rejects(() => service.start(a, dailyA, { side: "left" }, now), 409, "daily target cannot be exceeded");
  check((await service.save(a, third.setId, empty, now)).savedSets === 2, "retry after daily completion still idempotent");
  const today = await training.readDailyTraining(a, now); check(today.items.find(item => item.id === dailyA).savedSets === 2 && today.percent === 50, "progress reads actual saved sets");
  check((await training.readDailyTraining(b, now)).savedSets === 0, "other patient progress unaffected");
  const bSlot = await service.start(b, dailyB, { side: "left" }, beginning);
  await service.state(b, bSlot.setId, { action: "exit", elapsedSeconds: 0 }, now);
  check((await prisma.exerciseSet.findUnique({ where: { id: bSlot.setId } })).status === "cancelled", "exit discards unsaved draft");
  const login = await fetch(`${origin}/api/auth/login`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ nationalId: accounts[0].nationalId, password: accounts[0].password }) });
  check(login.ok, "fixture login", "api");
  accounts[0].cookie = login.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
  async function api(url, body, authenticated = true, requestOrigin = origin) {
    return fetch(`${origin}${url}`, { method: "POST", headers: { Origin: requestOrigin, "Content-Type": "application/json", ...(authenticated ? { Cookie: accounts[0].cookie } : {}) }, body: JSON.stringify(body) });
  }
  check((await api(`/api/patient/training/sets/${bSlot.setId}`, payload)).status === 404, "HTTP cannot save another owner", "api");
  check((await api(`/api/patient/training/sets/${slot.setId}`, payload, false)).status === 401, "HTTP requires session", "api");
  check((await api(`/api/patient/training/sets/${slot.setId}`, payload, true, "http://evil.invalid")).status === 403, "HTTP rejects cross origin", "api");
  check((await api(`/api/patient/training/daily/${accounts[0].cameraDaily}/recording`, { side: "left" })).status === 422, "HTTP cannot use unapproved knee criteria", "api");
  delete accounts[0].cookie;
  fs.mkdirSync(path.dirname(generated), { recursive: true });
  fs.writeFileSync(generated, fs.readFileSync(path.join(root, process.env.MORE_CAMERA_HYDRATION === "1" ? "scripts/test-camera-hydration-browser.js" : "scripts/test-recording-browser.js"), "utf8").replace("null /*RECORDING_FIXTURE*/", JSON.stringify(accounts[0])).replace("false /*HYDRATION_BASELINE*/", String(process.env.MORE_HYDRATION_BASELINE === "1")));
  const output = execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npx.cmd --yes --package @playwright/cli playwright-cli -s=more-recording run-code --filename output/playwright/recording-code.js"], { cwd: root, encoding: "utf8", timeout: 240000, maxBuffer: 1024 * 1024 });
  const result = output.match(/### Result\r?\n([^\r\n]+)/);
  if (!result) console.error(output.match(/(?:Error|TimeoutError):[^\r\n]*/)?.[0] || "Browser returned no result");
  check(!!result, "browser returned sanitized results");
  console.log(JSON.stringify({ logicChecks, serviceChecks, apiChecks, browser: JSON.parse(result[1]), realHumanCameraTested: false }));
}
async function cleanup() {
  if (patients.length) {
    const owned = await prisma.user.findMany({ where: { id: { in: patients } }, select: { display_name: true } });
    if (owned.length !== patients.length || owned.some(user => !user.display_name.startsWith(prefix))) throw new Error("Fixture ownership guard failed");
    const daily = { day: { patient_id: { in: patients } } }; const session = { dailyExercise: daily }; const repetition = { set: { session } };
    await prisma.$transaction(async tx => {
      await tx.repetitionCheckpointResult.deleteMany({ where: { repetition } }); await tx.repetitionMetric.deleteMany({ where: { repetition } }); await tx.repetition.deleteMany({ where: repetition });
      await tx.cameraCheck.deleteMany({ where: { session } }); await tx.exerciseSet.deleteMany({ where: { session } }); await tx.exerciseSession.deleteMany({ where: session });
      await tx.dailyExercise.deleteMany({ where: daily }); await tx.rehabilitationDay.deleteMany({ where: { patient_id: { in: patients } } });
      await tx.planExerciseWeekday.deleteMany({ where: { planExercise: { plan: { patient_id: { in: patients } } } } }); await tx.planExercise.deleteMany({ where: { plan: { patient_id: { in: patients } } } }); await tx.rehabilitationPlan.deleteMany({ where: { patient_id: { in: patients } } });
      await tx.patientProfile.deleteMany({ where: { patient_id: { in: patients } } }); await tx.user.deleteMany({ where: { id: { in: patients }, display_name: { startsWith: prefix } } });
    });
  }
  if (fixtureExercise) {
    await prisma.exerciseCheckpoint.deleteMany({ where: { exercise_id: fixtureExercise.id } }); await prisma.exerciseAngleMetric.deleteMany({ where: { exercise_id: fixtureExercise.id } });
    await prisma.exercise.deleteMany({ where: { id: fixtureExercise.id, code: fixtureExercise.code } });
  }
}
main().catch(error => { console.error("Recording verification failed:", error.testLabel || error.code || "TEST_ERROR"); if (error.stdout) console.error(String(error.stdout).match(/(?:Error|TimeoutError):[^\r\n]*/)?.[0] || "Browser command failed"); process.exitCode = 1; }).finally(async () => {
  try { await cleanup(); console.log("Temporary recording fixtures removed; original catalog/data preserved."); } catch { console.error("Fixture cleanup failed; inspect only MoRe Recording Test records."); process.exitCode = 1; }
  if (fs.existsSync(generated)) fs.rmSync(generated); await prisma.$disconnect();
});
