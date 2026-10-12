import "server-only";
import { accountSession } from "./account-session";
import { normalizeBirthDate, dateInThailand } from "./birth-date";
export function testToolsEnabled() {
  return process.env.MORE_PATIENT_TEST_TOOLS === "1" || (process.env.NODE_ENV === "development" && process.env.MORE_PATIENT_TEST_TOOLS !== "0");
}
export function validRoutineDate(date: unknown): date is string {
  return typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= "2000-01-01" && date <= "2100-12-31" && normalizeBirthDate(date) === date;
}
/** Business date only; recording timestamps/durations/security remain real time. */
export async function routineNow(patientId: number, now = new Date()) {
  if (!testToolsEnabled()) return now;
  let date: string | undefined;
  try { const session = await accountSession(); if (session.userId === patientId && session.binding) date = session.routineTestDate; }
  catch { return now; }
  if (!validRoutineDate(date)) return now;
  return new Date(now.getTime() + (new Date(`${date}T00:00:00Z`).getTime() - new Date(`${dateInThailand(now)}T00:00:00Z`).getTime()));
}
