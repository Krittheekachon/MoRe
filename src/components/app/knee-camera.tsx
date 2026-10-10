"use client";

import "./pose-camera.css";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Info, LogOut, Pause, Play, RotateCcw, Save } from "lucide-react";
import { DisplaySettings } from "./display-settings";
import { type DailyTrainingItem } from "@/lib/training-types";
import { poseEngine, type RepetitionCounter } from "@/lib/pose/engines/registry";
import { drawPoseOverlay } from "@/lib/pose/draw-overlay";
import { drawMeasurementLabels, measurementLabels, landmarkLabel } from "@/lib/pose/landmark-labels";
import { PoseTrackingQuality, PoseLandmarkSmoother } from "@/lib/pose/tracking-quality";
import { KneePreparation, type PreparationResult, type PreparationDebug } from "@/lib/pose/exercises/knee-preparation";
import { refreshMockCameraPolicy, cameraCriteriaSignature } from "@/lib/pose/camera-test-adapter";
import { PreparationCountdown } from "@/lib/pose/preparation-countdown";
import { jointAngle } from "@/lib/pose/cycle";
import type { PoseFeedback } from "@/lib/pose/feedback-types";
import { openPoseRuntime, type PoseFrame, type PoseRuntime } from "@/lib/pose/runtime";
import type { PoseCriteria, RecordingSlot, SavedSet, SaveSetInput, Side } from "@/lib/pose/types";

async function request<T>(url: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(url, { method, cache: "no-store", signal: AbortSignal.timeout(15000), ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "ไม่สามารถบันทึกผลได้ กรุณาลองใหม่");
  return result;
}

export const KneeCamera = PoseCamera; // Compatibility for existing imports.
export function PoseCamera({ assignment, approvalAvailable, demo = false, cameraTest = false }: { assignment: DailyTrainingItem; approvalAvailable: boolean; demo?: boolean; cameraTest?: boolean }) {
  const router = useRouter();
  const [side, setSide] = useState(assignment.side === "left" || assignment.side === "right" ? assignment.side : "");
  const [camera, setCamera] = useState(false); const [opening, setOpening] = useState(false);

  const [modelStatus, setModelStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [currentAngle, setCurrentAngle] = useState<number | null>(null);
  const [definition, setDefinition] = useState<PoseCriteria | null>(null);
  const measurement = useRef<PoseCriteria | null>(null);
  const [trackingGuard] = useState(() => new PoseTrackingQuality());
  const trackingQuality = useRef(trackingGuard);
  const [filters] = useState(() => ({ image: new PoseLandmarkSmoother(), world: new PoseLandmarkSmoother() }));
  const filterKey = useRef("");
  const displaySmoother = useRef(filters.image);
  const preparation = useRef<{ definition: PoseCriteria; gate: KneePreparation; countdown: PreparationCountdown } | null>(null);
  const [preparationView, setPreparationView] = useState<PreparationResult | null>(null);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [debugView, setDebugView] = useState<{ preparation: PreparationDebug | null; counter: RepetitionCounter["debug"]; lastCompleted: { peak: number; correct: boolean } | null; rawKnee: number | null; rawTorso: number | null; filteredKnee: number | null; filteredTorso: number | null; trusted: boolean } | null>(null);
  const lastViewAt = useRef(-Infinity);
  const [tracking, setTracking] = useState("ยังไม่เปิดกล้อง");
  const [trackingUnreliable, setTrackingUnreliable] = useState(false);
  const [landmarkTracking, setLandmarkTracking] = useState<ReturnType<typeof measurementLabels>>([]);
  const [running, setRunning] = useState(false); const [paused, setPaused] = useState(false);
  const [reps, setReps] = useState(0); const [seconds, setSeconds] = useState(0);
  const [correctReps, setCorrectReps] = useState(0);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [savedSets, setSavedSets] = useState(assignment.savedSets);
  const [summary, setSummary] = useState<SavedSet | null>(null);
  const [saveUncertain, setSaveUncertain] = useState(false);
  const [hasSlot, setHasSlot] = useState(false);
  const [pendingDiscard, setPendingDiscard] = useState<"exit" | "reset" | null>(null);
  const [simulation, setSimulation] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const simulated = useRef(false);
  const simulationJob = useRef(false);
  const simulationGeneration = useRef(0);
  const video = useRef<HTMLVideoElement>(null); const canvas = useRef<HTMLCanvasElement>(null); const dialog = useRef<HTMLDialogElement>(null);
  const details = useRef<HTMLDialogElement>(null);
  const confirmation = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (pendingDiscard) confirmation.current?.showModal();
    else confirmation.current?.close();
  }, [pendingDiscard]);
  const stream = useRef<MediaStream | null>(null); const runtime = useRef<PoseRuntime | null>(null);
  const mounted = useRef(true); const generation = useRef(0); const pending = useRef(false);
  const active = useRef(false); const activeSince = useRef<number | null>(null); const elapsed = useRef(0);
  const cycle = useRef<RepetitionCounter | null>(null); const criteria = useRef<PoseCriteria | null>(null);
  const overlay = useRef<{ definition: PoseCriteria; feedback: PoseFeedback; preview: RepetitionCounter } | null>(null);
  const slot = useRef<RecordingSlot | null>(null); const frozen = useRef<SaveSetInput | null>(null);
  const elapsedSeconds = useCallback(() => Math.floor((elapsed.current + (activeSince.current === null ? 0 : performance.now() - activeSince.current)) / 1000), []);
  const pauseLocally = useCallback(() => {
    simulationGeneration.current++;
    if (activeSince.current !== null) elapsed.current += performance.now() - activeSince.current;
    activeSince.current = null; active.current = false; cycle.current?.interrupt();
    trackingQuality.current.reset(); filters.image.reset(); filters.world.reset(); preparation.current = null;
    overlay.current = null;
    if (mounted.current) { setRunning(false); setPaused(!!slot.current); setSeconds(elapsedSeconds()); }
  }, [elapsedSeconds, filters]);
  const closeCamera = useCallback(() => {
    generation.current++; pauseLocally(); runtime.current?.dispose(); runtime.current = null;
    stream.current?.getTracks().forEach(track => track.stop()); stream.current = null;
    if (video.current) video.current.srcObject = null;
    if (canvas.current) canvas.current.getContext("2d")?.clearRect(0, 0, canvas.current.width, canvas.current.height);
    trackingQuality.current.reset();
    displaySmoother.current.reset();
    preparation.current = null; setPreparationView(null); lastViewAt.current = -Infinity;
    if (mounted.current) { setCamera(false); setCurrentAngle(null); setModelStatus("idle"); setTracking("กล้องปิดอยู่"); setTrackingUnreliable(false); }
  }, [pauseLocally]);
  function chooseSide(value: Side) {
    if (value === side) return;
    setSide(value); cycle.current?.interrupt(); overlay.current = null; preparation.current = null;
    trackingQuality.current.reset(); filters.image.reset(); filters.world.reset();
    measurement.current = null; setDefinition(null); setCurrentAngle(null); setPreparationView(null); setLandmarkTracking([]);
  }
  function frame(result: PoseFrame) {
    if (!mounted.current) return;

    const definition = criteria.current ?? measurement.current;
    const key = definition ? `${definition.exerciseCode}:${definition.landmarks.join(",")}:${definition.coordinates}:${definition.criteriaVersion}` : "";
    if (filterKey.current !== key) {
      filterKey.current = key; filters.image.reset(); filters.world.reset(); trackingQuality.current.reset(); preparation.current = null;
      cycle.current?.interrupt(); overlay.current = null;
    }
    const trusted = !definition || trackingQuality.current.update(result.points, definition, result.at);
    if (!trusted) { filters.image.reset(); filters.world.reset(); }
    const displayPoints = trusted ? filters.image.update(result.points, result.at, definition?.minVisibility) : [];
    const points = definition?.coordinates === "world-3d" ? (trusted ? filters.world.update(result.world, result.at, definition.minVisibility, false) : []) : displayPoints;
    const refreshView = result.at - lastViewAt.current >= 200 || !trusted;
    if (refreshView) setLandmarkTracking(definition ? measurementLabels(definition, displayPoints) : []);
    const inFrame = definition?.landmarks.every(i => result.points[i] && result.points[i].x >= 0 && result.points[i].x <= 1 && result.points[i].y >= 0 && result.points[i].y <= 1);
    const angle = definition && inFrame && trusted ? poseEngine(definition).measure(points, definition, result.width, result.height) : null;
    setTrackingUnreliable(!!definition && angle === null);
    setTracking(!result.points.length ? "ไม่พบร่างกาย / tracking ขาดหาย" : definition && angle === null ? "จุดวัดไม่ชัดเจน กรุณาจัดกล้องใหม่" : "พบจุดร่างกาย");
    const confidence = angle === null || !definition ? 0 : poseEngine(definition).confidence(points, definition);
    const counting = !simulated.current && active.current && cycle.current && definition;
    let feedbackStatus: import("@/lib/pose/feedback-types").PoseFeedbackStatus = "tracking-lost";
    let framePreparation: PreparationResult | null = null;
    if (definition) {
      const engine = poseEngine(definition);
      if (overlay.current?.definition !== definition) overlay.current = { definition, feedback: engine.createFeedback(definition), preview: engine.createCounter(definition) };
      const counter = counting ? cycle.current! : overlay.current.preview;
      let allowed = true;
      let feedbackAllowed = true;
      let view: PreparationResult | null = null;
      if (definition.preparation) {
        if (preparation.current?.definition !== definition) preparation.current = { definition, gate: new KneePreparation(), countdown: new PreparationCountdown() };
        view = preparation.current.gate.update(displayPoints, definition, result.width, result.height, result.at, trusted, counter.movement);
        feedbackAllowed = view.allowed;
        if (counting) {
          const countdown = preparation.current.countdown.update(view.allowed, result.at, definition.maxGapMs);
          if (countdown.remaining !== null) view = { ...view, allowed: false, countdownRemaining: countdown.remaining, message: `เตรียมเริ่มใน ${countdown.remaining} · ค้างท่าเตรียมไว้` };
          else if (!countdown.allowed) view = { ...view, allowed: false };
        }
        framePreparation = view;
        allowed = view.allowed;
        if (!allowed) { if (view.interrupt) counter.interrupt(); else counter.suspend?.(result.at); }
      }
      if (allowed) counter.sample(angle, result.at, confidence); // Preview only when not actively counting.
      feedbackStatus = overlay.current.feedback.update(feedbackAllowed ? angle : null, result.at, confidence, counter.movement);
      const lastCompleted = counter.repetitions.at(-1);
      if (cameraTest && refreshView) setDebugView({ preparation: preparation.current?.gate.debug ?? null, counter: counter.debug,
        lastCompleted: lastCompleted ? { peak: Number(lastCompleted.peakAngle.toFixed(2)), correct: engine.correct({ ...lastCompleted, peakAngle: Number(lastCompleted.peakAngle.toFixed(2)) }, definition) } : null,
        rawKnee: jointAngle(result.points, definition, result.width, result.height),
        rawTorso: definition.preparation ? jointAngle(result.points, { ...definition, landmarks: [definition.preparation.shoulder, definition.landmarks[0], definition.landmarks[1]] }, result.width, result.height) : null,
        filteredKnee: view?.knee ?? angle, filteredTorso: view?.torso ?? null, trusted });
    }
    if (refreshView || angle === null) setCurrentAngle(definition?.preparation ? framePreparation?.knee ?? null : angle);
    const output = canvas.current;
    if (output) {
      output.width = result.width; output.height = result.height;
      const context = output.getContext("2d");
      if (context) {
        const focus = definition?.preparation ? [definition.preparation.shoulder, ...definition.landmarks, definition.preparation.heel, definition.preparation.foot] : undefined;
        drawPoseOverlay(context, trusted ? displayPoints : [], output.width, output.height, feedbackStatus, focus);
        if (definition) {
          const workspace = video.current?.closest(".pose-session");
          const rect = video.current?.getBoundingClientRect();
          const header = workspace?.querySelector(".pose-session-header")?.getBoundingClientRect();
          const card = workspace?.querySelector(".pose-control-card")?.getBoundingClientRect();
          const scale = rect ? Math.min(rect.width / output.width, rect.height / output.height) : 1;
          const imageTop = rect ? rect.top + (rect.height - output.height * scale) / 2 : 0;
          const safeArea = { top: Math.max(0, header ? (header.bottom - imageTop) / scale : 0), bottom: Math.min(output.height, card ? (card.top - imageTop) / scale : output.height) };
          const shown = framePreparation;
          drawMeasurementLabels(context, displayPoints, output.width, output.height, definition, trusted, shown, !(cycle.current?.movement.phase === "moving"), safeArea);
          if (refreshView || shown?.knee === null || shown?.torso === null) {
            setPreparationView(previous => previous?.message === shown?.message && previous?.ready === shown?.ready && previous?.countdownRemaining === shown?.countdownRemaining && previous?.knee === shown?.knee && previous?.torso === shown?.torso ? previous : shown);
            lastViewAt.current = result.at;
          }
        }
      }
    }
    if (counting) {
      const count = cycle.current!.repetitions.length;
      setReps(count);
      setCorrectReps(cycle.current!.repetitions.filter(rep => poseEngine(definition!).correct({ ...rep, peakAngle: Number(rep.peakAngle.toFixed(2)) }, definition!)).length);
    }
  }
  useEffect(() => {
    mounted.current = true;
    const timer = setInterval(() => { if (active.current) setSeconds(elapsedSeconds()); }, 250);
    const abandon = () => {
      active.current = false; cycle.current?.interrupt();
      if (slot.current && !frozen.current) navigator.sendBeacon(`/api/patient/training/sets/${slot.current.setId}/state`, new Blob([JSON.stringify({ action: "exit", elapsedSeconds: elapsedSeconds() })], { type: "application/json" }));
      closeCamera();
    };
    const visibility = () => { if (document.hidden) pauseLocally(); };
    window.addEventListener("pagehide", abandon); document.addEventListener("visibilitychange", visibility);
    return () => { abandon(); mounted.current = false; clearInterval(timer); window.removeEventListener("pagehide", abandon); document.removeEventListener("visibilitychange", visibility); closeCamera(); };
  }, [closeCamera, elapsedSeconds, pauseLocally]);
  async function openCamera() {
    if (opening || stream.current) return;
    const attempt = ++generation.current; setOpening(true); setError("");
    try {
      if (!window.isSecureContext) throw new Error("CAMERA_HTTPS");
      if (!navigator.mediaDevices?.getUserMedia || !window.Worker || !window.OffscreenCanvas || !window.createImageBitmap) throw new Error("อุปกรณ์หรือ browser นี้ยังไม่รองรับกล้องและการตรวจท่า กรุณาอัปเดต browser");
      let expired = false;
      let permissionTimer: ReturnType<typeof setTimeout> | undefined;
      const permission = navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false }).then(value => {
        if (expired) value.getTracks().forEach(track => track.stop());
        return value;
      });
      const acquired = await Promise.race([permission, new Promise<never>((_, reject) => {
        permissionTimer = setTimeout(() => { expired = true; reject(new Error("รอสิทธิ์กล้องนานเกินไป กรุณาอนุญาตกล้องแล้วลองใหม่")); }, 30000);
      })]).finally(() => clearTimeout(permissionTimer));
      if (!mounted.current || generation.current !== attempt) { acquired.getTracks().forEach(track => track.stop()); return; }
      stream.current = acquired; video.current!.srcObject = acquired; await video.current!.play();
      if (!mounted.current || generation.current !== attempt) return;
      setCamera(true);
      if (approvalAvailable && side) {
        const config = await request<{ criteria: PoseCriteria }>(`/api/patient/training/daily/${assignment.id}/recording?side=${side}`, "GET");
        if (!mounted.current || generation.current !== attempt) return;
        measurement.current = refreshMockCameraPolicy(config.criteria);
        setDefinition(measurement.current);
      }
      runtime.current = openPoseRuntime(video.current!, frame, status => { if (!mounted.current) return; setModelStatus(status); if (status === "error") { pauseLocally(); setError("โหลดหรือประมวลผลการตรวจท่าไม่ได้ กรุณาปิดกล้องแล้วลองใหม่"); } });
      acquired.getVideoTracks()[0].onended = closeCamera;
    } catch (cause) {
      if (generation.current === attempt) { closeCamera(); if (mounted.current) setError(cause instanceof Error && cause.message === "CAMERA_HTTPS" ? "กล้องต้องใช้ HTTPS หรือ localhost บนมือถือ/iPad ให้เปิด URL HTTPS ที่เชื่อถือใบรับรองแล้ว" : cause instanceof DOMException && cause.name === "NotAllowedError" ? "ไม่ได้รับสิทธิ์กล้อง กรุณาอนุญาตกล้องใน browser" : cause instanceof DOMException && cause.name === "NotFoundError" ? "ไม่พบกล้อง กรุณาตรวจอุปกรณ์กล้อง" : cause instanceof DOMException && cause.name === "NotReadableError" ? "กล้องถูกใช้งานหรือเปิดไม่ได้ กรุณาปิดแอปอื่นที่ใช้กล้อง" : cause instanceof Error ? cause.message : "เปิดกล้องไม่ได้ กรุณาตรวจอุปกรณ์และลองใหม่"); }
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
      result.criteria = refreshMockCameraPolicy(result.criteria);
      if (criteria.current) criteria.current = refreshMockCameraPolicy(criteria.current);
      if (criteria.current && cameraCriteriaSignature(criteria.current) !== cameraCriteriaSignature(result.criteria)) throw new Error("เกณฑ์เปลี่ยนแล้ว กรุณาบันทึกหรือติดต่อทีมรักษา");
      criteria.current = result.criteria; cycle.current ??= poseEngine(result.criteria).createCounter(result.criteria); cycle.current.interrupt();
      setDefinition(result.criteria);
      if (!slot.current) slot.current = await request<RecordingSlot>(`/api/patient/training/daily/${assignment.id}/recording`, "POST", { side });
      else await request(`/api/patient/training/sets/${slot.current.setId}`, "PATCH", { action: "resume", elapsedSeconds: elapsedSeconds() });
      if (!mounted.current || document.hidden || (!simulated.current && !stream.current)) return;
      setHasSlot(true);
      preparation.current = null;
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
        setCorrectReps(current.repetitions.filter(rep => poseEngine(criteria.current!).correct({ ...rep, peakAngle: Number(rep.peakAngle.toFixed(2)) }, criteria.current!)).length);
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
  async function discard(exit: boolean, confirmed = false) {
    if (pending.current || frozen.current) return;
    if (slot.current && !confirmed) { pauseLocally(); setPendingDiscard(exit ? "exit" : "reset"); return; }
    pauseLocally(); pending.current = true; setBusy(true); setError("");
    try {
      if (slot.current) await request(`/api/patient/training/sets/${slot.current.setId}`, "PATCH", { action: exit ? "exit" : "restart", elapsedSeconds: elapsedSeconds() });
      const previewCriteria = criteria.current ?? measurement.current;
      slot.current = null; criteria.current = null; cycle.current = null; elapsed.current = 0; setHasSlot(false); setReps(0); setCorrectReps(0); setSeconds(0); setPaused(false); setSummary(null);
      // Reset the draft, retaining the live stream, loaded worker and preview config.
      measurement.current = exit ? null : previewCriteria; setDefinition(measurement.current); setCurrentAngle(null);
      overlay.current = null; setDebugView(null);
      preparation.current = null; setPreparationView(null); lastViewAt.current = -Infinity;
      if (exit) { closeCamera(); router.push("/patient/exercises"); }
    } catch { setError("ยกเลิกเซตไม่สำเร็จ ผลที่ยังไม่บันทึกยังอยู่ กรุณาลองใหม่"); }
    finally { pending.current = false; if (mounted.current) setBusy(false); }
  }
  return <div className="pose-session">
      <div className="pose-camera-stage"><div className="pose-camera-frame">
      <div className="camera-view pose-preview"><video ref={video} playsInline muted aria-label="ภาพกล้องสด" /><canvas ref={canvas} aria-hidden="true" /></div>
      <header className="pose-session-header"><div className="pose-session-title"><h1>{assignment.exercise.name}</h1><p>เซต {Math.min(savedSets + 1, assignment.targetSets)} / {assignment.targetSets}</p></div><div className="pose-session-tools"><button className="command" disabled={opening || busy || saveUncertain} onClick={camera ? closeCamera : openCamera}><Camera size={18} />{opening ? "กำลังเปิดกล้อง" : camera ? "ปิดกล้อง" : "เปิดกล้อง"}</button><button className="command" aria-label="รายละเอียดท่า" title="รายละเอียดท่า" disabled={busy || saveUncertain} onClick={async () => { if (running) await toggle(); details.current?.showModal(); }}><Info size={18} /><span>รายละเอียดท่า</span></button></div></header>
      {!camera && <div className="camera-placeholder"><Camera size={48} /><p>กล้องยังไม่เปิด</p></div>}
      </div></div>
      {camera && modelStatus === "ready" && ((preparationView && (!preparationView.ready || preparationView.countdownRemaining !== undefined)) || trackingUnreliable || tracking === "ไม่พบร่างกาย / tracking ขาดหาย") && <aside className="pose-tracking-card" data-ready={preparationView?.ready || false} role="alert" aria-live="polite" aria-label="คำแนะนำจัดตำแหน่งกล้อง"><Info size={24} aria-hidden="true" /><div><strong>{preparationView?.message || (tracking === "จุดวัดไม่ชัดเจน กรุณาจัดกล้องใหม่" ? "จุดวัดไม่ชัดเจน" : "ไม่พบร่างกาย")}</strong>{preparationView ? <p>เข่า {preparationView.knee === null ? "—" : `${Math.round(preparationView.knee)}°`} · ลำตัว {preparationView.torso === null ? "—" : `${Math.round(preparationView.torso)}°`}</p> : <p>ปรับตำแหน่งตัวหรือกล้องให้เห็นข้อต่อที่ใช้วัดครบ และไม่ถูกบัง</p>}{!preparationView && landmarkTracking.length > 0 && <p className="pose-tracking-points">{landmarkTracking.map(label => `${label.name}: ${Math.round(label.confidence * 100)}% vis`).join(" · ")}</p>}</div></aside>}
      <section className="pose-control-card" aria-label="เมนูฝึก"><div className="pose-card-tools"><button className="command pose-exit" disabled={busy || saveUncertain} onClick={() => discard(true)}><LogOut size={18} />ออก</button><span>{running ? "กำลังฝึก" : paused ? "พักการฝึก" : "พร้อมเริ่ม"}</span><button className="icon-command" aria-label="รีเซ็ตเซต" title="รีเซ็ตเซต" disabled={busy || saveUncertain} onClick={() => discard(false)}><RotateCcw size={22} /></button></div>
      <div className="pose-session-metrics">
      <div className="pose-side-control" role="group" aria-label="ข้างที่ฝึก"><span>ข้างที่ฝึก</span><div className="pose-side-buttons">{(["left", "right"] as const).map(value => <button key={value} type="button" aria-pressed={side === value} disabled={running || paused || reps > 0 || busy || saveUncertain || (camera && !!side) || assignment.side === "left" || assignment.side === "right"} onClick={() => chooseSide(value)}><span aria-hidden="true">{side === value ? "✓ " : ""}</span>{value === "left" ? "ซ้าย" : "ขวา"}</button>)}</div>{!side && <small>เลือกข้างที่ฝึก</small>}</div>
      <section className="camera-summary"><div><strong>{reps} / {assignment.targetReps}</strong><p>ครั้งในเซตนี้</p></div><div><strong>{correctReps}</strong><p>ครั้งที่ทำถูก{cameraTest ? " (ทดสอบ)" : ""}</p></div></section>
      </div><div className="pose-secondary-scroll"><div className="pose-session-status"><p>มุมปัจจุบัน: {currentAngle === null ? "—" : `${currentAngle.toFixed(1)}°`}{definition && <> · เป้าหมาย {definition.correctPeak.min}–{definition.correctPeak.max}°</>} · {seconds} วินาที</p><p role="status">{opening ? "กำลังเปิดกล้อง" : modelStatus === "loading" ? "กำลังโหลด MediaPipe และโมเดลตรวจท่า" : modelStatus === "error" ? "การตรวจท่าไม่พร้อมใช้งาน" : `${modelStatus === "ready" ? "กล้องพร้อม · MediaPipe พร้อมใช้งาน · " : ""}${tracking}`}</p>{cameraTest && <small>โหมดทดสอบกล้อง · ไม่ใช่เกณฑ์ทางการแพทย์</small>}{!approvalAvailable && <p className="notice">เกณฑ์ท่านี้ยังไม่ยืนยัน เปิดกล้องได้ แต่ยังไม่นับหรือบันทึกผล</p>}{error && <p className="error-text" role="alert">{error}</p>}</div>
      {cameraTest && <><button type="button" className="command" aria-expanded={debugEnabled} aria-controls="pose-test-debug" onClick={() => setDebugEnabled(value => !value)}>Debug ท่าทดสอบ</button>{debugEnabled && <section id="pose-test-debug" aria-label="Debug ท่าทดสอบ">
        {!camera || !definition ? <p>เปิดกล้องและเลือกข้างเพื่อดูข้อมูลสด</p> : <>
          <p>exercise: {definition.exerciseCode} · definition {definition.definitionVersion} / criteria {definition.criteriaVersion} · ข้าง {side}</p>
          <p>กล้อง {camera ? "เปิด" : "ปิด"} · model {modelStatus} · {running ? "เริ่มฝึกแล้ว" : paused ? "พัก" : "ยังไม่กดเริ่ม"} · acquisition {debugView?.trusted ? "ผ่าน" : "ไม่ผ่าน"}</p>
          <p>Raw เข่า {debugView?.rawKnee?.toFixed(3) ?? "—"}° / ลำตัว {debugView?.rawTorso?.toFixed(3) ?? "—"}° · Filtered ที่ engine ใช้ {debugView?.filteredKnee?.toFixed(3) ?? "—"}° / {debugView?.filteredTorso?.toFixed(3) ?? "—"}°</p>
          <p>หน้าจอปัดเศษเพื่อแสดงผลเท่านั้น ตรวจและนับจาก filtered แบบไม่ปัดเศษ รวมขอบ min/max</p>
          {debugView?.preparation?.checks.map(check => <p key={check.name}>{check.name}: {check.passed ? "ผ่าน" : "ไม่ผ่าน"} · {check.value?.toFixed(3) ?? "—"}{check.min !== undefined ? ` / ≥${check.min}` : ""}{check.max !== undefined ? ` และ ≤${check.max}` : ""}</p>)}
          <p>รอบที่จบล่าสุด: {debugView?.lastCompleted ? `มุมสูงสุด ${debugView.lastCompleted.peak.toFixed(2)}° · ${debugView.lastCompleted.correct ? "ถูก" : "ไม่ถูก"} / เป้าหมาย ${definition.correctPeak.min}–${definition.correctPeak.max}°` : "ยังไม่มีรอบที่จบ ต้องเหยียดแล้วกลับครบก่อน"}</p>
          <p>Blockers: {debugView?.preparation?.blockers.join(" · ") || "ไม่มี"} · นับถอยหลัง {preparationView?.countdownRemaining ?? "—"}</p>
          <p>เกณฑ์รุ่น {definition.criteriaVersion} · เข่า {currentAngle?.toFixed(1) ?? "—"}° / เริ่ม {definition.start.min}–{definition.start.max}° · ออก ≥{definition.departureMin}° · กลับ {(definition.returned ?? definition.start).min}–{(definition.returned ?? definition.start).max}°</p>
          <p>ลำตัว {preparationView?.torso?.toFixed(1) ?? "—"}° / {definition.preparation?.torsoThigh.min}–{definition.preparation?.torsoThigh.max}° · visibility ≥{definition.minVisibility}</p>
          <p>สถานะ: {!debugView?.preparation?.locked ? "รอจัดท่า" : debugView.counter?.state} · ท่าเตรียมนิ่ง {Math.round(debugView?.preparation?.stableMs ?? 0)}/{debugView?.preparation?.requiredMs ?? 400} ms · รอบนิ่ง {Math.round(debugView?.counter?.stableMs ?? 0)}/{debugView?.counter?.requiredMs ?? definition.stableMs} ms</p>
          <p>ทิศทางข้างที่เลือก: {debugView?.preparation?.orientation ?? "ยังตรวจไม่ได้"} · ล็อกข้าง: {debugView?.preparation?.locked ? "ใช่" : "ยังไม่ยืนยัน"}</p>
          <p>เปรียบเทียบความลึก: {debugView?.preparation?.depth ?? "ไม่สามารถยืนยัน"} (ข้อมูลประกอบ ไม่บังคับผ่าน)</p>
          {definition.preparation?.singleSideOrientation && <p>ใช้ข้างที่เลือกเท่านั้น ไม่บังคับเห็นขาอีกข้าง · ค่า Δz เป็นข้อมูลประกอบ ไม่ใช้ยืนยันข้างใกล้กล้อง</p>}
          <p>heel→foot {debugView?.preparation?.direction.foot?.toFixed(3) ?? "—"} · hip→knee {debugView?.preparation?.direction.thigh?.toFixed(3) ?? "—"} / ≥{definition.preparation?.minDirection} · Δz hip {debugView?.preparation?.direction.hipDepth?.toFixed(3) ?? "—"} · Δz knee {debugView?.preparation?.direction.kneeDepth?.toFixed(3) ?? "—"} / &gt;{definition.preparation?.minDepthDelta}</p>
          <p>ท่าเตรียม: {debugView?.preparation?.reason ?? "รอข้อมูล"} · รอบ: {debugView?.counter?.reason ?? "รอข้อมูล"}</p>
          {debugView?.preparation?.postureAdvice && <p>คำแนะนำ: นั่งหลังตรงและวางต้นขาให้ได้ระดับ</p>}
          <p>{debugView?.preparation?.landmarks.map(point => `${landmarkLabel(point.index)}: ${Math.round(point.confidence * 100)}%`).join(" · ")}</p>
        </>}
      </section>}</>}
      {paused && <section className="pause-panel" aria-label="พักการฝึก"><h2>พักการฝึก</h2><DisplaySettings /></section>}</div>
      <div className="pose-primary-actions">
        <button className="command primary" disabled={busy || saveUncertain || !!summary || savedSets >= assignment.targetSets || (!running && (!approvalAvailable || (!simulation && (modelStatus !== "ready" || !camera)) || !side))} onClick={toggle}>{running ? <Pause size={22} /> : <Play size={22} />}{running ? "หยุด" : "เริ่ม"}</button>
        <button className="command primary" disabled={busy || !hasSlot || !!summary} onClick={save}><Save size={22} />{busy ? "กำลังดำเนินการ" : saveUncertain ? "ลองบันทึกอีกครั้ง" : "บันทึกเซต"}</button>
      </div>
      {demo && !cameraTest && <fieldset className="action-row demo-source" disabled={running || paused || hasSlot || busy || simulating || !!summary}><legend>แหล่งข้อมูล Demo</legend><label><input type="radio" name="demo-source" checked={!simulation} onChange={() => { setSimulation(false); simulated.current = false; }} />กล้องทดลอง</label><label><input type="radio" name="demo-source" checked={simulation} onChange={() => { setSimulation(true); simulated.current = true; }} />รอบจำลอง (ไม่ใช่ AI)</label></fieldset>}
        {demo && !cameraTest && simulation && <button className="command" disabled={!running || busy || simulating} onClick={simulate}><Play size={18} />{simulating ? "กำลังจำลองรอบ" : "รอบจำลอง"}</button>}
      </section>
    <dialog ref={confirmation} className="app-dialog" aria-labelledby="pose-discard-title" onCancel={() => setPendingDiscard(null)}><h2 id="pose-discard-title">{pendingDiscard === "exit" ? "ออกโดยไม่บันทึกเซต?" : "รีเซ็ตเซตนี้?"}</h2><p>ผลเซตที่ยังไม่บันทึกจะถูกทิ้ง ผลเซตที่บันทึกแล้วคงเดิม</p><div className="action-row"><button autoFocus className="command" onClick={() => setPendingDiscard(null)}>ยกเลิก</button><button className="command primary" onClick={() => { const exit = pendingDiscard === "exit"; setPendingDiscard(null); discard(exit, true); }}>ยืนยัน</button></div></dialog>
    <dialog ref={details} className="app-dialog" aria-labelledby="pose-details-title"><h2 id="pose-details-title">รายละเอียดท่า</h2><p>{assignment.exercise.name}</p><p>{assignment.instructions}</p><p>{assignment.exercise.tutorial}</p>{definition && <p>เริ่ม {definition.start.min}–{definition.start.max}° → ออกจากจุดเริ่มอย่างน้อย {definition.departureMin}° → กลับจุดเริ่มจึงนับ 1 ครั้ง · มุมสูงสุด {definition.correctPeak.min}–{definition.correctPeak.max}° จึงเข้าเกณฑ์{cameraTest ? "ทดสอบ" : ""}</p>}<button className="command" onClick={() => details.current?.close()}>ปิดรายละเอียด</button></dialog>
    <dialog ref={dialog} className="app-dialog" aria-labelledby="saved-set-title"><h2 id="saved-set-title">บันทึกเซตแล้ว</h2><p>{summary?.reps} / {assignment.targetReps} ครั้ง</p><p>มุมสูงสุด: {summary?.maxAngle?.toFixed(2) ?? "-"} องศา · เฉลี่ยมุมสูงสุด: {summary?.averageAngle?.toFixed(2) ?? "-"} องศา</p><p>{summary?.savedSets} / {assignment.targetSets} เซตที่บันทึก</p><div className="action-row">{savedSets < assignment.targetSets && <button className="command primary" onClick={() => { dialog.current?.close(); discard(false); }}>เซตถัดไป</button>}<Link className="command" href="/patient/exercises">ดูแผนวันนี้</Link><button className="command" onClick={() => dialog.current?.close()}>ปิด</button></div></dialog>
  </div>;
}
