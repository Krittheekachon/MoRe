import { prisma } from "@/lib/prisma";
import { mutation } from "@/lib/account-http";
import { currentAccount, establishSession } from "@/lib/account-session";
import { hashPassword, verifyPassword } from "@/lib/account-security";
import { AccountError, onlyFields, password } from "@/lib/account-validation";
import { limitAttempts } from "@/lib/account-rate-limit";

export async function POST(request: Request) {
  return mutation(request, async data => {
    const user = await currentAccount();
    if (!user) throw new AccountError("กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "patient") throw new AccountError("ไม่อนุญาตคำขอนี้", 403);
    onlyFields(data, ["current", "new", "confirm"]);
    limitAttempts(`password:${user.id}`, 10);
    const current = password(data, "current", 1);
    const next = password(data, "new");
    if (next !== password(data, "confirm") || next === current) throw new AccountError("กรุณายืนยันรหัสผ่านใหม่ให้ตรงกันและแตกต่างจากรหัสเดิม");
    if (!await verifyPassword(current, user.password_hash)) throw new AccountError("รหัสผ่านไม่ถูกต้อง", 401);
    const hash = await hashPassword(next);
    const result = await prisma.user.updateMany({ where: { id: user.id, is_active: true, role: "patient", password_hash: user.password_hash }, data: { password_hash: hash, password_change_required: false, updated_at: new Date() } });
    if (result.count !== 1) throw new AccountError("กรุณาเข้าสู่ระบบใหม่", 401);
    await establishSession(user.id, hash);
    return { ok: true };
  });
}
