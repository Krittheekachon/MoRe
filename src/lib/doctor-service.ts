import "server-only";
import { prisma } from "./prisma";
import { currentAccount } from "./account-session";
import { AccountError, object, onlyFields } from "./account-validation";
import { demoEnabled, demoExerciseCode, demoManifest, isDemoStaff, isDemoPatient } from "./demo-policy";
import { readTrainingPlan, selectTrainingTemplate } from "./training-service";
import { readResults } from "./results-service";

export async function staffIdentity() {
  const account = await currentAccount();
  if (!account) throw new AccountError("กรุณาเข้าสู่ระบบบุคลากร", 401);
  if (!["admin", "doctor", "therapist"].includes(account.role) || account.password_change_required) throw new AccountError("ไม่อนุญาตให้เข้าถึงข้อมูลนี้", 403);
  const demo = await isDemoStaff(account.id);
  if (demo && !demoEnabled()) throw new AccountError("ไม่ได้เปิด Demo mode", 403);
  return { id: account.id, demo };
}
export type Staff = Awaited<ReturnType<typeof staffIdentity>>;
export async function staffPatient(staff: Staff, patientId: number) {
  const synthetic = await isDemoPatient(patientId);
  if (synthetic !== staff.demo) throw new AccountError("ไม่พบผู้ป่วย", 404);
  const profile = await prisma.patientProfile.findUnique({ where: { patient_id: patientId }, select: {
    patient_id: true, hn: true, full_name: true, date_of_birth: true, phone: true, sex: true, primary_doctor_name: true, stroke_type: true, stroke_diagnosed_on: true, other_conditions: true, medical_notes: true,
  } });
  if (!profile) throw new AccountError("ไม่พบผู้ป่วย", 404);
  return { ...profile, date_of_birth: profile.date_of_birth?.toISOString().slice(0, 10) ?? null, stroke_diagnosed_on: profile.stroke_diagnosed_on?.toISOString().slice(0, 10) ?? null };
}
export async function staffPatients(staff: Staff) {
  const ids = (await demoManifest())?.patients.map(patient => patient.id) ?? [];
  return prisma.patientProfile.findMany({ where: { patient_id: staff.demo ? { in: ids } : { notIn: ids }, user: { role: "patient", is_active: true } }, orderBy: { full_name: "asc" }, take: 500,
    select: { patient_id: true, hn: true, full_name: true, sex: true, date_of_birth: true } });
}
export async function staffTemplates(staff: Staff) {
  return prisma.rehabilitationTemplate.findMany({ where: { is_active: true, ...(staff.demo ? { created_by: staff.id, template_code: { startsWith: "DEMO-" } } : { NOT: { template_code: { startsWith: "DEMO-" } }, exercises: { none: { exercise: { code: demoExerciseCode } } } }) }, orderBy: { id: "desc" }, include: { exercises: { include: { weekdays: true, exercise: { select: { name_th: true } } } } } });
}
export async function staffCatalog(staff: Staff) {
  return prisma.exercise.findMany({ where: { is_active: true, module: { is_active: true }, code: staff.demo ? demoExerciseCode : { not: demoExerciseCode } }, orderBy: { sort_order: "asc" }, select: { id: true, name_th: true, supports_side_selection: true } });
}
export async function staffPatientData(staff: Staff, patientId: number) {
  const profile = await staffPatient(staff, patientId);
  return { profile, plan: await readTrainingPlan(patientId), sessions: await readResults(patientId) };
}
function positive(value: unknown, max = 32767) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > max) throw new AccountError("จำนวนเซต ครั้ง และความถี่ต้องเป็นจำนวนเต็มบวก");
  return value;
}
export async function writeTemplate(staff: Staff, input: Record<string, unknown>) {
  onlyFields(input, ["requestId", "name", "description", "baseId", "items"]);
  if (typeof input.requestId !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(input.requestId) || typeof input.name !== "string" || !input.name.trim() || input.name.trim().length > 145 || typeof input.description !== "string" || input.description.length > 5000 || !Array.isArray(input.items) || !input.items.length || input.items.length > 20) throw new AccountError("ข้อมูลแผนไม่ถูกต้อง");
  const catalog = await staffCatalog(staff); const ids = new Set<number>();
  const items = input.items.map((value, index) => {
    const item = object(value); onlyFields(item, ["exerciseId", "side", "sets", "reps", "frequency", "schedule", "weekdays", "instructions"]);
    const exerciseId = positive(item.exerciseId, 2147483647); const exercise = catalog.find(row => row.id === exerciseId);
    if (!exercise || ids.has(exerciseId)) throw new AccountError("รายการท่าไม่ถูกต้อง"); ids.add(exerciseId);
    if (![null, "left", "right", "none", "both"].includes(item.side as string | null) || (!exercise.supports_side_selection && ![null, "none"].includes(item.side as null))) throw new AccountError("ข้างที่ฝึกไม่ถูกต้อง");
    const sets = positive(item.sets); const frequency = positive(item.frequency);
    if (sets * frequency > 32767 || !["daily", "weekly"].includes(String(item.schedule)) || !Array.isArray(item.weekdays) || item.weekdays.some(day => !Number.isInteger(day) || day < 1 || day > 7) || new Set(item.weekdays).size !== item.weekdays.length || (item.schedule === "weekly" && !item.weekdays.length) || typeof item.instructions !== "string" || item.instructions.length > 5000) throw new AccountError("ตารางฝึกไม่ถูกต้อง");
    return { exercise_id: exerciseId, selected_side: item.side as string | null, target_sets: sets, target_reps_per_set: positive(item.reps), sessions_per_day: frequency, schedule_type: item.schedule as string, sort_order: index + 1, instructions: item.instructions, weekdays: { create: (item.schedule === "weekly" ? item.weekdays as number[] : []).map(weekday => ({ weekday })) } };
  });
  const code = `${staff.demo ? "DEMO" : "RT"}-${input.requestId.replaceAll("-", "")}`; // Existing unique code is the retry identity; no new table.
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${staff.id} FOR UPDATE`;
    const retry = await tx.rehabilitationTemplate.findUnique({ where: { template_code: code }, include: { exercises: { orderBy: { sort_order: "asc" }, include: { weekdays: true } } } });
    if (retry) {
      if (retry.created_by !== staff.id) throw new AccountError("ไม่อนุญาต", 403);
      const same = retry.name_th === `${staff.demo ? "DEMO " : ""}${(input.name as string).trim()}` && retry.description === `${staff.demo ? "สังเคราะห์ ไม่ใช่แผนรักษา\n" : ""}${input.description}` && retry.exercises.length === items.length && retry.exercises.every((old, index) => {
        const item = items[index]; return old.exercise_id === item.exercise_id && old.selected_side === item.selected_side && old.target_sets === item.target_sets && old.target_reps_per_set === item.target_reps_per_set && old.sessions_per_day === item.sessions_per_day && old.schedule_type === item.schedule_type && old.instructions === item.instructions && JSON.stringify(old.weekdays.map(day => day.weekday).sort()) === JSON.stringify(item.weekdays.create.map(day => day.weekday).sort());
      });
      if (!same) throw new AccountError("คำขอซ้ำมีข้อมูลต่างจากแผนที่บันทึกแล้ว", 409);
      return { id: retry.id, reused: true };
    }
    let version = 1;
    if (input.baseId !== null) {
      const baseId = positive(input.baseId, 2147483647);
      await tx.$queryRaw`SELECT id FROM rehabilitation_templates WHERE id = ${baseId} FOR UPDATE`;
      const base = await tx.rehabilitationTemplate.findUnique({ where: { id: baseId } });
      if (!base || !base.is_active || base.created_by !== staff.id || base.template_code.startsWith("DEMO-") !== staff.demo) throw new AccountError("แผนนี้แก้ไขไม่ได้หรือมีเวอร์ชันใหม่แล้ว", 409);
      version = base.version_number + 1;
      await tx.rehabilitationTemplate.update({ where: { id: base.id }, data: { is_active: false, updated_at: new Date() } });
    }
    if (version > 32767) throw new AccountError("จำนวนเวอร์ชันเกินขอบเขต", 409);
    const template = await tx.rehabilitationTemplate.create({ data: { template_code: code, name_th: `${staff.demo ? "DEMO " : ""}${(input.name as string).trim()}`, description: `${staff.demo ? "สังเคราะห์ ไม่ใช่แผนรักษา\n" : ""}${input.description}`, created_by: staff.id, created_at: new Date(), updated_at: new Date(), version_number: version, exercises: { create: items } } });
    return { id: template.id, reused: false };
  });
}
export async function assignStaffPlan(staff: Staff, patientId: number, templateId: number) {
  await staffPatient(staff, patientId);
  if (!(await staffTemplates(staff)).some(template => template.id === templateId)) throw new AccountError("ไม่พบแผน", 404);
  return selectTrainingTemplate(patientId, templateId, new Date(), staff.id);
}
export async function writeMedicalNotes(staff: Staff, patientId: number, input: Record<string, unknown>) {
  onlyFields(input, ["medicalNotes"]); await staffPatient(staff, patientId);
  if (typeof input.medicalNotes !== "string" || input.medicalNotes.length > 10000) throw new AccountError("บันทึกไม่ถูกต้อง");
  await prisma.patientProfile.update({ where: { patient_id: patientId }, data: { medical_notes: input.medicalNotes, updated_at: new Date() } });
  return { ok: true };
}
