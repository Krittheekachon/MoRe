import { trainingId, trainingPatientId } from "@/lib/training-api";
import { mutation } from "@/lib/account-http";
import { recordingService } from "@/lib/recording-service";

// pagehide/sendBeacon cannot issue PATCH; this route has the same CSRF/owner guard.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return mutation(request, async input => recordingService.state(await trainingPatientId(), trainingId((await context.params).id), input));
}
