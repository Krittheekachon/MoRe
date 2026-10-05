"use client";

import Link from "next/link";
import { Camera, Pause, Play, Plus, RotateCcw, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { exercises, demoDate, type ExerciseId } from "@/lib/demo-data";
import { useDemo } from "./demo-provider";
import { PageHeading, EmptyState } from "./shell";
import { DisplayMenu, DisplaySettings } from "./display-settings";
import { trainingHref, type DailyTrainingItem } from "@/lib/training-types";

export function CameraView({ id, resultOnly = false, assignment }: { id: string; resultOnly?: boolean; assignment?: DailyTrainingItem }) {
  const { dailyPlans, sets, saveSet } = useDemo();
  const plan = assignment ? { selected_side: assignment.side, target_sets: assignment.targetSets, target_reps_per_set: assignment.targetReps } : dailyPlans["1"].find(p => p.exercise_id === id);
  const exercise = assignment ? { id, name: assignment.exercise.name, view: assignment.exercise.view || "ยังไม่ระบุมุมกล้อง", side: assignment.exercise.supportsSide } : exercises.find(e => e.id === id)!;
  const [verifiedSaved, setVerifiedSaved] = useState(assignment?.savedSets);
  const saved = verifiedSaved ?? sets.filter(s => s.patient_id === "1" && s.exercise_id === id && s.local_date === demoDate).length;
  const [running, setRunning] = useState(false), [reps, setReps] = useState(0), [seconds, setSeconds] = useState(0);
  const [camera, setCamera] = useState(false), [error, setError] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);
  const [paused, setPaused] = useState(false);
  const [side, setSide] = useState(plan?.selected_side || (assignment ? "" : "left"));
  const [starting, setStarting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null), streamRef = useRef<MediaStream | null>(null);
  const activeRef = useRef(true), generation = useRef(0), savedRef = useRef(false), sessionRef = useRef("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => { activeRef.current = true; return () => { activeRef.current = false; streamRef.current?.getTracks().forEach(t => t.stop()); }; }, []);
  useEffect(() => { if (!running) return; const timer = setInterval(() => setSeconds(s => s + 1), 1000); return () => clearInterval(timer); }, [running]);
  async function openCamera() {
    setError(""); const attempt = ++generation.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("unavailable");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      if (!activeRef.current || attempt !== generation.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCamera(true);
    } catch { streamRef.current?.getTracks().forEach(t => t.stop()); setCamera(false); if (activeRef.current) setError("เปิดกล้องไม่ได้ กรุณาตรวจสิทธิ์กล้องและลองอีกครั้ง"); }
  }
  function stopCamera() { generation.current++; streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; setCamera(false); }
  function save() {
    if (assignment || !plan || savedRef.current || saved >= plan.target_sets) return;
    savedRef.current = true; setDraftSaved(true); setRunning(false);
    if (!sessionRef.current) sessionRef.current = crypto.randomUUID();
    saveSet({ id: crypto.randomUUID(), patient_id: "1", exercise_id: id as ExerciseId, local_date: demoDate, session_id: sessionRef.current, target_reps: plan.target_reps_per_set, reps, elapsed_seconds: seconds }, plan.target_sets);
    dialogRef.current?.showModal();
  }
  async function toggleTraining() {
    if (running) { setRunning(false); setPaused(true); return; }
    if (starting) return;
    if (assignment && exercise.side && !side) { setError("กรุณาเลือกข้างที่ฝึก"); return; }
    setStarting(true); setError("");
    try {
      if (assignment) {
        const response = await fetch(`/api/patient/training/daily/${assignment.id}`, { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "ไม่สามารถเริ่มฝึกได้");
        if (result.assignment.targetSets !== assignment.targetSets || result.assignment.targetReps !== assignment.targetReps) throw new Error("เป้าหมายเปลี่ยนแล้ว กรุณาเปิดแผนวันนี้ใหม่");
        setVerifiedSaved(result.assignment.savedSets);
      }
      setPaused(false); setRunning(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "ไม่สามารถเริ่มฝึกได้"); }
    finally { setStarting(false); }
  }
  if (!plan) return <><PageHeading title={exercise.name} back="/patient/exercises" /><EmptyState title="ท่านี้ยังไม่ได้อยู่ในแผนฝึก"><Link className="command" href="/patient/plan">ดูแผนฝึก</Link></EmptyState></>;
  if (resultOnly) return <><PageHeading title="ผลการฝึก" back="/patient/exercises" /><section className="summary-band"><div><strong>{saved} / {plan.target_sets}</strong><p>เซตที่บันทึก</p></div>{!assignment && <div><strong>{sets.filter(s => s.patient_id === "1" && s.exercise_id === id && s.local_date === demoDate).reduce((sum, s) => sum + s.reps, 0)}</strong><p>จำนวนครั้งรวม</p></div>}</section><div className="action-row"><Link className="command primary" href={assignment ? trainingHref(assignment, "camera") : `/patient/exercises/${id}/camera`}>กลับไปฝึก</Link><Link className="command" href="/patient/exercises">ดูแผนวันนี้</Link></div></>;
  return <>
    <PageHeading title={exercise.name} subtitle={`มุมกล้อง: ${exercise.view} · ${saved} / ${plan.target_sets} เซตที่บันทึก`} back={assignment ? trainingHref(assignment, "guide") : `/patient/exercises/${id}/guide`}>{!running && !paused && !draftSaved && <DisplayMenu />}</PageHeading>
    <p className="notice">{assignment ? "ใช้เป้าหมายจากแผนจริง · กล้องยังเป็นโหมดตัวอย่าง ไม่ตรวจท่าหรือนับด้วย AI และยังไม่บันทึกผลลงฐานข้อมูล" : "โหมดฝึกตัวอย่าง · ยังไม่มีการตรวจท่าหรือนับครั้งด้วย AI"}</p>
    <div className="split-view"><section><div className="camera-view"><video ref={videoRef} playsInline muted aria-label="ภาพกล้องสด" />{!camera && <div className="camera-placeholder"><Camera size={48} /><p>กล้องยังไม่เปิด</p></div>}</div><div className="camera-controls"><button className="command" onClick={camera ? stopCamera : openCamera}><Camera size={18} />{camera ? "ปิดกล้อง" : "เปิดกล้อง"}</button></div>{error && <p className="error-text" role="alert">{error}</p>}</section>
      <section>{exercise.side && <label>ข้างที่ฝึก<select aria-label="ข้างที่ฝึก" value={side} disabled={running || reps > 0 || !!assignment?.side} onChange={e => setSide(e.target.value)}>{assignment && !assignment.side && <option value="">เลือกข้าง</option>}<option value="left">ซ้าย</option><option value="right">ขวา</option><option value="both">สองข้าง</option>{assignment?.side === "none" && <option value="none">ไม่แยกข้าง</option>}</select></label>}
        <section className="summary-band camera-summary"><div><strong>{reps} / {plan.target_reps_per_set}</strong><p>ครั้งในเซตนี้</p></div><div><strong>{seconds}</strong><p>วินาทีที่ฝึก</p></div></section>
        <p className="muted">{saved >= plan.target_sets ? "บันทึกครบเป้าหมายแล้ว" : running ? "กำลังฝึกตัวอย่าง" : "พร้อม / หยุดพัก"}</p>
        <div className="action-row"><button className="command primary" disabled={starting || saved >= plan.target_sets || draftSaved} onClick={toggleTraining}>{running ? <Pause size={18} /> : <Play size={18} />}{starting ? "กำลังตรวจสิทธิ์…" : running ? "หยุดพัก" : "เริ่ม / ทำต่อ"}</button><button className="command" disabled={!running || reps >= plan.target_reps_per_set} onClick={() => setReps(n => n + 1)}><Plus size={18} />เพิ่มครั้งตัวอย่าง</button><button className="command" disabled={saved >= plan.target_sets || draftSaved} onClick={() => { setRunning(false); setPaused(false); setReps(0); setSeconds(0); }}><RotateCcw size={18} />เริ่มเซตใหม่</button><button className="command primary" disabled={!!assignment || saved >= plan.target_sets || draftSaved} onClick={save}><Save size={18} />{assignment ? "ยังไม่เปิดบันทึกผล" : "บันทึกเซตตัวอย่าง"}</button></div>
        {paused && !draftSaved && <section className="pause-panel" aria-label="พักการฝึก"><h2>พักการฝึก</h2><DisplaySettings /></section>}
      </section></div>
    <dialog ref={dialogRef} className="app-dialog"><h2>บันทึกเซตตัวอย่างแล้ว</h2><p>{reps} / {plan.target_reps_per_set} ครั้ง · {seconds} วินาที</p><p>{saved} / {plan.target_sets} เซตที่บันทึก</p><div className="action-row">{saved < plan.target_sets && <button className="command primary" onClick={() => { savedRef.current = false; setDraftSaved(false); setPaused(false); setReps(0); setSeconds(0); dialogRef.current?.close(); }}>เซตถัดไป</button>}<Link className="command" href={`/patient/progress/${id}`}>ดูความก้าวหน้า</Link><Link className="command" href="/patient">กลับหน้าหลัก</Link></div><button className="command" onClick={() => dialogRef.current?.close()}>ปิด</button></dialog>
  </>;
}
