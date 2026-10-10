import { mutation } from "@/lib/account-http";
import { onlyFields, object } from "@/lib/account-validation";
import { trainingGet, trainingId, trainingPatientId } from "@/lib/training-api";
import { readTrainingPlan, selectTrainingTemplate } from "@/lib/training-service";
export async function GET(request: Request) {
  return trainingGet(request, async id => ({ plan: await readTrainingPlan(id) }));
}
export async function POST(request: Request) {
  return mutation(request, async data => {
    const id = await trainingPatientId();
    onlyFields(data, ["templateId", "cameraTest"]);
    const test = data.cameraTest === undefined ? undefined : object(data.cameraTest);
    if (test) onlyFields(test, ["sets", "reps", "side"]);
    return selectTrainingTemplate(id, trainingId(data.templateId), new Date(), id, test as { sets: number; reps: number; side: "left" | "right" } | undefined);
  });
}
