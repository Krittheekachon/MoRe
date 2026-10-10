import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "./prisma";
import type { PoseCriteria, Side } from "./pose/types";
import { cameraTestCriteria } from "./pose/camera-test-adapter";
import { cameraKneeExtension } from "./pose/exercises/camera-knee-extension";

export const demoExerciseCode = "demo-knee-extension";
export const demoDoctorLoginName = "doctor";
type Manifest = { doctorId: number; patients: { id: number; hn: string; lookup: string }[]; exerciseId: number };
export async function demoManifest(): Promise<Manifest | null> {
  try {
    return JSON.parse(await readFile(join(process.cwd(), ".demo", "manifest.json"), "utf8"));
  } catch { return null; }
}
export async function isDemoPatient(id: number) {
  const manifest = await demoManifest();
  const expected = manifest?.patients.find(patient => patient.id === id);
  if (!expected) return false;
  return !!await prisma.patientProfile.findFirst({ where: { patient_id: id, hn: expected.hn, national_id_lookup: expected.lookup, user: { role: "patient" } }, select: { patient_id: true } });
}
export async function isDemoStaff(id: number) {
  const manifest = await demoManifest();
  return manifest?.doctorId === id && !!await prisma.user.findFirst({ where: { id, login_name: demoDoctorLoginName, role: "doctor", is_active: true }, select: { id: true } });
}
// Shared engineering template is available in development; production requires opt-in.
export function cameraTestEnabled() { return process.env.MORE_CAMERA_TEST_MODE === "1" || (process.env.NODE_ENV === "development" && process.env.MORE_CAMERA_TEST_MODE !== "0"); }
export function demoEnabled() { return process.env.MORE_DEMO_MODE === "1"; }
export async function demoCriteria(patientId: number, exerciseId: number, side: Side): Promise<PoseCriteria | undefined> {
  if (cameraTestEnabled()) {
    const published = await prisma.rehabilitationTemplate.findFirst({ where: { template_code: "DEMO-MOCK-KNEE", is_active: true, exercises: { some: { exercise_id: exerciseId, exercise: { code: demoExerciseCode, is_active: true } } } }, select: { id: true } });
    if (!published) return;
  } else {
    if (!demoEnabled() || !await isDemoPatient(patientId)) return;
    const manifest = await demoManifest();
    if (manifest?.exerciseId !== exerciseId) return;
  }
  const version = cameraTestEnabled() ? cameraKneeExtension.criteriaVersion : 1;
  const metric = await prisma.exerciseAngleMetric.findFirst({ where: { exercise_id: exerciseId, metric_code: `demo-${side}`, definition_version: 1 }, include: { checkpoints: { where: { criteria_version: version } } } });
  if (!metric) return;
  const start = metric.checkpoints.find(item => item.phase === "start");
  const peak = metric.checkpoints.find(item => item.phase === "peak");
  const returned = metric.checkpoints.find(item => item.phase === "return");
  if (!start || !peak || !returned) return;
  // Engineering fixture only: these are NOT clinician-approved thresholds.
  return cameraTestCriteria(demoExerciseCode, side, metric.id, { start: start.id, peak: peak.id, returned: returned.id }, version);
}
