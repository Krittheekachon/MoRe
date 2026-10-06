import "server-only";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";
import { AccountError } from "./account-validation";
import { demoEnabled, demoExerciseCode, isDemoPatient } from "./demo-policy";
import { trainingDay } from "./training-calendar";
import type { DailyTraining, DailyTrainingItem, PatientTrainingPlan, TrainingExercise, TrainingHistory, TrainingTemplate } from "./training-types";

const exerciseRelations = { module: true } as const;
const templateRelations = {
  creator: { select: { role: true, is_active: true } },
  exercises: { orderBy: [{ sort_order: "asc" }, { id: "asc" }], include: { exercise: { include: exerciseRelations }, weekdays: true } },
} satisfies Prisma.RehabilitationTemplateInclude;
const planRelations = {
  sourceTemplate: { select: { name_th: true, template_code: true } },
  exercises: { orderBy: { id: "asc" }, include: { exercise: { include: exerciseRelations }, weekdays: true } },
} as const;
type Template = Prisma.RehabilitationTemplateGetPayload<{ include: typeof templateRelations }>;
type Plan = Prisma.RehabilitationPlanGetPayload<{ include: typeof planRelations }>;
type Exercise = Prisma.ExerciseGetPayload<{ include: typeof exerciseRelations }>;

function exerciseDTO(exercise: Exercise): TrainingExercise {
  return { id: exercise.id, code: exercise.code, name: exercise.name_th, english: exercise.name_en || "", module: exercise.module.module_number, view: exercise.camera_view, supportsSide: exercise.supports_side_selection, tutorial: exercise.tutorial_steps };
}

function validTemplate(template: Template) {
  if (!template.is_active || !template.creator.is_active || !["doctor", "therapist", "admin"].includes(template.creator.role) || !template.exercises.length) return false;
  const ids = new Set<number>();
  return template.exercises.every(item => {
    if (ids.has(item.exercise_id)) return false;
    ids.add(item.exercise_id);
    return item.exercise.is_active && item.exercise.module.is_active &&
      item.target_sets > 0 && item.target_reps_per_set > 0 && item.sessions_per_day > 0 && item.target_sets * item.sessions_per_day <= 32767 &&
      [null, "none", "left", "right", "both"].includes(item.selected_side) &&
      (item.exercise.supports_side_selection || item.selected_side === null || item.selected_side === "none") &&
      (item.schedule_type === "daily" || (item.schedule_type === "weekly" && item.weekdays.length > 0 && item.weekdays.every(day => day.weekday >= 1 && day.weekday <= 7)));
  });
}

function templateDTO(template: Template): TrainingTemplate {
  return { id: template.id, code: template.template_code, name: template.name_th, description: template.description, version: template.version_number,
    items: template.exercises.map(item => ({ id: item.id, exercise: exerciseDTO(item.exercise), side: item.selected_side, targetSets: item.target_sets, targetReps: item.target_reps_per_set, sessionsPerDay: item.sessions_per_day, schedule: item.schedule_type, weekdays: item.weekdays.map(day => day.weekday).sort(), instructions: item.instructions })) };
}

function planDTO(plan: Plan): PatientTrainingPlan {
  const current = plan.exercises.filter(item => item.effective_to === null);
  return { id: plan.id, code: plan.plan_code, templateCode: plan.sourceTemplate?.template_code ?? null, templateId: plan.source_template_id, name: plan.sourceTemplate?.name_th || plan.plan_code, startsAt: current.length ? new Date(Math.min(...current.map(item => item.effective_from.getTime()))).toISOString() : null,
    items: plan.exercises.filter(item => item.effective_to === null).map(item => ({ id: item.id, exercise: exerciseDTO(item.exercise), side: item.selected_side, targetSets: item.target_sets, targetReps: item.target_reps_per_set, sessionsPerDay: item.sessions_per_day, schedule: item.schedule_type, weekdays: item.weekdays.map(day => day.weekday).sort(), instructions: item.instruction_override })) };
}

async function lockPatient(tx: Prisma.TransactionClient, patientId: number) {
  const rows = await tx.$queryRaw<{ patient_id: number }[]>`SELECT patient_id FROM patient_profiles WHERE patient_id = ${patientId} FOR UPDATE`;
  if (!rows.length) throw new AccountError("ไม่พบข้อมูลผู้ป่วย", 403);
}

export async function listTrainingTemplates(patientId?: number) {
  const demo = patientId !== undefined && demoEnabled() && await isDemoPatient(patientId);
  const templates = await prisma.rehabilitationTemplate.findMany({ where: { is_active: true }, orderBy: [{ name_th: "asc" }, { id: "asc" }], include: templateRelations });
  return templates.filter(item => validTemplate(item) && (demo ? item.template_code.startsWith("DEMO-") && item.exercises.every(exercise => exercise.exercise.code === demoExerciseCode) : !item.template_code.startsWith("DEMO-") && item.exercises.every(exercise => exercise.exercise.code !== demoExerciseCode))).map(templateDTO);
}

export async function readTrainingPlan(patientId: number) {
  const plan = await prisma.rehabilitationPlan.findFirst({ where: { patient_id: patientId, status: "active" }, orderBy: { id: "desc" }, include: planRelations });
  return plan ? planDTO(plan) : null;
}

export async function selectTrainingTemplate(patientId: number, templateId: number, now = new Date(), configuredBy = patientId) {
  const allowed = await listTrainingTemplates(patientId);
  if (!allowed.some(template => template.id === templateId)) throw new AccountError("แผนนี้ยังไม่พร้อมใช้งาน", 422);
  return prisma.$transaction(async tx => {
    await lockPatient(tx, patientId);
    await tx.$queryRaw`SELECT id FROM rehabilitation_templates WHERE id = ${templateId} FOR SHARE`;
    const template = await tx.rehabilitationTemplate.findUnique({ where: { id: templateId }, include: templateRelations });
    if (!template || !validTemplate(template)) throw new AccountError("แผนนี้ยังไม่พร้อมใช้งาน กรุณาติดต่อทีมรักษา", 422);
    const active = await tx.rehabilitationPlan.findMany({ where: { patient_id: patientId, status: "active" }, include: planRelations });
    if (active.length > 1) throw new AccountError("มีแผนใช้งานซ้อนกัน กรุณาติดต่อทีมรักษา", 409);
    if (active[0]?.source_template_id === templateId) return { plan: planDTO(active[0]), reused: true };
    const today = trainingDay(now);
    const snapshot = await tx.rehabilitationDay.findUnique({ where: { patient_id_local_date: { patient_id: patientId, local_date: today.storedDate } } });
    const effectiveFrom = snapshot ? today.next : now;
    for (const old of active) {
      await tx.planExercise.updateMany({ where: { plan_id: old.id, effective_to: null, effective_from: { lt: effectiveFrom } }, data: { effective_to: effectiveFrom } });
      // A same-day replacement may supersede a plan that has not started yet.
      await tx.rehabilitationPlan.update({ where: { id: old.id }, data: { status: "ended", updated_at: now } });
    }
    const plan = await tx.rehabilitationPlan.create({ data: {
      plan_code: `MP-${randomUUID()}`, patient_id: patientId, created_by: configuredBy,
      source_template_id: template.id, created_at: now, updated_at: now,
      exercises: { create: template.exercises.map(item => ({
        source_template_exercise_id: item.id, exercise_id: item.exercise_id, selected_side: item.selected_side,
        target_sets: item.target_sets, target_reps_per_set: item.target_reps_per_set, sessions_per_day: item.sessions_per_day,
        schedule_type: item.schedule_type, effective_from: effectiveFrom, version_number: template.version_number,
        configured_by: configuredBy, instruction_override: item.instructions,
        weekdays: { create: item.weekdays.map(day => ({ weekday: day.weekday })) },
      })) },
    }, include: planRelations });
    return { plan: planDTO(plan), reused: false };
  }, { timeout: 10000 });
}

async function ensureTrainingDay(patientId: number, now: Date) {
  const today = trainingDay(now);
  return prisma.$transaction(async tx => {
    await lockPatient(tx, patientId);
    const existing = await tx.rehabilitationDay.findUnique({ where: { patient_id_local_date: { patient_id: patientId, local_date: today.storedDate } } });
    if (existing) return existing.id;
    const plans = await tx.rehabilitationPlan.findMany({ where: { patient_id: patientId, status: "active" }, select: { id: true } });
    if (plans.length > 1) throw new AccountError("มีแผนใช้งานซ้อนกัน กรุณาติดต่อทีมรักษา", 409);
    // Do not freeze an empty day before the patient's first plan selection.
    if (!plans.length) return null;
    const assigned = await tx.planExercise.findMany({
      where: { plan_id: { in: plans.map(plan => plan.id) }, effective_from: { lte: now }, OR: [{ effective_to: null }, { effective_to: { gt: now } }] },
      orderBy: { id: "asc" }, include: { weekdays: true },
    });
    const scheduled = assigned.filter(item => item.schedule_type === "daily" || (item.schedule_type === "weekly" && item.weekdays.some(day => day.weekday === today.weekday)));
    if (scheduled.some(item => item.target_sets * item.sessions_per_day > 32767)) throw new AccountError("เป้าหมายรายวันไม่ถูกต้อง กรุณาติดต่อทีมรักษา", 422);
    const day = await tx.rehabilitationDay.create({ data: {
      patient_id: patientId, local_date: today.storedDate,
      dailyExercises: { create: scheduled.map(item => ({ plan_exercise_id: item.id, exercise_id: item.exercise_id, selected_side: item.selected_side, target_sets: item.target_sets * item.sessions_per_day, target_reps_per_set: item.target_reps_per_set })) },
    } });
    return day.id;
  }, { timeout: 10000 });
}

const dailyRelations = {
  exercise: { include: exerciseRelations }, day: true,
  planExercise: { select: { plan_id: true, instruction_override: true } },
  sessions: { select: { _count: { select: { sets: { where: { status: "saved" } } } } } },
} as const;
type Daily = Prisma.DailyExerciseGetPayload<{ include: typeof dailyRelations }>;

function dailyDTO(item: Daily, today: string): DailyTrainingItem {
  const savedSets = item.sessions.reduce((sum, session) => sum + session._count.sets, 0);
  const status = savedSets >= item.target_sets ? "completed" : savedSets > 0 || item.started_at ? "in_progress" : "not_started";
  return { id: item.id, planId: item.planExercise.plan_id, exercise: exerciseDTO(item.exercise), side: item.selected_side, targetSets: item.target_sets, targetReps: item.target_reps_per_set, savedSets, status,
    instructions: item.planExercise.instruction_override,
    canStart: item.day.local_date.toISOString().slice(0, 10) === today && !item.day.is_closed && savedSets < item.target_sets && item.exercise.is_active && item.exercise.module.is_active };
}

export async function readDailyTraining(patientId: number, now = new Date()): Promise<DailyTraining> {
  const today = trainingDay(now);
  const dayId = await ensureTrainingDay(patientId, now);
  const records = dayId ? await prisma.dailyExercise.findMany({ where: { rehabilitation_day_id: dayId, day: { patient_id: patientId } }, orderBy: { id: "asc" }, include: dailyRelations }) : [];
  const items = records.map(item => dailyDTO(item, today.date));
  const totalSets = items.reduce((sum, item) => sum + item.targetSets, 0);
  const savedSets = items.reduce((sum, item) => sum + item.savedSets, 0);
  const activePlan = await readTrainingPlan(patientId);
  return { date: today.date, dayId, items, totalSets, savedSets, percent: totalSets ? Math.min(100, Math.round(items.reduce((sum, item) => sum + Math.min(item.savedSets, item.targetSets), 0) / totalSets * 100)) : 0,
    activePlan, snapshotFromPreviousPlan: items.some(item => item.planId !== activePlan?.id) };
}

export async function readCameraAssignment(patientId: number, dailyId: number, code?: string, guide = false, now = new Date()) {
  const item = await prisma.dailyExercise.findFirst({ where: { id: dailyId, day: { patient_id: patientId }, ...(code ? { exercise: { code } } : {}) }, include: dailyRelations });
  if (!item) throw new AccountError("ไม่พบรายการฝึก", 404);
  const today = trainingDay(now).date;
  const assignment = dailyDTO(item, today);
  if (item.day.local_date.toISOString().slice(0, 10) !== today || (!guide && !assignment.canStart)) throw new AccountError("รายการนี้ไม่สามารถเริ่มฝึกได้ กรุณากลับไปดูแผนวันนี้", 409);
  return assignment;
}

export async function readTrainingHistory(patientId: number, now = new Date()): Promise<TrainingHistory> {
  const today = trainingDay(now).storedDate;
  const start = new Date(today.getTime() - 6 * 86400000);
  const records = await prisma.exerciseSet.findMany({ where: { status: "saved", session: { dailyExercise: { day: { patient_id: patientId, local_date: { gte: start, lte: today } } } } }, orderBy: [{ saved_at: "desc" }, { id: "desc" }], select: {
    id: true, target_reps: true, elapsed_seconds: true, _count: { select: { repetitions: true } },
    session: { select: { dailyExercise: { select: { exercise: { select: { name_th: true } }, day: { select: { local_date: true } } } } } },
  } });
  const recent = records.slice(0, 3).map(set => ({ id: set.id, date: set.session.dailyExercise.day.local_date.toISOString().slice(0, 10), exercise: set.session.dailyExercise.exercise.name_th, reps: set._count.repetitions, targetReps: set.target_reps, seconds: set.elapsed_seconds }));
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start.getTime() + i * 86400000).toISOString().slice(0, 10);
    return { date, count: records.filter(set => set.session.dailyExercise.day.local_date.toISOString().slice(0, 10) === date).length };
  });
  return { week, recent };
}
