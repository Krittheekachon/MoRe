import { trainingGet, trainingId } from "@/lib/training-api";
import { readPatientProgress } from "@/lib/patient-progress";
export async function GET(request: Request, context: {params:Promise<{id:string}>}) { return trainingGet(request, async patientId => readPatientProgress(patientId, trainingId((await context.params).id))); }
