import { mutation } from "@/lib/account-http";
import { onlyFields } from "@/lib/account-validation";
import { trainingGet, trainingId, trainingPatientId } from "@/lib/training-api";
import { readTrainingPlan, selectTrainingTemplate } from "@/lib/training-service";
export async function GET(request: Request) {
  return trainingGet(request, async id => ({ plan: await readTrainingPlan(id) }));
}
export async function POST(request: Request) {
  return mutation(request, async data => {
    const id = await trainingPatientId();
    onlyFields(data, ["templateId"]);
    return selectTrainingTemplate(id, trainingId(data.templateId));
  });
}
