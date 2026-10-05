import { prisma } from "@/lib/prisma";
import { mutation } from "@/lib/account-http";
import { establishSession } from "@/lib/account-session";
import { nationalIdLookup, verifyPassword } from "@/lib/account-security";
import { AccountError, nationalId, onlyFields, password } from "@/lib/account-validation";
import { limitAttempts } from "@/lib/account-rate-limit";

export async function POST(request: Request) {
  return mutation(request, async data => {
    onlyFields(data, ["nationalId", "password"]);
    const lookup = nationalIdLookup(nationalId(data));
    const supplied = password(data, "password", 1);
    limitAttempts("login-global", 150);
    limitAttempts(`login:${lookup}`, 10);
    const profile = await prisma.patientProfile.findUnique({ where: { national_id_lookup: lookup }, select: { user: { select: { id: true, role: true, is_active: true, password_hash: true, password_change_required: true } } } });
    const user = profile?.user;
    const matches = await verifyPassword(supplied, user?.password_hash);
    if (!matches || !user?.is_active || user.role !== "patient") throw new AccountError("เลขบัตรประชาชนหรือรหัสผ่านไม่ถูกต้อง", 401);
    await establishSession(user.id, user.password_hash);
    return { ok: true, destination: user.password_change_required ? "/patient/change-password" : "/patient" };
  });
}
