import { trainingGet } from "@/lib/training-api";
import { readResults } from "@/lib/results-service";
export async function GET(request: Request) { return trainingGet(request, async id => ({ sessions: await readResults(id) })); }
