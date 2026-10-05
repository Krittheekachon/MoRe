import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { prisma } from "./prisma";
import { encryptNationalId, hashPassword, nationalIdLookup } from "./account-security";
import { demoExerciseCode } from "./demo-policy";

type Credentials = { doctor: { loginName: string; password: string }; patients: { nationalId: string; password: string; hn: string; name: string }[] };
export async function seedDemo() {
  let stage = "credentials";
  const directory = join(process.cwd(), ".demo"); await mkdir(directory, { recursive: true });
  const file = join(directory, "accounts.json"); let accounts: Credentials;
  try { accounts = JSON.parse(await readFile(file, "utf8")); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    accounts = { doctor: { loginName: "more-demo-doctor", password: randomBytes(18).toString("base64url") }, patients: [1, 2].map(index => ({
      nationalId: `000000000000${index}`, password: randomBytes(18).toString("base64url"), hn: `MORE-DEMO-0${index}`, name: `DEMO ผู้ป่วยสังเคราะห์ ${index}`,
    })) };
    await writeFile(file, JSON.stringify(accounts, null, 2), { flag: "wx", mode: 0o600 });
  }
  if (accounts.doctor.loginName !== "more-demo-doctor" || accounts.patients.length !== 2) throw new Error("Invalid Demo credentials file");
  stage = "password hashing";
  const hashes: string[] = [];
  for (const password of [accounts.doctor.password, ...accounts.patients.map(item => item.password)]) hashes.push(await hashPassword(password));
  let previous: { doctorId: number; patients: { id: number }[]; exerciseId: number } | undefined;
  try { previous = JSON.parse(await readFile(join(directory, "manifest.json"), "utf8")); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  try {
    const manifest = await prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(60703051)`;
      const now = new Date();
      stage = "doctor";
      let doctor = await tx.user.findUnique({ where: { login_name: accounts.doctor.loginName } });
      if (doctor && (previous?.doctorId !== doctor.id || doctor.role !== "doctor")) throw new Error("Reserved Demo doctor conflict");
      doctor ??= await tx.user.create({ data: { role: "doctor", login_name: accounts.doctor.loginName, display_name: "DEMO บุคลากรสังเคราะห์", password_hash: hashes[0], created_at: now, updated_at: now } });
      const patients = [];
      stage = "patients";
      for (const [index, account] of accounts.patients.entries()) {
        const lookup = nationalIdLookup(account.nationalId);
        let patient = await tx.patientProfile.findUnique({ where: { national_id_lookup: lookup } });
        if (patient && (previous?.patients[index]?.id !== patient.patient_id || patient.hn !== account.hn)) throw new Error("Reserved Demo patient conflict");
        if (!patient) {
          const user = await tx.user.create({ data: { role: "patient", display_name: account.name, password_hash: hashes[index + 1], created_at: now, updated_at: now,
            patientProfile: { create: { hn: account.hn, full_name: account.name, date_of_birth: new Date("1960-01-01"), sex: index ? "female" : "male", national_id_lookup: lookup, national_id_encrypted: encryptNationalId(account.nationalId), updated_at: now } } }, include: { patientProfile: true } });
          patient = user.patientProfile!;
        }
        patients.push({ id: patient.patient_id, hn: account.hn, lookup });
      }
      stage = "exercise";
      const exerciseModule = await tx.exerciseModule.findUniqueOrThrow({ where: { module_number: 2 } });
      let exercise = await tx.exercise.findUnique({ where: { code: demoExerciseCode } });
      if (exercise && previous?.exerciseId !== exercise.id) throw new Error("Reserved Demo exercise conflict");
      exercise ??= await tx.exercise.create({ data: { module_id: exerciseModule.id, code: demoExerciseCode, name_th: "DEMO นั่งเหยียดขา (ไม่ใช่แผนรักษา)", name_en: "DEMO seated knee extension", description: "ข้อมูลสังเคราะห์สำหรับทดลองระบบเท่านั้น ไม่ใช่เกณฑ์ทางคลินิก", tutorial_steps: "DEMO เท่านั้น: นั่งบนเก้าอี้มั่นคง จัดกล้องด้านข้างให้เห็นสะโพก เข่า และข้อเท้า ไม่ใช้เพื่อประเมินสุขภาพจริง หยุดทันทีหากไม่สบาย", camera_view: "side", supports_side_selection: true, default_sets: 2, default_reps_per_set: 3, sort_order: 99 } });
      for (const side of ["left", "right"]) {
        stage = "metrics";
        const metric = await tx.exerciseAngleMetric.upsert({ where: { exercise_id_metric_code_definition_version: { exercise_id: exercise.id, metric_code: `demo-${side}`, definition_version: 1 } }, update: {}, create: { exercise_id: exercise.id, metric_code: `demo-${side}`, label_th: `DEMO ${side} knee`, landmark_a: `${side.toUpperCase()}_HIP`, landmark_b: `${side.toUpperCase()}_KNEE`, landmark_c: `${side.toUpperCase()}_ANKLE`, is_primary: true } });
        for (const phase of ["start", "peak", "return"]) await tx.exerciseCheckpoint.upsert({ where: { exercise_id_code_criteria_version: { exercise_id: exercise.id, code: `demo-${side}-${phase}`, criteria_version: 1 } }, update: {}, create: { exercise_id: exercise.id, metric_id: metric.id, code: `demo-${side}-${phase}`, phase, min_value: phase === "peak" ? 140 : 75, max_value: phase === "peak" ? 180 : 105, feedback_code: "demo_only", instruction_th: "DEMO engineering fixture; not clinical" } });
      }
      for (const [index, side] of ["left", "right"].entries()) {
        stage = "templates";
        const code = `DEMO-KNEE-${index + 1}`;
        const existing = await tx.rehabilitationTemplate.findUnique({ where: { template_code: code } });
        if (existing && existing.created_by !== doctor.id) throw new Error("Demo template conflict");
        if (!existing) await tx.rehabilitationTemplate.create({ data: { template_code: code, name_th: `DEMO ทดลองระบบ ขา${index ? "ขวา" : "ซ้าย"}`, description: "สังเคราะห์ 2 เซต × 3 ครั้ง ใช้ทดสอบซอฟต์แวร์ ไม่ใช่แผนที่แพทย์ยืนยัน", created_by: doctor.id, created_at: now, updated_at: now,
          exercises: { create: { exercise_id: exercise.id, selected_side: side, target_sets: 2, target_reps_per_set: 3, sort_order: 1, instructions: "DEMO เท่านั้น ไม่มีการรับรองเกณฑ์ทางการแพทย์" } } } });
      }
      stage = "synthetic history";
      for (const [index, patient] of patients.entries()) {
        const code = `DEMO-HISTORY-${index + 1}`;
        if (await tx.rehabilitationPlan.findUnique({ where: { plan_code: code } })) continue;
        const local = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
        const date = new Date(`${local}T00:00:00Z`); date.setUTCDate(date.getUTCDate() - 1);
        const started = new Date(`${date.toISOString().slice(0, 10)}T10:00:00+07:00`);
        const ended = new Date(started.getTime() + 5000);
        const plan = await tx.rehabilitationPlan.create({ data: { plan_code: code, patient_id: patient.id, created_by: doctor.id, status: "ended", created_at: started, updated_at: ended,
          exercises: { create: { exercise_id: exercise.id, selected_side: "left", target_sets: 2, target_reps_per_set: 3, effective_from: started, effective_to: ended, configured_by: doctor.id, version_number: 1, instruction_override: "DEMO ประวัติสังเคราะห์จาก seed ไม่ใช่กล้องหรือผลคนไข้จริง" } } }, include: { exercises: true } });
        const day = await tx.rehabilitationDay.upsert({ where: { patient_id_local_date: { patient_id: patient.id, local_date: date } }, update: {}, create: { patient_id: patient.id, local_date: date, is_closed: true, started_at: started, last_activity_at: ended } });
        const daily = await tx.dailyExercise.create({ data: { rehabilitation_day_id: day.id, plan_exercise_id: plan.exercises[0].id, exercise_id: exercise.id, selected_side: "left", target_sets: 2, target_reps_per_set: 3, status: "in_progress", started_at: started } });
        const metric = await tx.exerciseAngleMetric.findFirstOrThrow({ where: { exercise_id: exercise.id, metric_code: "demo-left" }, include: { checkpoints: true } });
        await tx.exerciseSession.create({ data: { daily_exercise_id: daily.id, started_at: started, ended_at: ended, status: "completed", sets: { create: { set_number: 1, target_reps: 3, status: "saved", started_at: started, saved_at: ended, elapsed_seconds: 5,
          repetitions: { create: [145, 155].map((peak, rep) => ({ rep_number: rep + 1, started_at: new Date(started.getTime() + rep * 2000), completed_at: new Date(started.getTime() + rep * 2000 + 1000), selected_side: "left", is_correct: true, feedback_code: "demo_seed", criteria_version: 1, confidence: 1,
            metrics: { create: { metric_id: metric.id, start_angle_deg: 90, peak_angle_deg: peak, end_angle_deg: 90, duration_ms: 1000, selected_side: "left" } },
            checkpointResults: { create: metric.checkpoints.map(check => ({ checkpoint_id: check.id, passed: true, observed_value: check.phase === "peak" ? peak : 90, feedback_code: "demo_seed" })) } })) } } } } });
      }
      return { doctorId: doctor.id, patients, exerciseId: exercise.id };
    }, { timeout: 30000 });
    await writeFile(join(directory, "manifest.json"), JSON.stringify(manifest, null, 2), { mode: 0o600 });
  } catch (error) { if (error instanceof Error) Object.assign(error, { demoStage: stage }); throw error; }
  finally { await prisma.$disconnect(); }
}
