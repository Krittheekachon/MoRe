import { trainingGet, trainingId } from "@/lib/training-api";
import { readCameraAssignment } from "@/lib/training-service";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return trainingGet(request, async patientId => ({ assignment: await readCameraAssignment(patientId, trainingId((await context.params).id)) }));
}
