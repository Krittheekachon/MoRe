import "server-only";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { constantEqual, sessionBinding } from "./account-security";
import type { PatientProfile } from "./demo-data";

type AccountSession = { userId?: number; binding?: string };
type RegistrationSession = { lookup?: string; encryptedId?: string; hash?: string; changeRequired?: boolean; completed?: boolean };

function options(cookieName: string, ttl: number) {
  const password = process.env.AUTH_SESSION_SECRET;
  if (!password || password.length < 32) throw new Error("AUTH_SESSION_SECRET must have at least 32 characters");
  return { cookieName, password, ttl, cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" } };
}

export async function accountSession() {
  return getIronSession<AccountSession>(await cookies(), options("more_account", 7 * 86400));
}

export async function registrationSession() {
  return getIronSession<RegistrationSession>(await cookies(), options("more_registration", 15 * 60));
}

export async function currentAccount() {
  const session = await accountSession();
  if (!Number.isSafeInteger(session.userId) || !session.binding) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, role: true, is_active: true, password_hash: true, password_change_required: true } });
  if (!user?.is_active || !constantEqual(session.binding, sessionBinding(user.id, user.password_hash))) return null;
  return user;
}

export async function establishSession(id: number, hash: string) {
  const session = await accountSession();
  session.userId = id;
  session.binding = sessionBinding(id, hash);
  await session.save();
}

export async function readOwnProfile(id: number): Promise<PatientProfile | null> {
  const p = await prisma.patientProfile.findUnique({ where: { patient_id: id }, select: { patient_id: true, hn: true, full_name: true, date_of_birth: true, sex: true, phone: true, primary_doctor_name: true, stroke_type: true, stroke_diagnosed_on: true, other_conditions: true } });
  if (!p) return null;
  return { id: String(p.patient_id), hn: p.hn || "", full_name: p.full_name, date_of_birth: p.date_of_birth?.toISOString().slice(0, 10) || "", sex: p.sex || "unspecified", phone: p.phone || "", primary_doctor_name: p.primary_doctor_name || "", stroke_type: p.stroke_type || "unspecified", stroke_diagnosed_on: p.stroke_diagnosed_on?.toISOString().slice(0, 10) || "", other_conditions: p.other_conditions || "", medical_notes: "" };
}

export async function requirePatient(allowPasswordChange = false) {
  const user = await currentAccount();
  if (!user) redirect("/");
  if (user.role !== "patient") notFound();
  if (user.password_change_required) {
    if (!allowPasswordChange) redirect("/patient/change-password");
    // Do not serialize patient health/profile fields before the required change.
    return { id: String(user.id), hn: "", full_name: "ผู้ป่วย", date_of_birth: "", sex: "unspecified", phone: "", primary_doctor_name: "", stroke_type: "unspecified", stroke_diagnosed_on: "", other_conditions: "", medical_notes: "" } satisfies PatientProfile;
  }
  const profile = await readOwnProfile(user.id);
  if (!profile) notFound();
  return profile;
}
