import { trainingId, trainingPatientId } from "@/lib/training-api";
import { mutation } from "@/lib/account-http";
import { recordingService } from "@/lib/recording-service";
import { revalidatePath } from "next/cache";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return mutation(request, async input => {
    const result = await recordingService.save(await trainingPatientId(), trainingId((await context.params).id), input);
    revalidatePath("/patient/[[...segments]]", "page");
    return result;
  });
}
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return mutation(request, async input => recordingService.state(await trainingPatientId(), trainingId((await context.params).id), input));
}
