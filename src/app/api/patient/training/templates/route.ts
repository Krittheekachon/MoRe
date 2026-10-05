import { trainingGet } from "@/lib/training-api";
import { listTrainingTemplates } from "@/lib/training-service";
export async function GET(request: Request) {
  return trainingGet(request, async patientId => ({ templates: await listTrainingTemplates(patientId) }));
}
