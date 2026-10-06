import "server-only";
import { prisma } from "./prisma";
import { AccountError } from "./account-validation";
import { isMockPlan } from "./mock-plan";

export async function readResults(patientId: number, sessionId?: number) {
  const sessions = await prisma.exerciseSession.findMany({ where: { ...(sessionId ? { id: sessionId } : {}), dailyExercise: { day: { patient_id: patientId } }, sets: { some: { status: "saved" } } },
    orderBy: { started_at: "desc" }, take: sessionId ? 1 : 200, include: {
      dailyExercise: { include: { day: { select: { local_date: true } }, exercise: { select: { name_th: true, code: true } }, planExercise: { select: { version_number: true, plan: { select: { sourceTemplate: { select: { template_code: true, name_th: true } } } } } } } },
      sets: { where: { status: "saved" }, orderBy: { set_number: "asc" }, include: { repetitions: { orderBy: { rep_number: "asc" }, include: { metrics: { include: { metric: { select: { label_th: true, definition_version: true } } } }, checkpointResults: { include: { checkpoint: { select: { phase: true } } } } } } } },
    } });
  if (sessionId && !sessions.length) throw new AccountError("ไม่พบผลการฝึก", 404);
  return sessions.map(session => ({ id: session.id, date: session.dailyExercise.day.local_date.toISOString().slice(0, 10), startedAt: session.started_at.toISOString(), exercise: session.dailyExercise.exercise.name_th, code: session.dailyExercise.exercise.code,
    isMock: isMockPlan(session.dailyExercise.planExercise.plan.sourceTemplate?.template_code),
    sourceTemplate: session.dailyExercise.planExercise.plan.sourceTemplate ? { code: session.dailyExercise.planExercise.plan.sourceTemplate.template_code, name: session.dailyExercise.planExercise.plan.sourceTemplate.name_th, version: session.dailyExercise.planExercise.version_number } : null,
    sets: session.sets.map(set => ({ id: set.id, number: set.set_number, target: set.target_reps, elapsed: set.elapsed_seconds, savedAt: set.saved_at?.toISOString() ?? null,
      repetitions: set.repetitions.map(rep => ({ number: rep.rep_number, side: rep.selected_side, correct: rep.is_correct, criteriaVersion: rep.criteria_version,
        metrics: rep.metrics.map(metric => ({ metricId: metric.metric_id, label: metric.metric.label_th, definitionVersion: metric.metric.definition_version, side: metric.selected_side, start: metric.start_angle_deg === null ? null : Number(metric.start_angle_deg), peak: Number(metric.peak_angle_deg), end: metric.end_angle_deg === null ? null : Number(metric.end_angle_deg) })),
        checkpoints: rep.checkpointResults.map(check => ({ phase: check.checkpoint.phase, passed: check.passed, value: check.observed_value === null ? null : Number(check.observed_value) })),
      })) })) }));
}
export type ResultSession = Awaited<ReturnType<typeof readResults>>[number];
