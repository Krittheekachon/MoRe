import { json } from "@/lib/account-http";
import { AccountError } from "@/lib/account-validation";
import { integrationDoctor, listIntegrationPatients, patientListQuery } from "@/lib/patient-doctor-integration";

export async function GET(request: Request) {
  try {
    const doctor = await integrationDoctor();
    return json(await listIntegrationPatients(doctor, patientListQuery(new URL(request.url).searchParams)));
  } catch (error) {
    return json({ error: error instanceof AccountError ? error.message : "โหลดรายชื่อไม่ได้" }, error instanceof AccountError ? error.status : 503);
  }
}
