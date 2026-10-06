import { prisma } from "@/lib/prisma";
import { mutation } from "@/lib/account-http";
import { registrationSession } from "@/lib/account-session";
import { AccountError, choice, date, onlyFields, personalFields } from "@/lib/account-validation";
import { limitAttempts } from "@/lib/account-rate-limit";

export async function POST(request: Request) {
  return mutation(request, async data => {
    onlyFields(data, ["full_name", "date_of_birth", "sex", "stroke_type", "stroke_diagnosed_on", "other_conditions"]);
    const session = await registrationSession();
    if (!session.lookup || !session.encryptedId || !session.hash) throw new AccountError("ข้อมูลบัญชีหมดอายุ กรุณาเริ่มสมัครใหม่", 401);
    limitAttempts(`registration-complete:${session.lookup}`, 10);
    const personal = personalFields(data);
    const diagnosed = date(data, "stroke_diagnosed_on");
    if (diagnosed! < personal.date_of_birth!) throw new AccountError("วันที่วินิจฉัยต้องไม่ก่อนวันเกิด");
    const stroke = choice(data, "stroke_type", [
      "ischemic", "hemorrhagic",
      // "tia", // Temporarily disabled; restore together with the registration option.
      "unspecified",
    ]);
    const now = new Date();
    try {
      await prisma.$transaction(async tx => {
        await tx.user.create({ data: {
          role: "patient", login_name: null, password_hash: session.hash!, password_change_required: !!session.changeRequired,
          display_name: Array.from(personal.full_name).slice(0, 100).join(""), created_at: now, updated_at: now,
          patientProfile: { create: { ...personal, stroke_type: stroke, stroke_diagnosed_on: diagnosed,
            national_id_lookup: session.lookup!, national_id_encrypted: session.encryptedId!, updated_at: now } },
        } });
      });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") throw new AccountError("ไม่สามารถสมัครด้วยข้อมูลนี้ได้ กรุณาตรวจสอบข้อมูลหรือติดต่อสถานพยาบาล", 409);
      throw error;
    }
    delete session.hash;
    delete session.lookup;
    delete session.encryptedId;
    delete session.changeRequired;
    session.completed = true;
    await session.save();
    return { ok: true };
  });
}
