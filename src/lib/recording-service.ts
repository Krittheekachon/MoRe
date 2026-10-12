import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";
import { AccountError, object, onlyFields } from "./account-validation";
import { trainingDay } from "./training-calendar";
import { routineNow } from "./routine-clock";
import { routineProgress } from "./routine-progress";
import { approvedPoseCriteria } from "./pose/approved-criteria";
import { demoCriteria } from "./demo-policy";
import { poseEngine } from "./pose/engines/registry";
import { poseLandmarkNames } from "./pose/landmarks";
import type { CompletedRep, PoseCriteria, SavedSet, Side } from "./pose/types";

type Provider = (code: string, side: Side) => PoseCriteria | undefined;
const defaultProvider: Provider = (code, side) => approvedPoseCriteria[code]?.[side];
const unavailable = () => new AccountError("ยังไม่มีนิยามมุมและเกณฑ์ที่ยืนยันสำหรับท่านี้ กรุณาติดต่อทีมรักษา", 422);
function number(value: unknown, min: number, max: number, integer = false): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) throw new AccountError("ข้อมูลผลฝึกไม่ถูกต้อง");
  return value;
}
function sideValue(value: unknown): Side {
  if (value !== "left" && value !== "right") throw new AccountError("กรุณาเลือกข้างที่ฝึก");
  return value;
}
const dailyInclude = { day: true, exercise: { include: { module: true } } } as const;
type Daily = Prisma.DailyExerciseGetPayload<{ include: typeof dailyInclude }>;

async function ownedDaily(tx: Prisma.TransactionClient, patientId: number, dailyId: number) {
  const daily = await tx.dailyExercise.findFirst({ where: { id: dailyId, day: { patient_id: patientId } }, include: dailyInclude });
  if (!daily) throw new AccountError("ไม่พบรายการฝึก", 404);
  return daily;
}
async function lockDaily(tx: Prisma.TransactionClient, patientId: number, dailyId: number) {
  // Serialize allocation, state changes and saves, including simultaneous browser tabs.
  await tx.$queryRaw`SELECT de.id FROM daily_exercises de JOIN rehabilitation_days d ON d.id = de.rehabilitation_day_id WHERE de.id = ${dailyId} AND d.patient_id = ${patientId} FOR UPDATE OF de`;
  return ownedDaily(tx, patientId, dailyId);
}
async function savedCount(tx: Prisma.TransactionClient, dailyId: number) {
  return tx.exerciseSet.count({ where: { status: "saved", session: { daily_exercise_id: dailyId } } });
}
async function progressFor(tx: Prisma.TransactionClient, daily: Daily) {
  const sets = await tx.exerciseSet.findMany({ where: { status: "saved", session: { daily_exercise_id: daily.id } }, select: {
    _count: { select: { repetitions: true } }, repetitions: { take: 1, select: { selected_side: true } },
    session: { select: { cameraChecks: { take: 1, orderBy: { id: "desc" }, select: { selected_side: true } } } },
  } });
  return routineProgress(daily.target_sets,daily.target_reps_per_set,daily.selected_side,sets.map(set=>({count:set._count.repetitions,side:set.repetitions[0]?.selected_side ?? set.session.cameraChecks[0]?.selected_side ?? daily.selected_side})));
}
async function eligible(tx: Prisma.TransactionClient, daily: Daily, now: Date) {
  if (daily.day.local_date.toISOString().slice(0, 10) !== trainingDay(await routineNow(daily.day.patient_id,now)).date || daily.day.is_closed || !daily.exercise.is_active || !daily.exercise.module.is_active) throw new AccountError("รายการนี้ไม่สามารถฝึกต่อได้ กรุณากลับไปดูแผนวันนี้", 409);
}
async function criteriaFor(tx: Prisma.TransactionClient, daily: Daily, side: Side, provider: Provider) {
  if (daily.selected_side && !["both", "none", side].includes(daily.selected_side)) throw new AccountError("ข้างที่ฝึกไม่ตรงกับรายการฝึก", 422);
  const criteria = provider(daily.exercise.code, side) || (provider === defaultProvider ? await demoCriteria(daily.day.patient_id, daily.exercise_id, side) : undefined);
  if (!criteria || criteria.exerciseCode !== daily.exercise.code || !daily.exercise.supports_side_selection) throw unavailable();
  const metric = await tx.exerciseAngleMetric.findFirst({ where: { id: criteria.metricId, exercise_id: daily.exercise_id, is_primary: true, definition_version: criteria.definitionVersion } });
  if (!metric || metric.reference_axis !== null || criteria.landmarks.some(index => !Number.isInteger(index) || index < 0 || index >= poseLandmarkNames.length) || [metric.landmark_a, metric.landmark_b, metric.landmark_c].some((name, i) => name !== poseLandmarkNames[criteria.landmarks[i]])) throw unavailable();
  const checks = await tx.exerciseCheckpoint.findMany({ where: { id: { in: Object.values(criteria.checkpointIds) }, exercise_id: daily.exercise_id, metric_id: metric.id, criteria_version: criteria.criteriaVersion } });
  for (const [phase, id] of Object.entries(criteria.checkpointIds)) {
    const checkpoint = checks.find(check => check.id === id);
    const range = phase === "peak" ? criteria.correctPeak : phase === "returned" ? criteria.returned ?? criteria.start : criteria.start;
    if (!checkpoint || checkpoint.phase !== (phase === "returned" ? "return" : phase) || Number(checkpoint.min_value) !== range.min || Number(checkpoint.max_value) !== range.max || checkpoint.min_value === null || checkpoint.max_value === null) throw unavailable();
  }
  if (new Set(Object.values(criteria.checkpointIds)).size !== 3 || !poseEngine(criteria).validCriteria(criteria)) throw unavailable();
  return criteria;
}

const setInclude = { session: { include: { dailyExercise: { include: dailyInclude } } }, repetitions: { orderBy: { rep_number: "asc" }, include: { metrics: true } } } satisfies Prisma.ExerciseSetInclude;
async function ownedSet(tx: Prisma.TransactionClient, patientId: number, setId: number) {
  const found = await tx.exerciseSet.findFirst({ where: { id: setId, session: { dailyExercise: { day: { patient_id: patientId } } } }, include: setInclude });
  if (!found) throw new AccountError("ไม่พบเซตฝึก", 404);
  await lockDaily(tx, patientId, found.session.daily_exercise_id);
  // Re-read after acquiring the lock; another retry may just have committed.
  const locked = await tx.exerciseSet.findUnique({ where: { id: setId }, include: setInclude });
  if (!locked) throw new AccountError("ผลฝึกถูกเคลียร์แล้ว กรุณาโหลดแผนใหม่", 409);
  return locked;
}

function restoredReps(set: Awaited<ReturnType<typeof ownedSet>>, metricId: number): CompletedRep[] {
  return set.repetitions.map(rep => {
    const metric = rep.metrics.find(metric => metric.metric_id === metricId);
    if (!metric) throw new AccountError("Saved metrics unavailable", 409);
    return { startedAt: rep.started_at.getTime(), completedAt: rep.completed_at.getTime(),
      startAngle: Number(metric.start_angle_deg), peakAngle: Number(metric.peak_angle_deg),
      endAngle: Number(metric.end_angle_deg), confidence: Number(rep.confidence) };
  });
}
async function sideSavedSets(tx: Prisma.TransactionClient, dailyId: number, side: Side) {
  return tx.exerciseSet.findMany({ where: { status: "saved", session: { daily_exercise_id: dailyId, cameraChecks: { some: { selected_side: side } } } },
    orderBy: { id: "asc" }, include: { _count: { select: { repetitions: true } } } });
}

// Public routes use approved criteria, or the explicitly isolated synthetic Demo.
export function createRecordingService(provider: Provider = defaultProvider) {
  async function configuration(patientId: number, dailyId: number, side: Side) {
    return prisma.$transaction(async tx => {
      const daily = await ownedDaily(tx, patientId, dailyId);
      await eligible(tx, daily, new Date());
      return criteriaFor(tx, daily, side, provider);
    });
  }
  async function start(patientId: number, dailyId: number, input: Record<string, unknown>, now = new Date()) {
    onlyFields(input, ["side"]); const side = sideValue(input.side);
    return prisma.$transaction(async tx => {
      const daily = await lockDaily(tx, patientId, dailyId);
      await eligible(tx, daily, now); const criteria = await criteriaFor(tx, daily, side, provider);
      const existing = await tx.exerciseSet.findFirst({ where: { status: { in: ["draft", "paused"] }, session: { daily_exercise_id: dailyId, status: { in: ["in_progress", "paused"] } } }, orderBy: { id: "desc" }, include: { session: { include: { cameraChecks: { take: 1, orderBy: { id: "desc" } } } } } });
      if (existing?.session.cameraChecks[0] && existing.session.cameraChecks[0].selected_side !== side) throw new AccountError("มีเซตอีกข้างที่ยังไม่จบ กรุณาบันทึกหรือยกเลิกก่อน",409);
      if (existing) return { sessionId: existing.exercise_session_id, setId: existing.id, setNumber: existing.set_number, targetReps: existing.target_reps };
      const saved = await sideSavedSets(tx, dailyId, side);
      const completed = saved.filter(set => set._count.repetitions >= set.target_reps).length;
      if (completed >= daily.target_sets) throw new AccountError("Daily target for this side is complete", 409);
      const partial = saved.findLast(set => set._count.repetitions < set.target_reps);
      if (partial) {
        const stored = await ownedSet(tx, patientId, partial.id);
        const repetitions = restoredReps(stored, criteria.metricId);
        if (stored.repetitions.some(rep => rep.criteria_version !== criteria.criteriaVersion)) throw new AccountError("Saved criteria changed", 409);
        await tx.exerciseSession.update({ where: { id: stored.exercise_session_id }, data: { status: "in_progress", ended_at: null } });
        return { sessionId: stored.exercise_session_id, setId: stored.id, setNumber: completed + 1,
          targetReps: stored.target_reps, repetitions, elapsedSeconds: stored.elapsed_seconds ?? 0, baseReps: repetitions.length };
      }
      const previous = await tx.exerciseSession.findFirst({ where: { daily_exercise_id: dailyId, status: "in_progress", cameraChecks: { some: { selected_side: side } } }, orderBy: { id: "desc" }, include: { sets: { select: { set_number: true } } } });
      const session = (previous && !previous.sets.some(set => set.set_number === completed + 1) ? previous : null) || await tx.exerciseSession.create({ data: { daily_exercise_id: dailyId, started_at: now, cameraChecks: { create: { selected_side: side, checked_at: now, is_ready: false, feedback_code: "side_selected" } } } });
      const setNumber = completed + 1;
      const set = await tx.exerciseSet.create({ data: { exercise_session_id: session.id, set_number: setNumber, target_reps: daily.target_reps_per_set, started_at: now, last_activity_at: now } });
      await tx.dailyExercise.update({ where: { id: dailyId }, data: { status: "in_progress", started_at: daily.started_at || now } });
      await tx.rehabilitationDay.update({ where: { id: daily.rehabilitation_day_id }, data: { started_at: daily.day.started_at || now, last_activity_at: now } });
      return { sessionId: session.id, setId: set.id, setNumber, targetReps: set.target_reps };
    });
  }
  async function state(patientId: number, setId: number, input: Record<string, unknown>, now = new Date()) {
    onlyFields(input, ["action", "elapsedSeconds"]);
    if (!["pause", "resume", "restart", "exit"].includes(String(input.action))) throw new AccountError("ข้อมูลไม่ถูกต้อง");
    const elapsed = number(input.elapsedSeconds, 0, 2147483647, true);
    return prisma.$transaction(async tx => {
      const set = await ownedSet(tx, patientId, setId);
      if (set.status === "saved") {
        if (input.action === "resume" && set.repetitions.length >= set.target_reps) throw new AccountError("Set already complete", 409);
        if (set.repetitions.length < set.target_reps) await tx.exerciseSession.update({ where: { id: set.exercise_session_id }, data: { status: input.action === "resume" ? "in_progress" : "paused" } });
        return { cancelled: false, preserved: true };
      }
      if (set.status === "cancelled") {
        if (input.action === "resume" || input.action === "pause") throw new AccountError("เซตนี้ถูกยกเลิกแล้ว", 409);
        return { cancelled: true };
      }
      // Resume/save of an already-started set retain its original day's snapshot.
      const cancelled = input.action === "restart" || input.action === "exit";
      if (cancelled) {
        await tx.repetitionCheckpointResult.deleteMany({ where: { repetition: { set_id: setId } } });
        await tx.repetitionMetric.deleteMany({ where: { repetition: { set_id: setId } } });
        await tx.repetition.deleteMany({ where: { set_id: setId } });
      }
      await tx.exerciseSet.update({ where: { id: setId }, data: { status: cancelled ? "cancelled" : input.action === "pause" ? "paused" : "draft", elapsed_seconds: cancelled ? null : elapsed, last_activity_at: now } });
      await tx.exerciseSession.update({ where: { id: set.exercise_session_id }, data: { status: cancelled ? "cancelled" : input.action === "pause" ? "paused" : "in_progress", ended_at: cancelled ? now : null } });
      return { cancelled };
    });
  }
  async function save(patientId: number, setId: number, input: Record<string, unknown>, now = new Date()): Promise<SavedSet> {
    onlyFields(input, ["side", "metricId", "definitionVersion", "criteriaVersion", "elapsedSeconds", "repetitions", "baseReps"]);
    const side = sideValue(input.side);
    const elapsed = number(input.elapsedSeconds, 0, 2147483647, true);
    if (!Array.isArray(input.repetitions) || input.repetitions.length > 32767) throw new AccountError("ข้อมูลผลฝึกไม่ถูกต้อง");
    const reps = input.repetitions.map(value => {
      const rep = object(value); onlyFields(rep, ["startedAt", "completedAt", "startAngle", "peakAngle", "endAngle", "confidence"]);
      return Object.fromEntries(Object.entries(rep).map(([key, value]) => [key, number(value, 0, key.endsWith("At") ? now.getTime() : key === "confidence" ? 1 : 180, key.endsWith("At"))])) as CompletedRep;
    });
    const baseReps = input.baseReps === undefined ? 0 : number(input.baseReps, 0, 32767, true);
    return prisma.$transaction(async tx => {
      const set = await ownedSet(tx, patientId, setId); const daily = set.session.dailyExercise;
      const criteria = await criteriaFor(tx, daily, side, provider);
      const selected = await tx.cameraCheck.findFirst({ where: { exercise_session_id: set.exercise_session_id }, orderBy: { id: "desc" } });
      if (selected && selected.selected_side !== side) throw new AccountError("ข้างที่ฝึกไม่ตรงกับเซตที่เริ่ม",422);
      if (input.metricId !== criteria.metricId || input.definitionVersion !== criteria.definitionVersion || input.criteriaVersion !== criteria.criteriaVersion) throw new AccountError("นิยามหรือเกณฑ์เปลี่ยนแล้ว กรุณาติดต่อทีมรักษา", 409);
      if (!set.started_at) throw new AccountError("เซตนี้ไม่มีเวลาเริ่ม กรุณาติดต่อทีมรักษา", 422);
      let previous = set.started_at.getTime(); let duration = 0;
      for (const rep of reps) {
        if (Object.keys(rep).length !== 6 || rep.startedAt < previous || rep.completedAt <= rep.startedAt || rep.completedAt - rep.startedAt > 2147483647 || !poseEngine(criteria).complete(rep, criteria)) throw new AccountError("รอบฝึกยังไม่ครบหรือข้อมูลผลฝึกไม่ถูกต้อง");
        previous = rep.completedAt; duration += rep.completedAt - rep.startedAt;
      }
      if (duration > (elapsed + 1) * 1000 || elapsed * 1000 > now.getTime() - set.started_at!.getTime() + 1000) throw new AccountError("จำนวนครั้งหรือเวลาฝึกไม่ถูกต้อง");
      const persisted = set.repetitions.length;
      const samePrefix = reps.length >= persisted && set.repetitions.every((old, index) => {
        const rep = reps[index]; const metric = old.metrics.find(item => item.metric_id === criteria.metricId);
        return old.selected_side === side && old.criteria_version === criteria.criteriaVersion
          && old.started_at.getTime() === rep.startedAt && old.completed_at.getTime() === rep.completedAt
          && Number(old.confidence) === Number(rep.confidence.toFixed(3)) && metric
          && Number(metric.start_angle_deg) === Number(rep.startAngle.toFixed(2))
          && Number(metric.peak_angle_deg) === Number(rep.peakAngle.toFixed(2))
          && Number(metric.end_angle_deg) === Number(rep.endAngle.toFixed(2));
      });
      const identical = set.status === "saved" && samePrefix && reps.length === persisted && elapsed === set.elapsed_seconds;
      if (set.status === "saved" && !identical && (!samePrefix || baseReps !== persisted || persisted >= set.target_reps || reps.length < persisted || elapsed < (set.elapsed_seconds ?? 0))) throw new AccountError("Saved result changed or stale save request", 409);
      if (identical) {
        // Exact retries return the persisted summary without changing history.
      } else {
        if (!["draft", "paused", "saved"].includes(set.status) || set.session.status === "cancelled") throw new AccountError("Set unavailable", 409);
        for (const [offset, rep] of reps.slice(persisted).entries()) {
          const index = persisted + offset;

          const peak = Number(rep.peakAngle.toFixed(2));
          const correct = poseEngine(criteria).correct({ ...rep, peakAngle: peak }, criteria);
          await tx.repetition.create({ data: {
            set_id: setId, rep_number: index + 1, started_at: new Date(rep.startedAt), completed_at: new Date(rep.completedAt), selected_side: side, is_correct: correct, criteria_version: criteria.criteriaVersion, confidence: Number(rep.confidence.toFixed(3)),
            metrics: { create: { metric_id: criteria.metricId, start_angle_deg: Number(rep.startAngle.toFixed(2)), peak_angle_deg: peak, end_angle_deg: Number(rep.endAngle.toFixed(2)), duration_ms: rep.completedAt - rep.startedAt, selected_side: side } },
            checkpointResults: { create: Object.entries(criteria.checkpointIds).map(([phase, checkpointId]) => ({ checkpoint_id: checkpointId, passed: phase === "peak" ? correct : true, observed_value: Number((phase === "start" ? rep.startAngle : phase === "peak" ? rep.peakAngle : rep.endAngle).toFixed(3)) })) },
          } });
        }
        await tx.exerciseSet.update({ where: { id: setId }, data: { status: "saved", elapsed_seconds: elapsed, saved_at: now, last_activity_at: now } });
        const progress = await progressFor(tx,daily);
        await tx.dailyExercise.update({ where: { id: daily.id }, data: { status: progress.completed ? "completed" : "in_progress", completed_at: progress.completed ? daily.completed_at ?? now : null } });
        await tx.rehabilitationDay.update({ where: { id: daily.rehabilitation_day_id }, data: { last_activity_at: now } });
        await tx.exerciseSession.update({ where: { id: set.exercise_session_id }, data: { status: progress.completed ? "completed" : "in_progress", ended_at: progress.completed ? now : null } });
      }
      const summary = await tx.repetitionMetric.aggregate({ where: { metric_id: criteria.metricId, selected_side: side, repetition: { set_id: setId, set: { status: "saved" } } }, _max: { peak_angle_deg: true }, _avg: { peak_angle_deg: true } });
      const progress = await progressFor(tx,daily);
      const sideSets = await sideSavedSets(tx, daily.id, side);
      const planSetNumber = 1 + sideSets.filter(item => item.id < setId && item._count.repetitions >= item.target_reps).length;
      const siblings = await tx.dailyExercise.findMany({ where: { rehabilitation_day_id: daily.rehabilitation_day_id }, include: dailyInclude });
      const dayProgress = [];
      for (const item of siblings) dayProgress.push(await progressFor(tx, item));
      const correctReps = await tx.repetition.count({ where: { set_id: setId, is_correct: true } });
      return { setId, reps: reps.length, correctReps, setNumber: planSetNumber, targetReps: set.target_reps, setCompleted: reps.length >= set.target_reps, exerciseCompleted: progress.completed, dayCompleted: dayProgress.length > 0 && dayProgress.every(item => item.completed), savedSets: await savedCount(tx, daily.id), completedSets: progress.completedSets, targetSets: daily.target_sets, maxAngle: summary._max.peak_angle_deg === null ? null : Number(summary._max.peak_angle_deg), averageAngle: summary._avg.peak_angle_deg === null ? null : Number(summary._avg.peak_angle_deg) };
    }, { timeout: 15000 });
  }
  return { configuration, start, state, save };
}
export const recordingService = createRecordingService();
