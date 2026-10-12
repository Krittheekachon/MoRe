import { mutation, json } from "@/lib/account-http";
import { AccountError, onlyFields } from "@/lib/account-validation";
import { trainingId } from "@/lib/training-api";
import { staffPatientData, writeMedicalNotes, assignStaffPlan } from "@/lib/doctor-service";
import { integrationDoctor } from "@/lib/patient-doctor-integration";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  try { const doctor = await integrationDoctor(); if (new URL(request.url).search) throw new AccountError("ข้อมูลไม่ถูกต้อง"); return json(await staffPatientData(doctor, trainingId((await context.params).id))); }
  catch (error) { return json({ error: error instanceof AccountError ? error.message : "โหลดข้อมูลไม่ได้" }, error instanceof AccountError ? error.status : 503); }
}
export async function PATCH(request: Request, context: Context) { return mutation(request, async input => writeMedicalNotes(await integrationDoctor(), trainingId((await context.params).id), input)); }
export async function POST(request: Request, context: Context) { return mutation(request, async input => { const doctor = await integrationDoctor(); onlyFields(input, ["templateId"]); return assignStaffPlan(doctor, trainingId((await context.params).id), trainingId(input.templateId)); }); }
