import { calculateAge } from "./birth-date";

export const demoDate = "2026-10-02";
export const exercises = [
  { id: "seated-trunk", module: 1, name: "บริหารลำตัวขณะนั่ง", english: "Seated Trunk Exercise", view: "ด้านหน้า", side: false },
  { id: "ankle-pump", module: 1, name: "กระดกข้อเท้า", english: "Ankle Pumping Exercise", view: "ด้านข้าง", side: true },
  { id: "seated-leg-raise", module: 2, name: "ยกขาขณะนั่ง", english: "Seated Leg Raise", view: "ด้านข้าง", side: true },
  { id: "sit-to-stand", module: 2, name: "ลุกยืนจากท่านั่ง", english: "Sit to Stand", view: "ด้านข้าง", side: false },
  { id: "bridging", module: 2, name: "ยกสะโพก", english: "Bridging Exercise", view: "ด้านข้าง", side: false },
] as const;
export type ExerciseId = typeof exercises[number]["id"];
export type PatientProfile = {
  id: string; hn: string; full_name: string; date_of_birth: string; sex: string;
  phone: string; primary_doctor_name: string; stroke_type: string; stroke_diagnosed_on: string;
  other_conditions: string; medical_notes: string;
};
export const patients: PatientProfile[] = [
  { id: "1", hn: "DEMO-001", full_name: "นายสมชาย ใจดี", date_of_birth: "1964-03-15", sex: "male", phone: "", primary_doctor_name: "แพทย์ประจำตัว", stroke_type: "ischemic", stroke_diagnosed_on: "2026-06-15", other_conditions: "ความดันโลหิตสูง", medical_notes: "" },
  { id: "2", hn: "DEMO-002", full_name: "นางสมหญิง ใจบุญ", date_of_birth: "1972-07-04", sex: "female", phone: "", primary_doctor_name: "แพทย์ประจำตัว", stroke_type: "hemorrhagic", stroke_diagnosed_on: "2026-05-20", other_conditions: "ไม่มี", medical_notes: "" },
  { id: "3", hn: "DEMO-003", full_name: "นายวิศวะ แสนดี", date_of_birth: "1984-02-10", sex: "male", phone: "", primary_doctor_name: "แพทย์ประจำตัว", stroke_type: "ischemic", stroke_diagnosed_on: "2026-08-02", other_conditions: "ไม่มี", medical_notes: "" },
];
export type PlanItem = { exercise_id: ExerciseId; target_sets: number; target_reps_per_set: number; selected_side: string; schedule_type: "daily" | "weekly"; weekdays: number[] };
export const initialPlan: PlanItem[] = exercises.slice(0, 2).map(e => ({ exercise_id: e.id, target_sets: 3, target_reps_per_set: 10, selected_side: e.side ? "left" : "none", schedule_type: "daily", weekdays: [] }));
export type TemplatePlan = { id: string; name: string; items: PlanItem[] };
export const initialTemplates: TemplatePlan[] = [
  { id: "DEMO-T01", name: "ฝึกลำตัวและข้อเท้า", items: initialPlan },
  { id: "DEMO-T02", name: "ฝึกลำตัวและขา", items: exercises.slice(2).map(e => ({ exercise_id: e.id, target_sets: 3, target_reps_per_set: 10, selected_side: e.side ? "left" : "none", schedule_type: "daily", weekdays: [] })) },
];
export type SavedSet = { id: string; patient_id: string; exercise_id: ExerciseId; local_date: string; session_id: string; target_reps: number; reps: number; elapsed_seconds: number };
export const initialSets: SavedSet[] = [
  { id: "fixture-1", patient_id: "1", exercise_id: "seated-trunk", local_date: "2026-10-01", session_id: "fixture-session-1", target_reps: 10, reps: 8, elapsed_seconds: 90 },
  { id: "fixture-2", patient_id: "1", exercise_id: "seated-trunk", local_date: "2026-10-01", session_id: "fixture-session-1", target_reps: 10, reps: 10, elapsed_seconds: 105 },
  { id: "fixture-3", patient_id: "2", exercise_id: "ankle-pump", local_date: "2026-09-30", session_id: "fixture-session-2", target_reps: 10, reps: 6, elapsed_seconds: 80 },
];
export function ageOn(date: string, reference = demoDate) {
  const age = calculateAge(date, reference);
  return age === null ? "ไม่ระบุ" : `${age} ปี`;
}
export function dateLabel(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "ไม่ระบุ";
  const parsed = new Date(`${date}T00:00:00+07:00`);
  return Number.isFinite(parsed.getTime()) ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" }).format(parsed) : "ไม่ระบุ";
}
export const sexLabel: Record<string, string> = { male: "ชาย", female: "หญิง", other: "อื่น ๆ", unspecified: "ไม่ระบุ" };
export const strokeLabel: Record<string, string> = { ischemic: "โรคหลอดเลือดสมองตีบหรืออุดตัน", hemorrhagic: "โรคหลอดเลือดสมองแตก", tia: "ภาวะสมองขาดเลือดชั่วคราว", unspecified: "ไม่ทราบ / ไม่ระบุ" };
