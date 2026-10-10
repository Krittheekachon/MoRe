import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/shell";
import { ProfileView, ProfileEdit, PasswordForm } from "@/components/app/patient-views";
import { ResultsHistory, ResultDetail } from "@/components/app/results-views";
import { readResults } from "@/lib/results-service";
import { trainingDay } from "@/lib/training-calendar";
import { cameraTestEnabled, demoEnabled, demoExerciseCode, isDemoPatient } from "@/lib/demo-policy";
import { TrainingHome, TrainingExercises, TrainingGuide, TrainingPlanSelection } from "@/components/app/training-views";
import { CameraView } from "@/components/app/camera-view";
import { PoseCamera } from "@/components/app/pose-camera";
import { approvedPoseCriteria } from "@/lib/pose/approved-criteria";
import { exercises, type ExerciseId } from "@/lib/demo-data";
import { requirePatient } from "@/lib/account-session";
import { listTrainingTemplates, readTrainingPlan, readDailyTraining, readTrainingHistory, readCameraAssignment } from "@/lib/training-service";
import { trainingId } from "@/lib/training-api";
import { AccountError } from "@/lib/account-validation";
import { TrainingFailure } from "@/components/app/training-failure";
import type { DailyTraining, DailyTrainingItem, PatientTrainingPlan, TrainingHistory, TrainingTemplate } from "@/lib/training-types";

export const metadata = { title: "ผู้ป่วย | MoRe" };
export default async function PatientPage({ params, searchParams }: { params: Promise<{ segments?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const segments = (await params).segments || []; const path = segments.join("/"); let content;
  const patient = await requirePatient(path === "change-password");
  const patientId = Number(patient.id);
  const demo = demoEnabled() && await isDemoPatient(patientId);
  const cameraTest = cameraTestEnabled();
  let testContent = false;
  const now = new Date();
  const trainingRoute = !path || path === "exercises" || path === "plan" || (segments[0] === "exercises" && segments.length === 3 && ["guide", "camera", "result"].includes(segments[2]));
  if (trainingRoute) {
    let today: DailyTraining | undefined;
    let history: TrainingHistory | undefined;
    let templates: TrainingTemplate[] = [];
    let activePlan: PatientTrainingPlan | null = null;
    let assignment: DailyTrainingItem | undefined;
    let failure = "";
    try {
      if (!path || path === "exercises") {
        today = await readDailyTraining(patientId, now);
        if (!path) history = await readTrainingHistory(patientId, now);
      } else if (path === "plan") {
        templates = await listTrainingTemplates(patientId); activePlan = await readTrainingPlan(patientId);
      }
      else {
        const query = await searchParams;
        if (Object.keys(query).some(key => key !== "daily")) throw new AccountError("ข้อมูลไม่ถูกต้อง");
        let dailyId;
        if (query.daily === undefined) {
          const today = await readDailyTraining(patientId, now);
          const matches = today.items.filter(item => item.exercise.code === segments[1]);
          if (matches.length !== 1) throw new AccountError("ไม่พบรายการฝึกของคุณ กรุณาเลือกจากแผนวันนี้", 404);
          dailyId = matches[0].id;
        } else dailyId = trainingId(query.daily);
        assignment = await readCameraAssignment(patientId, dailyId, segments[1], segments[2] === "guide", now);
      }
    } catch (error) {
      if (error instanceof AccountError && error.status === 404) notFound();
      failure = error instanceof AccountError ? error.message : "โหลดแผนฝึกไม่สำเร็จ กรุณาลองใหม่";
    }
    if (failure) content = <TrainingFailure message={failure} />;
    else if (!path) content = <TrainingHome patient={patient} today={today!} history={history!} />;
    else if (path === "exercises") content = <TrainingExercises patient={patient} today={today!} />;
    else if (path === "plan") content = <TrainingPlanSelection templates={templates} activePlan={activePlan} demo={demo} />;
    else if (segments[2] === "guide") content = <TrainingGuide item={assignment!} />;
    else if (segments[2] === "camera" && (!!approvedPoseCriteria[assignment!.exercise.code] || ["seated-leg-raise", demoExerciseCode].includes(assignment!.exercise.code))) content = <PoseCamera key={assignment!.id} assignment={assignment!} cameraTest={cameraTest && assignment!.exercise.code === demoExerciseCode} demo={demo && assignment!.exercise.code === demoExerciseCode} approvalAvailable={!!approvedPoseCriteria[assignment!.exercise.code] || ((cameraTest || demo) && assignment!.exercise.code === demoExerciseCode)} />;
    else content = <CameraView key={assignment!.id} id={assignment!.exercise.code} assignment={assignment} resultOnly={segments[2] === "result"} />;
    testContent = segments[2] !== "camera" && (assignment?.exercise.code === demoExerciseCode || !!today?.items.some(item => item.exercise.code === demoExerciseCode));
  }
  else if (path === "progress" || path === "progress/calendar") content = <ResultsHistory sessions={await readResults(patientId)} calendar={path.endsWith("calendar")} initialMonth={trainingDay(now).date.slice(0, 7)} />;
  else if (segments[0] === "sessions" && segments.length === 2) {
    const results = await readResults(patientId, trainingId(segments[1])).catch(error => { if (error instanceof AccountError && error.status === 404) return null; throw error; });
    if (!results) notFound(); content = <ResultDetail session={results[0]} back="/patient/progress" />;
  }
  else if (segments[0] === "progress" && segments[1] === "calendar" && segments.length === 3 && /^\d{4}-\d{2}-\d{2}$/.test(segments[2]) && Number.isFinite(Date.parse(segments[2])) && new Date(segments[2]).toISOString().slice(0, 10) === segments[2]) content = <ResultsHistory sessions={await readResults(patientId)} date={segments[2]} />;
  else if (path === "profile") content = <ProfileView profile={patient} />;
  else if (path === "profile/edit") content = <ProfileEdit initialProfile={patient} />;
  else if (path === "change-password") content = <PasswordForm />;
  else if (exercises.some(e => e.id === segments[1])) {
    const id = segments[1] as ExerciseId;
    if (segments[0] === "progress" && (segments.length === 2 || (segments.length === 3 && segments[2] === "detail"))) content = <ResultsHistory key={id} sessions={await readResults(patientId)} exerciseCode={id} />;
    else notFound();
  } else notFound();
  return <AppShell patientProfile={patient} demo={demo}>{testContent && <p className="notice">โหมดทดสอบกล้อง · ผลทดสอบระบบ ไม่ใช่ผลฝึกทางคลินิก</p>}{content}</AppShell>;
}
