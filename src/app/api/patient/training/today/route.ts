import { trainingGet } from "@/lib/training-api";
import { readDailyTraining } from "@/lib/training-service";
export async function GET(request: Request) {
  return trainingGet(request, id => readDailyTraining(id));
}
