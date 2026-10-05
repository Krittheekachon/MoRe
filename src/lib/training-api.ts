import "server-only";
import { currentAccount } from "./account-session";
import { AccountError } from "./account-validation";
import { json } from "./account-http";

export async function trainingPatientId() {
  const account = await currentAccount();
  if (!account) throw new AccountError("กรุณาเข้าสู่ระบบ", 401);
  if (account.role !== "patient" || account.password_change_required) throw new AccountError("ไม่อนุญาตให้เข้าถึงข้อมูลนี้", 403);
  return account.id;
}
export function trainingId(value: unknown) {
  const number = typeof value === "string" && /^[1-9][0-9]*$/.test(value) ? Number(value) : value;
  if (typeof number !== "number" || !Number.isSafeInteger(number) || number < 1 || number > 2147483647) throw new AccountError("ข้อมูลไม่ถูกต้อง");
  return number;
}
export async function trainingGet(request: Request, run: (patientId: number) => Promise<unknown>) {
  try {
    const id = await trainingPatientId();
    if (new URL(request.url).search) throw new AccountError("ข้อมูลไม่ถูกต้อง");
    return json(await run(id));
  } catch (error) {
    return json({ error: error instanceof AccountError ? error.message : "ระบบไม่พร้อมใช้งาน กรุณาลองใหม่" }, error instanceof AccountError ? error.status : 503);
  }
}
