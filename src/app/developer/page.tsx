import { notFound } from "next/navigation";
import { requireDeveloper } from "@/lib/developer-session";
import { PoseCamera } from "@/components/app/knee-camera";

export default async function DeveloperPage() {
  try { await requireDeveloper(); } catch { notFound(); }
  return <main className="system-app developer-workspace"><PoseCamera developer cameraTest approvalAvailable assignment={{ id: 0, planId: 0, exercise: { id: 0, code: "demo-knee-extension", name: "นั่งเหยียดขา - Seated Knee Extension", english: "Seated Knee Extension", module: 2, view: "ด้านข้าง", supportsSide: true, tutorial: null }, side: null, targetSets: 1, targetReps: 5, savedSets: 0, status: "not_started", instructions: null, canStart: true }} /></main>;
}