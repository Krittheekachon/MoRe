import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createJiti } from "jiti";
import dotenv from "dotenv";
dotenv.config({ quiet: true });

const filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(filename), "..");
const jiti = createJiti(filename, { alias: { "@": path.join(root, "src"), "server-only": path.join(root, "node_modules/next/dist/compiled/server-only/empty.js") } });
const generated = path.join(root, "test-results", "training-browser-code.js");
const prefix = "MoRe Training Test";
let prisma;
const patients = []; const users = []; const templates = [];
let checks = 0;
function check(condition, label) { if (!condition) throw Object.assign(new Error(label), { testLabel: label }); checks++; }

async function cleanup() {
  if (!prisma || !users.length) return;
  const owned = await prisma.user.findMany({ where: { id: { in: users } }, select: { id: true, display_name: true } });
  if (owned.length !== users.length || owned.some(user => !user.display_name.startsWith(prefix))) throw new Error("Synthetic ownership check failed; no cleanup performed");
  const patientFilter = { day: { patient_id: { in: patients } } };
  const sessionFilter = { dailyExercise: patientFilter };
  const repetitionFilter = { set: { session: sessionFilter } };
  await prisma.$transaction(async tx => {
    await tx.repetitionCheckpointResult.deleteMany({ where: { repetition: repetitionFilter } });
    await tx.repetitionMetric.deleteMany({ where: { repetition: repetitionFilter } });
    await tx.repetition.deleteMany({ where: repetitionFilter });
    await tx.cameraCheck.deleteMany({ where: { session: sessionFilter } });
    await tx.exerciseSet.deleteMany({ where: { session: sessionFilter } });
    await tx.exerciseSession.deleteMany({ where: sessionFilter });
    await tx.dailyExercise.deleteMany({ where: patientFilter });
    await tx.rehabilitationDay.deleteMany({ where: { patient_id: { in: patients } } });
    await tx.planExerciseWeekday.deleteMany({ where: { planExercise: { plan: { patient_id: { in: patients } } } } });
    await tx.planExercise.deleteMany({ where: { plan: { patient_id: { in: patients } } } });
    await tx.rehabilitationPlan.deleteMany({ where: { patient_id: { in: patients } } });
    await tx.templateExerciseWeekday.deleteMany({ where: { templateExercise: { template_id: { in: templates } } } });
    await tx.templateExercise.deleteMany({ where: { template_id: { in: templates } } });
    await tx.rehabilitationTemplate.deleteMany({ where: { id: { in: templates }, created_by: { in: users } } });
    await tx.patientProfile.deleteMany({ where: { patient_id: { in: patients } } });
    await tx.user.deleteMany({ where: { id: { in: users }, display_name: { startsWith: prefix } } });
  }, { timeout: 20000 });
}

async function main() {
  ({ prisma } = await jiti.import(path.join(root, "src/lib/prisma.ts")));
  const service = await jiti.import(path.join(root, "src/lib/training-service.ts"));
  const { trainingDay } = await jiti.import(path.join(root, "src/lib/training-calendar.ts"));
  const security = await jiti.import(path.join(root, "src/lib/account-security.ts"));
  const url = new URL(process.env.DATABASE_URL);
  check(["localhost", "127.0.0.1"].includes(url.hostname), "tests require a local development database");
  const now = new Date(); const day = trainingDay(now); const tag = randomUUID().slice(0, 8);
  check(trainingDay(new Date("2026-12-31T16:59:59Z")).date === "2026-12-31", "Thai day before new year midnight");
  check(trainingDay(new Date("2026-12-31T17:00:00Z")).date === "2027-01-01", "Thai day after new year midnight");
  check(trainingDay(new Date("2026-10-04T17:00:00Z")).weekday === 1, "ISO Monday in Thailand");
  const staff = await prisma.user.create({ data: { role: "therapist", display_name: `${prefix} Staff ${tag}`, password_hash: await security.hashPassword(randomBytes(24).toString("hex")), created_at: now, updated_at: now } });
  users.push(staff.id);
  const accounts = [];
  for (const letter of ["A", "B"]) {
    const nationalId = `0${String(BigInt(`0x${randomBytes(6).toString("hex")}`) % 1000000000000n).padStart(12, "0")}`;
    const password = randomBytes(24).toString("hex");
    const user = await prisma.user.create({ data: { role: "patient", display_name: `${prefix} Patient ${letter} ${tag}`, password_hash: await security.hashPassword(password), created_at: now, updated_at: now,
      patientProfile: { create: { national_id_lookup: security.nationalIdLookup(nationalId), national_id_encrypted: security.encryptNationalId(nationalId), full_name: `${prefix} Patient ${letter} ${tag}`, date_of_birth: new Date("1980-01-01"), sex: "unspecified", updated_at: now } } } });
    patients.push(user.id); users.push(user.id); accounts.push({ id: user.id, nationalId, password });
  }
  const catalog = await prisma.exercise.findMany({ where: { code: { in: ["seated-trunk", "ankle-pump", "bridging"] } } });
  const exercise = code => catalog.find(item => item.code === code);
  check(catalog.length === 3, "existing catalog is required");
  const makeItem = (code, order, weekly = false, frequency = 1) => {
    const e = exercise(code);
    return { exercise_id: e.id, target_sets: e.default_sets, target_reps_per_set: e.default_reps_per_set,
      sessions_per_day: frequency, selected_side: e.supports_side_selection ? null : "none", sort_order: order,
      schedule_type: weekly ? "weekly" : "daily", instructions: "Synthetic software test only; not a clinical prescription.",
      weekdays: { create: weekly ? [{ weekday: day.weekday }] : [] } };
  };
  async function template(label, items, creator = staff.id) {
    const result = await prisma.rehabilitationTemplate.create({ data: { template_code: `TEST-${tag}-${label}`, name_th: `${prefix} Template ${label} ${tag}`, description: "Synthetic test fixture; not a clinical plan.", created_by: creator, created_at: now, updated_at: now, exercises: { create: items } } });
    templates.push(result.id); return result.id;
  }
  const templateA = await template("A", [makeItem("seated-trunk", 1, false, 2), makeItem("ankle-pump", 2, true)]);
  const templateB = await template("B", [makeItem("bridging", 1)]);
  const invalidTemplate = await template("Patient", [makeItem("bridging", 1)], patients[0]);
  const duplicateTemplate = await template("Duplicate", [makeItem("seated-trunk", 1), makeItem("seated-trunk", 2)]);
  const listed = await service.listTrainingTemplates();
  check(listed.some(item => item.id === templateA) && listed.some(item => item.id === templateB), "clinician test templates visible");
  check(!listed.some(item => [invalidTemplate, duplicateTemplate].includes(item.id)), "invalid templates not offered");
  const source = fs.readFileSync(path.join(root, "scripts/test-training-browser.js"), "utf8");
  fs.mkdirSync(path.dirname(generated), { recursive: true });
  fs.writeFileSync(generated, source.replace("null /*TRAINING_FIXTURE*/", JSON.stringify({ accounts, templateA, templateB, invalidTemplate })));
  let output;
  try {
    output = execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npx.cmd --yes --package @playwright/cli playwright-cli -s=more-training run-code --filename test-results/training-browser-code.js"], { cwd: root, encoding: "utf8", timeout: 240000, maxBuffer: 1024 * 1024 });
  } catch (error) {
    const text = String(error.stdout || "");
    const failure = text.match(/Training check failed: ([^\r\n]+)/);
    throw Object.assign(new Error("Browser test failed"), { testLabel: failure ? failure[1] : "browser automation failed; no credentials logged" });
  }
  const result = output.match(/### Result\r?\n([^\r\n]+)/);
  check(!!result, "browser returned a sanitized result");
  const browserResult = JSON.parse(result[1]);
  const [a, b] = patients;
  check(await prisma.rehabilitationPlan.count({ where: { patient_id: { in: patients } } }) === 2, "concurrent selections created exactly two patient plans");
  check(await prisma.rehabilitationDay.count({ where: { patient_id: { in: patients } } }) === 2, "concurrent daily reads created one day each");
  const copied = await prisma.planExercise.findMany({ where: { plan: { patient_id: a } }, include: { weekdays: true, sourceTemplateExercise: true } });
  check(copied.every(item => item.target_sets === item.sourceTemplateExercise.target_sets && item.target_reps_per_set === item.sourceTemplateExercise.target_reps_per_set && item.sessions_per_day === item.sourceTemplateExercise.sessions_per_day && item.selected_side === item.sourceTemplateExercise.selected_side && item.instruction_override === item.sourceTemplateExercise.instructions && item.version_number === 1), "all clinician fields copied");
  check(copied.find(item => item.schedule_type === "weekly").weekdays[0].weekday === day.weekday, "weekly days copied");
  const current = await service.readDailyTraining(a, now);
  const daily = current.items.find(item => item.exercise.code === "seated-trunk");
  await prisma.exerciseSession.create({ data: { daily_exercise_id: daily.id, started_at: now, status: "completed", sets: { create: ["saved", "draft", "paused", "cancelled"].map((status, index) => ({ set_number: index + 1, target_reps: daily.targetReps, status, saved_at: status === "saved" ? now : null })) } } });
  await prisma.exerciseSession.create({ data: { daily_exercise_id: daily.id, started_at: now, status: "cancelled", sets: { create: { set_number: 1, target_reps: daily.targetReps, status: "saved", saved_at: now } } } });
  await prisma.dailyExercise.update({ where: { id: daily.id }, data: { status: "completed" } });
  const saved = await service.readDailyTraining(a, now);
  check(saved.savedSets === 2 && saved.percent === 22 && saved.items.find(item => item.id === daily.id).status === "in_progress", "saved sets accumulate across sessions, not cached status");
  check((await service.readDailyTraining(b, now)).savedSets === 0, "other patient's progress stays zero");
  const previous = new Date(day.start.getTime() - 12 * 3600000);
  await prisma.planExercise.updateMany({ where: { plan: { patient_id: a } }, data: { effective_from: new Date(day.start.getTime() - 2 * 86400000) } });
  const yesterday = await service.readDailyTraining(a, previous);
  const old = yesterday.items.find(item => item.exercise.code === "seated-trunk");
  await prisma.exerciseSession.create({ data: { daily_exercise_id: old.id, started_at: previous, status: "completed", sets: { create: { set_number: 1, target_reps: old.targetReps, status: "saved", saved_at: previous } } } });
  check((await service.readDailyTraining(a, now)).savedSets === 2, "previous-day results do not count today");
  check((await service.readTrainingHistory(a, now)).week.reduce((sum, item) => sum + item.count, 0) === 3, "saved history retains previous day");
  const before = JSON.stringify(saved.items.map(item => [item.id, item.targetSets, item.targetReps]));
  await service.selectTrainingTemplate(a, templateB, now);
  const changed = await service.readDailyTraining(a, now);
  check(JSON.stringify(changed.items.map(item => [item.id, item.targetSets, item.targetReps])) === before && changed.snapshotFromPreviousPlan, "selection preserves today's snapshot");
  const tomorrowTime = new Date(day.next.getTime() + 60000);
  const tomorrow = await service.readDailyTraining(a, tomorrowTime);
  check(tomorrow.items.length === 1 && tomorrow.items[0].exercise.code === "bridging" && tomorrow.items[0].savedSets === 0 && tomorrow.totalSets === exercise("bridging").default_sets, "new Thai day uses new plan and starts at zero");
  check((await service.readDailyTraining(a, previous)).items.some(item => item.id === old.id && item.savedSets === 1), "old history is not rewritten");
  await service.selectTrainingTemplate(a, templateA, now);
  await service.selectTrainingTemplate(a, templateB, now);
  check(await prisma.rehabilitationPlan.count({ where: { patient_id: a, status: "active" } }) === 1, "same-day replacement of a future plan remains valid");
  await prisma.exerciseSession.create({ data: { daily_exercise_id: browserResult.itemB, started_at: now, sets: { create: Array.from({ length: 6 }, (_, i) => ({ set_number: i + 1, target_reps: daily.targetReps, status: "saved", saved_at: now })) } } });
  try { await service.readCameraAssignment(b, browserResult.itemB, "seated-trunk", false, now); check(false, "completed item must be blocked"); } catch (error) { check(error.status === 409, "completed camera blocked"); }
  try { await service.readCameraAssignment(b, daily.id, "seated-trunk", false, now); check(false, "other patient must be blocked"); } catch (error) { check(error.status === 404, "camera owner checked"); }
  try { await service.readCameraAssignment(a, old.id, "seated-trunk", false, now); check(false, "old day must be blocked"); } catch (error) { check(error.status === 409, "previous-day camera blocked"); }
  await prisma.rehabilitationDay.update({ where: { id: browserResult.dayA }, data: { is_closed: true } });
  try { await service.readCameraAssignment(a, daily.id, "seated-trunk", false, now); check(false, "closed day must be blocked"); } catch (error) { check(error.status === 409, "closed-day camera blocked"); }
  await prisma.rehabilitationTemplate.update({ where: { id: templateB }, data: { is_active: false } });
  const countBefore = await prisma.rehabilitationPlan.count({ where: { patient_id: a } });
  try { await service.selectTrainingTemplate(a, templateB, now); check(false, "inactive template must be blocked"); } catch (error) { check(error.status === 422, "inactive template blocked"); }
  try { await service.selectTrainingTemplate(a, duplicateTemplate, now); check(false, "duplicate source must be blocked"); } catch (error) { check(error.status === 422, "unrepresentable duplicate source blocked"); }
  check(await prisma.rehabilitationPlan.count({ where: { patient_id: a } }) === countBefore, "failed selection creates no partial plan");
  const noTrainingDay = new Date(day.next.getTime() + 86400000 + 60000);
  const bPlan = await service.readTrainingPlan(b);
  await prisma.planExercise.updateMany({ where: { plan_id: bPlan.id }, data: { schedule_type: "weekly" } });
  await prisma.planExerciseWeekday.deleteMany({ where: { planExercise: { plan_id: bPlan.id } } });
  const offDay = await service.readDailyTraining(b, noTrainingDay);
  check(offDay.items.length === 0 && offDay.percent === 0 && offDay.totalSets === 0, "empty scheduled day avoids division by zero");
  console.log(JSON.stringify({ serviceChecks: checks, browserChecks: browserResult.browserChecks, responsiveCombinations: browserResult.responsiveCombinations, syntheticPatients: 2 }));
}

main().catch(error => {
  console.error("Training verification failed:", error.testLabel || error.code || "TEST_ERROR");
  process.exitCode = 1;
}).finally(async () => {
  try { await cleanup(); console.log("Synthetic training fixtures removed; existing data and catalog preserved."); }
  catch { console.error("Synthetic cleanup failed; inspect only MoRe Training Test records before retrying."); process.exitCode = 1; }
  if (fs.existsSync(generated)) fs.rmSync(generated);
  if (prisma) await prisma.$disconnect();
});
