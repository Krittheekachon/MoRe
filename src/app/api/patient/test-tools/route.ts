import { mutation } from "@/lib/account-http";
import { accountSession, readOwnProfile } from "@/lib/account-session";
import { onlyFields, AccountError } from "@/lib/account-validation";
import { trainingGet, trainingPatientId } from "@/lib/training-api";
import { routineNow, testToolsEnabled, validRoutineDate } from "@/lib/routine-clock";
import { dateInThailand } from "@/lib/birth-date";
import { clearTrainingResults } from "@/lib/patient-test-tools";
function allowed() { if (!testToolsEnabled()) throw new AccountError("เครื่องมือทดสอบถูกปิด", 403); }
export async function GET(request: Request) {
  return trainingGet(request, async id => {
    allowed(); const profile = await readOwnProfile(id); const session = await accountSession();
    return { patientName: profile?.full_name ?? "ผู้ป่วย", hn: profile?.hn ?? "", date: dateInThailand(await routineNow(id)), simulated: validRoutineDate(session.routineTestDate) };
  });
}
export async function POST(request: Request) {
  return mutation(request, async input => {
    allowed(); const id = await trainingPatientId(); onlyFields(input, ["action", "date", "scope", "confirmation"]);
    const session = await accountSession();
    if (input.action === "date") {
      if (!validRoutineDate(input.date)) throw new AccountError("วันที่ไม่ถูกต้อง");
      session.routineTestDate = input.date; await session.save(); return { date: input.date, simulated: true };
    }
    if (input.action === "real") { delete session.routineTestDate; await session.save(); return { date: dateInThailand(new Date()), simulated: false }; }
    if (input.action !== "clear" || !["day", "all"].includes(String(input.scope)) || input.confirmation !== "CLEAR_MY_TRAINING") throw new AccountError("กรุณายืนยันขอบเขตการลบ");
    const date = dateInThailand(await routineNow(id));
    if (input.date !== date) throw new AccountError("วันที่ทดสอบเปลี่ยนแล้ว กรุณาตรวจสอบอีกครั้ง", 409);
    return { ...await clearTrainingResults(id, date, input.scope === "all"), date };
  });
}
