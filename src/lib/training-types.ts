export type TrainingExercise = {
  id: number; code: string; name: string; english: string; module: number;
  view: string | null; supportsSide: boolean; tutorial: string | null;
};
export type TrainingItem = {
  id: number; exercise: TrainingExercise; side: string | null; targetSets: number;
  targetReps: number; sessionsPerDay: number; schedule: string; weekdays: number[];
  instructions: string | null;
};
export type TrainingTemplate = {
  id: number; code: string; name: string; description: string | null; version: number; items: TrainingItem[];
};
export type PatientTrainingPlan = {
  id: number; code: string; templateId: number | null; name: string; startsAt: string | null; items: TrainingItem[];
};
export type DailyTrainingItem = {
  id: number; planId: number; exercise: TrainingExercise; side: string | null;
  targetSets: number; targetReps: number; savedSets: number; status: "not_started" | "in_progress" | "completed";
  instructions: string | null; canStart: boolean;
};
export type DailyTraining = {
  date: string; dayId: number | null; items: DailyTrainingItem[]; totalSets: number;
  savedSets: number; percent: number; snapshotFromPreviousPlan: boolean;
  activePlan: PatientTrainingPlan | null;
};
export type TrainingHistory = {
  week: { date: string; count: number }[];
  recent: { id: number; date: string; exercise: string; reps: number; targetReps: number; seconds: number | null }[];
};
export function trainingHref(item: DailyTrainingItem, view: "guide" | "camera") {
  return `/patient/exercises/${encodeURIComponent(item.exercise.code)}/${view}?daily=${item.id}`;
}
