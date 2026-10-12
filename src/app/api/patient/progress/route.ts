import { trainingGet } from "@/lib/training-api";
import { readPatientProgress } from "@/lib/patient-progress";
export async function GET(request: Request) { return trainingGet(request, id => readPatientProgress(id)); }
