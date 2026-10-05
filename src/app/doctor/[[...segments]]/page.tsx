import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app/shell";
import { DoctorPatientList, DoctorPatientConnected, DoctorTemplateEditor, ConnectedPatientTabs } from "@/components/app/doctor-connected";
import { ResultsHistory, ResultDetail } from "@/components/app/results-views";
import { staffIdentity, staffPatients, staffPatientData, staffTemplates, staffCatalog } from "@/lib/doctor-service";
import { readResults } from "@/lib/results-service";
import { AccountError } from "@/lib/account-validation";
import { trainingId } from "@/lib/training-api";
import { TrainingFailure } from "@/components/app/training-failure";

export const metadata = { title: "แพทย์และนักกายภาพ | MoRe" };
export default async function DoctorPage({ params }: { params: Promise<{ segments?: string[] }> }) {
  const staff = await staffIdentity().catch(error => { if (error instanceof AccountError && error.status === 401) redirect("/doctor/login"); notFound(); });
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
  else if (!path) content = <DoctorPatientList patients={patients.map(profile => ({ patient_id: profile.patient_id, full_name: profile.full_name, hn: profile.hn, sex: profile.sex, birthDate: profile.date_of_birth?.toISOString().slice(0, 10) ?? null }))} />;
  else if (path === "templates") content = <DoctorTemplateEditor templates={templates} catalog={catalog} />;
  else if (data && session) content = <><ConnectedPatientTabs id={data.profile.patient_id} /><ResultDetail session={session} back={`/doctor/patients/${data.profile.patient_id}/assessments`} /></>;
  else if (data && segments[2] === "assessments") content = <><ConnectedPatientTabs id={data.profile.patient_id} /><ResultsHistory sessions={data.sessions} base={`/doctor/patients/${data.profile.patient_id}`} /></>;
  else if (data) content = <DoctorPatientConnected key={`${data.profile.patient_id}:${segments[2] || "profile"}`} data={data} templates={templates} planOnly={segments[2] === "plan"} />;
  return <AppShell doctor demo={staff.demo}>{staff.demo && <p className="notice">DEMO สังเคราะห์ · แสดงเฉพาะบัญชีและแผนทดลอง ไม่ใช่ข้อมูลคนไข้จริง</p>}{content}</AppShell>;
}
