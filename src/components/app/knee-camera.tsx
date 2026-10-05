"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, LogOut, Pause, Play, RotateCcw, Save } from "lucide-react";
import { PageHeading } from "./shell";
import { DisplayMenu, DisplaySettings } from "./display-settings";
import { trainingHref, type DailyTrainingItem } from "@/lib/training-types";
import { jointAngle, pointConfidence, RepetitionCycle } from "@/lib/pose/cycle";
import { openPoseRuntime, type PoseFrame, type PoseRuntime } from "@/lib/pose/runtime";
import type { PoseCriteria, RecordingSlot, SavedSet, SaveSetInput, Side } from "@/lib/pose/types";

async function request<T>(url: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(url, { method, cache: "no-store", ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "ไม่สามารถบันทึกผลได้ กรุณาลองใหม่");
  return result;
}

export function KneeCamera({ assignment, approvalAvailable, demo = false }: { assignment: DailyTrainingItem; approvalAvailable: boolean; demo?: boolean }) {
  const router = useRouter();
  const [side, setSide] = useState(assignment.side === "left" || assignment.side === "right" ? assignment.side : "");
  const [camera, setCamera] = useState(false); const [opening, setOpening] = useState(false);
  const [modelStatus, setModelStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [tracking, setTracking] = useState("ยังไม่เปิดกล้อง");
  const [running, setRunning] = useState(false); const [paused, setPaused] = useState(false);
  const [reps, setReps] = useState(0); const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [savedSets, setSavedSets] = useState(assignment.savedSets);
  const [summary, setSummary] = useState<SavedSet | null>(null);
  const [saveUncertain, setSaveUncertain] = useState(false);
  const [hasSlot, setHasSlot] = useState(false);
  const [simulation, setSimulation] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const simulated = useRef(false);
  const simulationJob = useRef(false);
  const simulationGeneration = useRef(0);
  const video = useRef<HTMLVideoElement>(null); const canvas = useRef<HTMLCanvasElement>(null); const dialog = useRef<HTMLDialogElement>(null);
  const stream = useRef<MediaStream | null>(null); const runtime = useRef<PoseRuntime | null>(null);
  const mounted = useRef(true); const generation = useRef(0); const pending = useRef(false);
  const active = useRef(false); const activeSince = useRef<number | null>(null); const elapsed = useRef(0);
  const cycle = useRef<RepetitionCycle | null>(null); const criteria = useRef<PoseCriteria | null>(null);
  const slot = useRef<RecordingSlot | null>(null); const frozen = useRef<SaveSetInput | null>(null);
  const target = useRef(assignment.targetReps);
  const elapsedSeconds = useCallback(() => Math.floor((elapsed.current + (activeSince.current === null ? 0 : performance.now() - activeSince.current)) / 1000), []);
  const pauseLocally = useCallback(() => {
    simulationGeneration.current++;
    if (activeSince.current !== null) elapsed.current += performance.now() - activeSince.current;
    activeSince.current = null; active.current = false; cycle.current?.interrupt();
    if (mounted.current) { setRunning(false); setPaused(!!slot.current); setSeconds(elapsedSeconds()); }
  }, [elapsedSeconds]);
  const closeCamera = useCallback(() => {
    generation.current++; pauseLocally(); runtime.current?.dispose(); runtime.current = null;
    stream.current?.getTracks().forEach(track => track.stop()); stream.current = null;
    if (video.current) video.current.srcObject = null;
    if (canvas.current) canvas.current.getContext("2d")?.clearRect(0, 0, canvas.current.width, canvas.current.height);
    if (mounted.current) { setCamera(false); setModelStatus("idle"); setTracking("กล้องปิดอยู่"); }
  }, [pauseLocally]);
  function frame(result: PoseFrame) {
    if (!mounted.current) return;
    const output = canvas.current;
    if (output) {
      output.width = result.width; output.height = result.height;
      const context = output.getContext("2d");
      if (context) { context.clearRect(0, 0, output.width, output.height); context.fillStyle = "#64d5db";
        for (const point of result.points) if (Number.isFinite(point.x) && Number.isFinite(point.y)) { context.beginPath(); context.arc(point.x * output.width, point.y * output.height, 3, 0, 2 * Math.PI); context.fill(); }
      }
    }
    const definition = criteria.current;
    const points = definition?.coordinates === "world-3d" ? result.world : result.points;
    const angle = definition ? jointAngle(points, definition, result.width, result.height) : null;
    setTracking(!result.points.length ? "ไม่พบร่างกาย / tracking ขาดหาย" : definition && angle === null ? "จุดวัดไม่ชัดเจน กรุณาจัดกล้องใหม่" : "พบจุดร่างกาย");
    if (simulated.current || !active.current || !cycle.current || !definition) return;
    const confidence = angle === null ? 0 : Math.min(...definition.landmarks.map(index => pointConfidence(points[index])));
    cycle.current.sample(angle, result.at, confidence);
    const count = cycle.current.repetitions.length;
    setReps(count);
    if (count >= target.current) pauseLocally();
  }
  useEffect(() => {
    mounted.current = true;
    const timer = setInterval(() => { if (active.current) setSeconds(elapsedSeconds()); }, 250);
    const abandon = () => {
      active.current = false; cycle.current?.interrupt();
      if (slot.current && !frozen.current) navigator.sendBeacon(`/api/patient/training/sets/${slot.current.setId}/state`, new Blob([JSON.stringify({ action: "exit", elapsedSeconds: elapsedSeconds() })], { type: "application/json" }));
    };
    const visibility = () => { if (document.hidden) pauseLocally(); };
    window.addEventListener("pagehide", abandon); document.addEventListener("visibilitychange", visibility);
    return () => { abandon(); mounted.current = false; clearInterval(timer); window.removeEventListener("pagehide", abandon); document.removeEventListener("visibilitychange", visibility); closeCamera(); };
  }, [closeCamera, elapsedSeconds, pauseLocally]);
  async function openCamera() {
    if (opening || stream.current) return;
    const attempt = ++generation.current; setOpening(true); setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.Worker || !window.OffscreenCanvas) throw new Error("อุปกรณ์หรือ browser นี้ยังไม่รองรับกล้องและการตรวจท่า");
      const acquired = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      if (!mounted.current || generation.current !== attempt) { acquired.getTracks().forEach(track => track.stop()); return; }
      stream.current = acquired; video.current!.srcObject = acquired; await video.current!.play();
      if (!mounted.current || generation.current !== attempt) return;
      setCamera(true);
      runtime.current = openPoseRuntime(video.current!, frame, status => { if (!mounted.current) return; setModelStatus(status); if (status === "error") { pauseLocally(); setError("โหลดหรือประมวลผลการตรวจท่าไม่ได้ กรุณาปิดกล้องแล้วลองใหม่"); } });
      acquired.getVideoTracks()[0].onended = closeCamera;
    } catch (cause) {
      if (generation.current === attempt) { closeCamera(); if (mounted.current) setError(cause instanceof DOMException && cause.name === "NotAllowedError" ? "ไม่ได้รับสิทธิ์กล้อง กรุณาอนุญาตกล้องใน browser" : "เปิดกล้องไม่ได้ กรุณาตรวจอุปกรณ์และลองใหม่"); }
    } finally { if (mounted.current) setOpening(false); }
  }
  async function toggle() {
    if (pending.current || frozen.current) return;
    if (active.current) {
      pauseLocally(); pending.current = true; setBusy(true);
      try { if (slot.current) await request(`/api/patient/training/sets/${slot.current.setId}`, "PATCH", { action: "pause", elapsedSeconds: elapsedSeconds() }); }
      catch { if (mounted.current) setError("หยุดนับแล้ว แต่แจ้งสถานะพักไม่สำเร็จ ผลปัจจุบันยังอยู่"); }
      finally { pending.current = false; if (mounted.current) setBusy(false); }
      return;
    }
    if ((!simulated.current && (!camera || modelStatus !== "ready")) || !side) return;
    pending.current = true; setBusy(true); setError("");
    try {
      const result = await request<{ criteria: PoseCriteria }>(`/api/patient/training/daily/${assignment.id}/recording?side=${side}`, "GET");
      if (criteria.current && JSON.stringify(criteria.current) !== JSON.stringify(result.criteria)) throw new Error("เกณฑ์เปลี่ยนแล้ว กรุณาบันทึกหรือติดต่อทีมรักษา");
      criteria.current = result.criteria; cycle.current ??= new RepetitionCycle(result.criteria); cycle.current.interrupt();
      if (!slot.current) slot.current = await request<RecordingSlot>(`/api/patient/training/daily/${assignment.id}/recording`, "POST", { side });
      else await request(`/api/patient/training/sets/${slot.current.setId}`, "PATCH", { action: "resume", elapsedSeconds: elapsedSeconds() });
      if (!mounted.current || document.hidden || (!simulated.current && !stream.current)) return;
      setHasSlot(true);
      active.current = true; activeSince.current = performance.now(); setPaused(false); setRunning(true);
    } catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : "เริ่มฝึกไม่ได้"); }
    finally { pending.current = false; if (mounted.current) setBusy(false); }
  }
  async function simulate() {
    if (!demo || !simulated.current || !active.current || simulationJob.current || !cycle.current || !criteria.current) return;
    simulationJob.current = true; setSimulating(true);
    const current = cycle.current;
    const job = simulationGeneration.current;
    try {
      for (const angle of [90, 90, 90, 125, 150, 150, 90, 90, 90]) {
        if (!mounted.current || !active.current || cycle.current !== current || job !== simulationGeneration.current) break;
        current.sample(angle, Date.now(), 1);
        const count = current.repetitions.length; setReps(count);
        if (count >= target.current) { pauseLocally(); break; }
        await new Promise(resolve => setTimeout(resolve, 120));
      }
    } finally { simulationJob.current = false; if (mounted.current) setSimulating(false); }
  }
  async function save() {
    if (pending.current || !slot.current || !criteria.current) return;
    pauseLocally(); pending.current = true; setBusy(true); setError("");
    frozen.current ??= { side: side as Side, metricId: criteria.current.metricId, definitionVersion: criteria.current.definitionVersion, criteriaVersion: criteria.current.criteriaVersion, elapsedSeconds: elapsedSeconds(), repetitions: structuredClone(cycle.current?.repetitions || []) };
    setSaveUncertain(true);
    try {
      const result = await request<SavedSet>(`/api/patient/training/sets/${slot.current.setId}`, "POST", frozen.current);
      if (!mounted.current) return;
      slot.current = null; frozen.current = null; setHasSlot(false); setSaveUncertain(false); setSummary(result); setSavedSets(result.savedSets); setPaused(false);
      // Refreshing a completed camera route would replace its summary with the eligibility guard.
      dialog.current?.showModal();
    } catch { if (mounted.current) setError("ยังยืนยันการบันทึกไม่ได้ ผลเซตยังอยู่ กรุณากดบันทึกเพื่อลองอีกครั้ง"); }
    finally { pending.current = false; if (mounted.current) setBusy(false); }
  }
  async function discard(exit: boolean) {
    if (pending.current || frozen.current) return;
    pauseLocally(); pending.current = true; setBusy(true); setError("");
    try {
      if (slot.current) await request(`/api/patient/training/sets/${slot.current.setId}`, "PATCH", { action: exit ? "exit" : "restart", elapsedSeconds: elapsedSeconds() });
      slot.current = null; criteria.current = null; cycle.current = null; elapsed.current = 0; setHasSlot(false); setReps(0); setSeconds(0); setPaused(false); setSummary(null);
      if (exit) { closeCamera(); router.push("/patient/exercises"); }
    } catch { setError("ยกเลิกเซตไม่สำเร็จ ผลที่ยังไม่บันทึกยังอยู่ กรุณาลองใหม่"); }
    finally { pending.current = false; if (mounted.current) setBusy(false); }
  }
  return <>
    <button className="back-command pose-back" onClick={() => discard(true)} disabled={busy || saveUncertain}><ArrowLeft size={20} />กลับ</button>
    <PageHeading title={assignment.exercise.name} subtitle={`${savedSets} / ${assignment.targetSets} เซตที่บันทึก`}>{!running && !paused && !summary && <DisplayMenu />}</PageHeading>
    {!approvalAvailable && <p className="notice">รอยืนยันว่าท่านี้คือท่านั่งเหยียดขา พร้อมนิยามมุมและเกณฑ์จากทีมรักษา เปิดกล้องดูจุดร่างกายได้ แต่ยังไม่นับหรือบันทึกผลการประเมิน</p>}
    {demo && <><p className="notice">DEMO สังเคราะห์ · มุมและเป้าหมายทดลอง ไม่ใช่เกณฑ์ที่หมอยืนยัน ไม่ใช้กับคนไข้จริง</p><fieldset className="action-row demo-source" disabled={running || paused || hasSlot || busy || simulating || !!summary}><legend>แหล่งข้อมูล Demo</legend><label><input type="radio" name="demo-source" checked={!simulation} onChange={() => { setSimulation(false); simulated.current = false; }} />กล้องทดลอง</label><label><input type="radio" name="demo-source" checked={simulation} onChange={() => { setSimulation(true); simulated.current = true; }} />รอบจำลอง (ไม่ใช่ AI)</label></fieldset></>}
    <div className="split-view"><section>
      <div className="camera-view pose-preview"><video ref={video} playsInline muted aria-label="ภาพกล้องสด" /><canvas ref={canvas} aria-hidden="true" />{!camera && <div className="camera-placeholder"><Camera size={48} /><p>กล้องยังไม่เปิด</p></div>}</div>
      <div className="camera-controls"><button className="command" disabled={opening || busy || saveUncertain} onClick={camera ? closeCamera : openCamera}><Camera size={18} />{opening ? "กำลังเปิดกล้อง" : camera ? "ปิดกล้อง" : "เปิดกล้อง"}</button></div>
      <p role="status">{modelStatus === "loading" ? "กำลังโหลดการตรวจท่า" : modelStatus === "error" ? "การตรวจท่าไม่พร้อมใช้งาน" : tracking}</p>
      {error && <p className="error-text" role="alert">{error}</p>}
    </section><section>
      <label>ข้างที่ฝึก<select aria-label="ข้างที่ฝึก" value={side} disabled={running || paused || reps > 0 || busy || saveUncertain || assignment.side === "left" || assignment.side === "right"} onChange={event => setSide(event.target.value)}><option value="">เลือกข้าง</option><option value="left">ซ้าย</option><option value="right">ขวา</option></select></label>
      <section className="summary-band camera-summary"><div><strong>{reps} / {assignment.targetReps}</strong><p>ครั้งในเซตนี้</p></div><div><strong>{seconds}</strong><p>วินาทีที่ฝึก</p></div></section>
      <p className="muted">{running ? "กำลังฝึก" : paused ? "พักการฝึก" : "พร้อมเริ่ม"}</p>
      <div className="action-row">
        <button className="command primary" disabled={busy || saveUncertain || !!summary || savedSets >= assignment.targetSets || (!running && (!approvalAvailable || (!simulation && (modelStatus !== "ready" || !camera)) || !side))} onClick={toggle}>{running ? <Pause size={18} /> : <Play size={18} />}{running ? "หยุดพัก" : "เริ่ม / ทำต่อ"}</button>
        {demo && simulation && <button className="command" disabled={!running || busy || simulating} onClick={simulate}><Play size={18} />{simulating ? "กำลังจำลองรอบ" : "รอบจำลอง"}</button>}
        <button className="command" disabled={busy || saveUncertain} onClick={() => discard(false)}><RotateCcw size={18} />เริ่มเซตใหม่</button>
        <button className="command primary" disabled={busy || !hasSlot || !!summary} onClick={save}><Save size={18} />{busy ? "กำลังดำเนินการ" : saveUncertain ? "ลองบันทึกอีกครั้ง" : "บันทึกเซต"}</button>
        <button className="command" disabled={busy || saveUncertain} onClick={() => discard(true)}><LogOut size={18} />ออก</button>
      </div>
      {paused && <section className="pause-panel" aria-label="พักการฝึก"><h2>พักการฝึก</h2><DisplaySettings /></section>}
    </section></div>
    <dialog ref={dialog} className="app-dialog" aria-labelledby="saved-set-title"><h2 id="saved-set-title">บันทึกเซตแล้ว</h2><p>{summary?.reps} / {assignment.targetReps} ครั้ง</p><p>มุมสูงสุด: {summary?.maxAngle?.toFixed(2) ?? "-"} องศา · เฉลี่ยมุมสูงสุด: {summary?.averageAngle?.toFixed(2) ?? "-"} องศา</p><p>{summary?.savedSets} / {assignment.targetSets} เซตที่บันทึก</p><div className="action-row">{savedSets < assignment.targetSets && <button className="command primary" onClick={() => { dialog.current?.close(); discard(false); }}>เซตถัดไป</button>}<Link className="command" href="/patient/exercises">ดูแผนวันนี้</Link><button className="command" onClick={() => dialog.current?.close()}>ปิด</button></div></dialog>
    {!running && !paused && <Link className="command" href={trainingHref(assignment, "guide")}>รายละเอียดท่า</Link>}
  </>;
}
