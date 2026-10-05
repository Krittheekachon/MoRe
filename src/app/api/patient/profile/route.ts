import { prisma } from "@/lib/prisma";
import { json, mutation } from "@/lib/account-http";
import { currentAccount, readOwnProfile } from "@/lib/account-session";
import { AccountError, onlyFields, personalFields, text } from "@/lib/account-validation";

async function patient() {
  const user = await currentAccount();
  if (!user) throw new AccountError("กรุณาเข้าสู่ระบบ", 401);
  if (user.role !== "patient" || user.password_change_required) throw new AccountError("ไม่อนุญาตให้เข้าถึงข้อมูลนี้", 403);
  return user;
}

export async function GET(request: Request) {
  try {
    if (new URL(request.url).search) throw new AccountError("ข้อมูลไม่ถูกต้อง");
    const user = await patient();
    const profile = await readOwnProfile(user.id);
    if (!profile) throw new AccountError("ไม่พบข้อมูล", 404);
    return json({ profile });
  } catch (error) {
    return json({ error: error instanceof AccountError ? error.message : "ระบบไม่พร้อมใช้งาน" }, error instanceof AccountError ? error.status : 503);
  }
}

export async function PATCH(request: Request) {
  return mutation(request, async data => {
    const user = await patient();
    onlyFields(data, ["full_name", "date_of_birth", "sex", "phone", "primary_doctor_name", "other_conditions"]);
    const personal = personalFields(data);
    const now = new Date();
    await prisma.$transaction(async tx => {
      const existing = await tx.patientProfile.findUnique({ where: { patient_id: user.id }, select: { stroke_diagnosed_on: true } });
      if (existing?.stroke_diagnosed_on && personal.date_of_birth! > existing.stroke_diagnosed_on) throw new AccountError("วันเกิดต้องไม่หลังวันที่วินิจฉัย");
      await tx.patientProfile.update({ where: { patient_id: user.id }, data: { ...personal,
        phone: text(data, "phone", 20) || null, primary_doctor_name: text(data, "primary_doctor_name", 150) || null, updated_at: now } });
      await tx.user.update({ where: { id: user.id }, data: { display_name: Array.from(personal.full_name).slice(0, 100).join(""), updated_at: now } });
    });
    return { ok: true, profile: await readOwnProfile(user.id) };
  });
}
