import "server-only";
import { exerciseDisplayName } from "./exercise-display";
import { prisma } from "./prisma";
import { readDailyTraining } from "./training-service";
import { routineProgress } from "./routine-progress";
import { isMockPlan } from "./mock-plan";
import { AccountError } from "./account-validation";

export async function readPatientProgress(patientId: number, dailyId?: number) {
  const today = await readDailyTraining(patientId);
  const records = await prisma.dailyExercise.findMany({
    where: { day: { patient_id: patientId } }, orderBy: [{ day: { local_date: "desc" } }, { id: "asc" }],
    include: { day: true, exercise: { include: { module: true } }, planExercise: { include: { plan: { include: { sourceTemplate: true } } } },
      sessions: { orderBy: { id: "asc" }, include: { cameraChecks: { orderBy: { id: "desc" }, take: 1 }, sets: { where: { status: "saved" }, orderBy: { id: "asc" }, include: { repetitions: { orderBy: { rep_number: "asc" }, include: { metrics: { include: { metric: true } } } } } } } },
    },
  });
  const days = records.map(item => {
    const sets = item.sessions.flatMap(session => session.sets.map(set => {
      const side = set.repetitions[0]?.selected_side ?? session.cameraChecks[0]?.selected_side ?? item.selected_side;
      const angles = new Map<string, { label: string; values: number[] }>();
      for (const rep of set.repetitions) for (const m of rep.metrics) {
        if (!m.metric.is_primary) continue;
        const key = `${m.metric_id}:${m.metric.definition_version}:${m.selected_side}`;
        const angle = angles.get(key) ?? { label: m.metric.label_th, values: [] };
        angle.values.push(Number(m.peak_angle_deg)); angles.set(key, angle);
      }
      return { id: set.id, sessionId: session.id, side, count: set.repetitions.length, correct: set.repetitions.filter(r => r.is_correct).length, target: set.target_reps, elapsed: set.elapsed_seconds,
        angles: [...angles.entries()].map(([key, a]) => ({ key, label: a.label, values: a.values })) };
    }));
    const progress = routineProgress(item.target_sets, item.target_reps_per_set, item.selected_side, sets);
    const angleGroups = new Map<string, { label: string; values: number[] }>();
    for (const set of sets) for (const a of set.angles) { const group = angleGroups.get(a.key) ?? { label: a.label, values: [] }; group.values.push(...a.values); angleGroups.set(a.key, group); }
    return { id: item.id, date: item.day.local_date.toISOString().slice(0, 10), code: item.exercise.code, name: exerciseDisplayName(item.exercise),
      module: item.exercise.module.module_number, moduleName: item.exercise.module.name_th,
      isTest: item.exercise.code.startsWith("demo-") || isMockPlan(item.planExercise.plan.sourceTemplate?.template_code),
      side: item.selected_side, targetSetsPerSide: item.target_sets, targetReps: item.target_reps_per_set,
      ...progress, count: sets.reduce((n, s) => n + s.count, 0), correct: sets.reduce((n, s) => n + s.correct, 0),
      visits: item.sessions.filter(s => s.sets.length > 0).length, sets,
      angles: [...angleGroups.entries()].map(([key, a]) => ({ key, label: a.label, average: a.values.length ? a.values.reduce((n, v) => n + v, 0) / a.values.length : null, max: a.values.length ? Math.max(...a.values) : null })),
    };
  });
  const selected = dailyId === undefined ? null : days.find(d => d.id === dailyId);
  if (dailyId !== undefined && !selected) throw new AccountError("ไม่พบรายการความก้าวหน้าของคุณ", 404);
  return { today: today.date, days, selected };
}
export type PatientProgress = Awaited<ReturnType<typeof readPatientProgress>>;
export type ProgressDay = PatientProgress["days"][number];
