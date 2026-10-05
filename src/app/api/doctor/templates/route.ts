import { mutation } from "@/lib/account-http";
import { staffIdentity, writeTemplate } from "@/lib/doctor-service";
export async function POST(request: Request) { return mutation(request, async input => writeTemplate(await staffIdentity(), input)); }
