import { prisma } from "@/lib/prisma";
import { mutation } from "@/lib/account-http";
import { establishSession } from "@/lib/account-session";
import { verifyPassword } from "@/lib/account-security";
import { AccountError, onlyFields, password } from "@/lib/account-validation";
import { limitAttempts } from "@/lib/account-rate-limit";
import { demoDoctorLoginName, demoEnabled } from "@/lib/demo-policy";
import { createHash } from "node:crypto";

export async function POST(request: Request) {
  return mutation(request, async data => {
    onlyFields(data, ["loginName", "password"]);
    if (typeof data.loginName !== "string" || !data.loginName.trim() || data.loginName.length > 30) throw new AccountError("กรุณากรอกชื่อเข้าสู่ระบบ");
    const login = data.loginName.trim();
    limitAttempts("staff-global", 150);
    limitAttempts(`staff:${createHash("sha256").update(login).digest("hex")}`, 10);
    const user = await prisma.user.findUnique({ where: { login_name: login } });
    const valid = await verifyPassword(password(data, "password", 1), user?.password_hash);
    if (!valid || !user?.is_active || !["admin", "doctor", "therapist"].includes(user.role) || (login === demoDoctorLoginName && !demoEnabled())) throw new AccountError("ชื่อเข้าสู่ระบบหรือรหัสผ่านไม่ถูกต้อง", 401);
    if (user.password_change_required) throw new AccountError("กรุณาติดต่อผู้ดูแลเพื่อเปลี่ยนรหัสผ่านบัญชีบุคลากร", 403);
    await establishSession(user.id, user.password_hash);
    return { ok: true, destination: "/doctor" };
  });
}
