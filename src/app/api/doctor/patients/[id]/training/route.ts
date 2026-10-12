import { json } from "@/lib/account-http";
import { AccountError } from "@/lib/account-validation";
import { trainingId } from "@/lib/training-api";
import { integrationDoctor, readIntegrationTraining } from "@/lib/patient-doctor-integration";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const doctor = await integrationDoctor();
    if (new URL(request.url).search) throw new AccountError("ข้อมูลไม่ถูกต้อง");
    return json(await readIntegrationTraining(doctor, trainingId((await context.params).id)));
  } catch (error) {
    return json({ error: error instanceof AccountError ? error.message : "โหลดผลฝึกไม่ได้" }, error instanceof AccountError ? error.status : 503);
  }
}
