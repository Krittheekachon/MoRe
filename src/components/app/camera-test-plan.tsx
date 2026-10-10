"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { accountRequest } from "@/lib/account-client";
import type { PatientTrainingPlan, TrainingTemplate } from "@/lib/training-types";
import { PageHeading } from "./shell";

export function CameraTestPlan({ templates, activePlan }: { templates: TrainingTemplate[]; activePlan: PatientTrainingPlan | null }) {
  const router = useRouter();
  const template = templates[0]; const item = template?.items[0];
  const [selected, setSelected] = useState(false);
  const [sets, setSets] = useState(1); const [reps, setReps] = useState(5);
  const [side, setSide] = useState("left"); const [pending, setPending] = useState(false); const [error, setError] = useState("");
  async function save(event: FormEvent) {
    event.preventDefault(); if (!selected || !template || pending) return;
    setPending(true); setError("");
    try {
      await accountRequest("/api/patient/training/plan", { templateId: template.id, cameraTest: { sets, reps, side } });
      router.push("/patient/exercises"); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "บันทึกไม่สำเร็จ"); }
    finally { setPending(false); }
  }
  return <div className="exercise-picker"><PageHeading title="เลือกแผนการฝึก" back="/patient" />
    <p className="notice">โหมดทดสอบกล้อง · มุมและเป้าหมายใช้ทดสอบซอฟต์แวร์เท่านั้น</p>
    {activePlan && <p>แผนปัจจุบัน: {activePlan.name} · หากมีแผนวันนี้แล้ว แผนใหม่เริ่มวันถัดไป โดยคงผลเดิม</p>}
    {!item ? <p role="alert">ยังไม่มีข้อมูลทดสอบ กรุณารัน npm run demo:seed</p> : <form onSubmit={save}>
      <details className="exercise-picker-module"><summary>Module {item.exercise.module} · {item.exercise.moduleName}</summary>
        <div className="exercise-picker-options"><label className="exercise-picker-option"><input type="checkbox" checked={selected} disabled={pending} onChange={e => setSelected(e.target.checked)} /><strong>นั่งเหยียดขา — ทดสอบกล้อง</strong></label>
          {selected && <div className="plan-row">
            <label>เซต<input type="number" min={1} max={20} required value={sets || ""} onChange={e => setSets(Number(e.target.value))} /></label>
            <label>ครั้ง / เซต<input type="number" min={1} max={100} required value={reps || ""} onChange={e => setReps(Number(e.target.value))} /></label>
            <label>ข้าง<select value={side} onChange={e => setSide(e.target.value)}><option value="left">ซ้าย</option><option value="right">ขวา</option></select></label>
          </div>}
        </div>
      </details><p>ยืนยันแผน: {selected ? `${sets} เซต × ${reps} ครั้ง · ขา${side === "left" ? "ซ้าย" : "ขวา"}` : "ยังไม่ได้เลือกท่า"}</p>
      <button className="command primary" disabled={!selected || pending}>{pending ? "กำลังบันทึก" : "ยืนยันและบันทึกแผน"}</button>
    </form>}{error && <p role="alert" className="error-text">{error}</p>}
  </div>;
}
