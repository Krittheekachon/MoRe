import "server-only";
import { prisma } from "./prisma";
import { AccountError } from "./account-validation";
import { testToolsEnabled, validRoutineDate } from "./routine-clock";
export async function clearTrainingResults(patientId: number, date: string, all: boolean) {
  if (!testToolsEnabled()) throw new AccountError("เครื่องมือทดสอบถูกปิด", 403);
  if (!Number.isSafeInteger(patientId) || patientId < 1 || !validRoutineDate(date)) throw new AccountError("ข้อมูลไม่ถูกต้อง");
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT patient_id FROM patient_profiles WHERE patient_id = ${patientId} FOR UPDATE`;
    await tx.$queryRaw`SELECT de.id FROM daily_exercises de JOIN rehabilitation_days d ON d.id = de.rehabilitation_day_id WHERE d.patient_id = ${patientId} AND (${all} OR d.local_date = ${new Date(`${date}T00:00:00Z`)}) ORDER BY de.id FOR UPDATE OF de`;
    const day = { patient_id: patientId, ...(all ? {} : { local_date: new Date(`${date}T00:00:00Z`) }) };
    const daily = { day }; const session = { dailyExercise: daily }; const repetition = { set: { session } };
    await tx.repetitionCheckpointResult.deleteMany({ where: { repetition } });
    await tx.repetitionMetric.deleteMany({ where: { repetition } });
    const rounds = await tx.repetition.deleteMany({ where: repetition });
    await tx.cameraCheck.deleteMany({ where: { session } });
    const sets = await tx.exerciseSet.deleteMany({ where: { session } });
    await tx.exerciseSession.deleteMany({ where: session });
    await tx.dailyExercise.updateMany({ where: daily, data: { status: "not_started", started_at: null, completed_at: null } });
    await tx.rehabilitationDay.updateMany({ where: day, data: { started_at: null, last_activity_at: null, is_closed: false } });
    return { clearedRounds: rounds.count, clearedSets: sets.count };
  });
}
