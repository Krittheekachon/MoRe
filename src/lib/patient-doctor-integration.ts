import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";
import { currentAccount } from "./account-session";
import { AccountError } from "./account-validation";
import { staffIdentity, staffPatient, type Staff } from "./doctor-service";
import { demoManifest } from "./demo-policy";
import { readDailyTraining, readRoutineHistory, readTrainingPlan } from "./training-service";
import { readResults } from "./results-service";

/** Existing server session and demo scope, with doctor-only access for new APIs. */
export async function integrationDoctor() {
  const staff = await staffIdentity();
  if ((await currentAccount())?.role !== "doctor") throw new AccountError("เฉพาะบัญชีแพทย์ที่ได้รับสิทธิ์", 403);
  return staff;
}

export function patientListQuery(params: URLSearchParams) {
  for (const key of params.keys()) if (!["q", "page", "pageSize"].includes(key) || params.getAll(key).length !== 1) throw new AccountError("ข้อมูลค้นหาไม่ถูกต้อง");
  const integer = (key: string, fallback: number, max: number) => {
    const value = params.get(key);
    if (value === null) return fallback;
    if (!/^[1-9][0-9]*$/.test(value) || Number(value) > max) throw new AccountError("ข้อมูลแบ่งหน้าไม่ถูกต้อง");
    return Number(value);
  };
  const q = (params.get("q") || "").trim();
  if (Array.from(q).length > 100) throw new AccountError("คำค้นยาวเกินไป");
  return { q, page: integer("page", 1, 10000), pageSize: integer("pageSize", 20, 100) };
}

export async function listIntegrationPatients(staff: Staff, query: ReturnType<typeof patientListQuery>) {
  const identities = (await demoManifest())?.patients ?? [];
  const synthetic = identities.map(row => ({ patient_id: row.id, hn: row.hn, national_id_lookup: row.lookup }));
  const scope: Prisma.PatientProfileWhereInput = staff.demo ? { OR: synthetic.length ? synthetic : [{ patient_id: -1 }] } : { NOT: synthetic };
  const where: Prisma.PatientProfileWhereInput = { AND: [scope, { user: { role: "patient", is_active: true } }, ...(query.q ? [{ OR: [{ full_name: { contains: query.q, mode: "insensitive" as const } }, { hn: { contains: query.q, mode: "insensitive" as const } }] }] : [])] };
  const [total, rows] = await prisma.$transaction([
    prisma.patientProfile.count({ where }),
    prisma.patientProfile.findMany({ where, orderBy: [{ patient_id: "desc" }], skip: (query.page - 1) * query.pageSize, take: query.pageSize,
      select: { patient_id: true, hn: true, full_name: true, date_of_birth: true, sex: true } }),
  ], { isolationLevel: "RepeatableRead" });
  return { items: rows.map(row => ({ patientId: row.patient_id, hn: row.hn, fullName: row.full_name, dateOfBirth: row.date_of_birth?.toISOString().slice(0, 10) ?? null, sex: row.sex })),
    page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) };
}

export async function readIntegrationTraining(staff: Staff, patientId: number) {
  const profile = await staffPatient(staff, patientId); // Ownership/synthetic scope before any related query.
  return { patientId, profile, plan: await readTrainingPlan(patientId), today: await readDailyTraining(patientId),
    routines: await readRoutineHistory(patientId), sessions: await readResults(patientId), timeZone: "Asia/Bangkok" };
}
