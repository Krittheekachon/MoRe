import { mutation } from "@/lib/account-http";
import { registrationSession } from "@/lib/account-session";
import { encryptNationalId, hashPassword, nationalIdLookup } from "@/lib/account-security";
import { AccountError, nationalId, onlyFields, password } from "@/lib/account-validation";
import { limitAttempts } from "@/lib/account-rate-limit";

export async function POST(request: Request) {
  return mutation(request, async data => {
    onlyFields(data, ["nationalId", "password", "useInitial"]);
    if (data.useInitial !== undefined && typeof data.useInitial !== "boolean") throw new AccountError("ข้อมูลไม่ถูกต้อง");
    const id = nationalId(data);
    const lookup = nationalIdLookup(id);
    limitAttempts("registration-global", 100);
    limitAttempts(`registration:${lookup}`, 10);
    // Four-digit registration remains blocked pending approval of its real-account policy.
    if (data.useInitial) throw new AccountError("สำหรับบัญชีจริง กรุณาตั้งรหัสผ่านใหม่อย่างน้อย 8 ตัวอักษรก่อนดำเนินการ");
    const hash = await hashPassword(password(data, "password"));
    const session = await registrationSession();
    session.lookup = lookup;
    session.encryptedId = encryptNationalId(id);
    session.hash = hash;
    session.changeRequired = false;
    session.completed = false;
    await session.save();
    return { ok: true };
  });
}
