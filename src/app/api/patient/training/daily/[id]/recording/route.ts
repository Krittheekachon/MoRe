import { trainingId, trainingPatientId } from "@/lib/training-api";
import { json, mutation } from "@/lib/account-http";
import { AccountError } from "@/lib/account-validation";
import { recordingService } from "@/lib/recording-service";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const patientId = await trainingPatientId();
    const id = trainingId((await context.params).id);
    const query = new URL(request.url).searchParams;
    const side = query.get("side");
    if (Array.from(query.keys()).some(key => key !== "side") || query.getAll("side").length !== 1 || (side !== "left" && side !== "right")) throw new AccountError("กรุณาเลือกข้างที่ฝึก");
    return json({ criteria: await recordingService.configuration(patientId, id, side) });
  } catch (error) {
    return json({ error: error instanceof AccountError ? error.message : "ระบบไม่พร้อมใช้งาน กรุณาลองใหม่" }, error instanceof AccountError ? error.status : 503);
  }
}
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return mutation(request, async input => recordingService.start(await trainingPatientId(), trainingId((await context.params).id), input));
}
