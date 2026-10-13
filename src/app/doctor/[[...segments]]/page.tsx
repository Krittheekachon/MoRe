import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app/shell";
import { DoctorPatientList, DoctorPatientConnected } from "@/components/app/doctor-connected";
import { DoctorTemplateListView } from "@/components/app/doctor-templates-list";
import { DoctorPatientProfileView } from "@/components/app/doctor-patient-profile";
import { DoctorPatientAssessmentHistoryView } from "@/components/app/doctor-patient-assessments";
import { DoctorPatientSessionDetailView } from "@/components/app/doctor-patient-session-detail";
import { staffIdentity, staffPatients, staffPatientData, staffTemplates, staffCatalog } from "@/lib/doctor-service";
import { readResults } from "@/lib/results-service";
import { AccountError } from "@/lib/account-validation";
import { trainingId } from "@/lib/training-api";
import { TrainingFailure } from "@/components/app/training-failure";
import { calculateAge } from "@/lib/birth-date";

export const metadata = { title: "แพทย์และนักกายภาพ | MoRe" };
export default async function DoctorPage({ params }: { params: Promise<{ segments?: string[] }> }) {
  const staff = await staffIdentity().catch(error => {
    if (error instanceof AccountError && (error.status === 401 || error.status === 403)) redirect("/doctor/login");
    notFound();
  });
  const segments = (await params).segments || []; const path = segments.join("/"); let content;
  let patients: Awaited<ReturnType<typeof staffPatients>> = [];
  let templates: Awaited<ReturnType<typeof staffTemplates>> = [];
  let catalog: Awaited<ReturnType<typeof staffCatalog>> = [];
  let data: Awaited<ReturnType<typeof staffPatientData>> | undefined;
  let session: Awaited<ReturnType<typeof readResults>>[number] | undefined;
  let failed = false;
  try {
    if (!path) patients = await staffPatients(staff);
    else if (path === "templates") { templates = await staffTemplates(staff); catalog = await staffCatalog(staff); }
    else if (segments[0] === "patients" && segments.length >= 2) {
      const id = trainingId(segments[1]); data = await staffPatientData(staff, id);
      if (segments.length === 2 || (segments.length === 3 && segments[2] === "plan")) templates = await staffTemplates(staff);
      else if (segments.length === 4 && segments[2] === "sessions") session = (await readResults(id, trainingId(segments[3])))[0];
      else if (!(segments.length === 3 && segments[2] === "assessments")) notFound();
    } else notFound();
  } catch (error) {
    if (error instanceof AccountError && [400, 404].includes(error.status)) notFound();
    if (error instanceof Error && "digest" in error) throw error;
    failed = true;
  }
  if (failed) content = <TrainingFailure message="โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่" title="ข้อมูลบุคลากร" back="/doctor" />;
  else if (!path) {
    const mappedPatients = patients.map(profile => {
      const totalSessions = profile.days.reduce(
        (acc, day) => acc + day.dailyExercises.reduce((sum, de) => sum + de.sessions.length, 0),
        0
      );
      let latestDate: Date | null = null;
      for (const day of profile.days) {
        if (day.last_activity_at && (!latestDate || day.last_activity_at > latestDate)) {
          latestDate = day.last_activity_at;
        }
        for (const de of day.dailyExercises) {
          for (const s of de.sessions) {
            if (!latestDate || s.started_at > latestDate) {
              latestDate = s.started_at;
            }
          }
        }
      }
      latestDate ??= profile.updated_at;

      const birthDateStr = profile.date_of_birth?.toISOString().slice(0, 10) ?? null;
      const age = birthDateStr ? calculateAge(birthDateStr) : null;

      return {
        patient_id: profile.patient_id,
        hn: profile.hn,
        full_name: profile.full_name,
        sex: profile.sex,
        birthDate: birthDateStr,
        age,
        phone: profile.phone,
        sessionCount: totalSessions,
        lastUpdated: latestDate ? latestDate.toISOString() : null,
      };
    });
    content = <DoctorPatientList patients={mappedPatients} />;
  }
  else if (path === "templates") content = <DoctorTemplateListView templates={templates} catalog={catalog} />;
  else if (data && session) content = <DoctorPatientSessionDetailView data={data} sessionId={trainingId(segments[3])} />;
  else if (data && segments[2] === "assessments") content = <DoctorPatientAssessmentHistoryView data={data} />;
  else if (data && segments.length === 2) content = <DoctorPatientProfileView data={data} />;
  else if (data) content = <DoctorPatientConnected key={`${data.profile.patient_id}:${segments[2] || "profile"}`} data={data} templates={templates} planOnly={segments[2] === "plan"} />;
  return <AppShell doctor demo={staff.demo}>{staff.demo && <p className="notice">DEMO สังเคราะห์ · แสดงเฉพาะบัญชีและแผนทดลอง ไม่ใช่ข้อมูลคนไข้จริง</p>}{content}</AppShell>;
}
