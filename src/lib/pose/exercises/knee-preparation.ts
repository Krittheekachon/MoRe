import { jointAngle, pointConfidence } from "../cycle";
import type { PoseCriteria, PosePoint } from "../types";
import type { MovementSnapshot } from "../feedback-types";
import { StableWindow } from "../stable-window";
import { refreshMockCameraPolicy } from "../camera-test-adapter";

export type PreparationResult = { allowed: boolean; interrupt: boolean; message: string; knee: number | null; torso: number | null; ready: boolean; countdownRemaining?: number };
export type PreparationDebug = { checks: { name: string; passed: boolean; value: number | null; min?: number; max?: number }[]; blockers: string[]; stableMs: number; requiredMs: number; orientation: string; depth: string; locked: boolean; postureAdvice: boolean; reason: string; direction: { foot: number | null; thigh: number | null; hipDepth: number | null; kneeDepth: number | null }; landmarks: { index: number; confidence: number }[] };

// Camera mock only: posture gate wraps the existing counter, never counts reps.
export class KneePreparation {
  private stableSince: number | null = null;
  private badSince: number | null = null;
  private hip: PosePoint | null = null;
  private previous = -Infinity;
  private phase = "preparing";
  private returning = false;
  private completed = 0;
  private stability = new StableWindow();
  private orientationLocked = false;
  debug: PreparationDebug | null = null;
  private message = "ให้กล้องเห็นสะโพก เข่า และข้อเท้าข้างที่ฝึก";
  private pending = ""; private pendingSince = 0;
  reset() { this.stability.reset(); this.orientationLocked = false; this.debug = null; this.stableSince = null; this.badSince = null; this.hip = null; this.previous = -Infinity; this.phase = "preparing"; this.returning = false; this.completed = 0; this.pending = ""; this.message = "ให้กล้องเห็นสะโพก เข่า และข้อเท้าข้างที่ฝึก"; }
  update(points: PosePoint[], criteria: PoseCriteria, width: number, height: number, at: number, trusted: boolean, movement: MovementSnapshot): PreparationResult {
    const config = refreshMockCameraPolicy(criteria).preparation;
    if (!config) return { allowed: trusted, interrupt: !trusted, message: "", knee: null, torso: null, ready: trusted };
    if (Number.isFinite(this.previous) && at - this.previous > criteria.maxGapMs) { this.reset(); return { allowed: false, interrupt: true, message: this.message, knee: null, torso: null, ready: false }; }
    if (movement.phase === "preparing" && this.phase !== "preparing") { this.stableSince = null; this.hip = null; this.orientationLocked = false; this.stability.reset(); }
    this.phase = movement.phase;
    if (movement.phase === "preparing" || movement.completedReps !== this.completed) this.returning = false;
    this.completed = movement.completedReps;
    const [hipIndex, kneeIndex, ankleIndex] = criteria.landmarks;
    const focus = config.postureGuidanceOnly || config.singleSideOrientation ? [hipIndex, kneeIndex, ankleIndex] : [config.shoulder, hipIndex, kneeIndex, ankleIndex];
    const visible = (index: number) => { const p = points[index]; return !!p && [p.x,p.y,p.z].every(Number.isFinite) && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1 && pointConfidence(p) >= criteria.minVisibility; };
    const reliable = trusted && focus.every(visible) && criteria.coordinates === "image-2d" && width > 0 && height > 0;
    const knee = reliable ? jointAngle(points, criteria, width, height) : null;
    const torso = reliable && visible(config.shoulder) ? jointAngle(points, { ...criteria, landmarks: [config.shoulder, hipIndex, kneeIndex] }, width, height) : null;
    const torsoFailed = !!config.maintainTorsoRange && (torso === null || torso < config.torsoThigh.min || torso > config.torsoThigh.max);
    let problem = "";
    let orientationProblem = ""; let postureAdvice = false;
    if (!reliable || !trusted || knee === null) problem = "ให้กล้องเห็นสะโพก เข่า และข้อเท้าข้างที่ฝึก";
    else if (torsoFailed) problem = `ปรับท่านั่งให้มุมลำตัว–ต้นขาอยู่ที่ ${config.torsoThigh.min}–${config.torsoThigh.max}°`;
    else if (!this.orientationLocked && torso === null) problem = "ให้กล้องเห็นหัวไหล่ข้างที่ฝึกเพื่อวัดลำตัว–ต้นขา";
    else {
      const hip = points[hipIndex], leg = points[kneeIndex], shoulder = points[config.shoulder];
      const feetVisible = visible(config.heel) && visible(config.foot);
      const footDirection = feetVisible ? (points[config.foot].x - points[config.heel].x) * config.facingSign : null;
      const thighDirection = (leg.x - hip.x) * config.facingSign;
      if (config.lockOrientation && this.orientationLocked) { /* Selected-side tracking remains fixed until interruption. */ }
      else if (config.singleSideOrientation) {
        // Side-on occlusion is expected. Never require the other leg or infer
        // near/far depth from invisible joints. Use the selected chain only.
        // Anatomical left/right does not determine image-facing direction.
        // Heel/toe detections are auxiliary and must not veto a clear chain.
        if (Math.abs(thighDirection) < config.minDirection) problem = "หันข้างที่ฝึกเข้าหากล้อง";
      }
      else if (!feetVisible) problem = "ให้กล้องเห็นส้นเท้าและปลายเท้าของข้างที่ฝึก";
      else if (!visible(config.oppositeHip) || !visible(config.oppositeKnee)) problem = "หันข้างที่ฝึกเข้าหากล้อง";
      else {
        const hipDepth = points[config.oppositeHip].z - hip.z;
        const kneeDepth = points[config.oppositeKnee].z - leg.z;
        if (Math.abs(hip.x - points[config.oppositeHip].x) > config.maxSideWidth || Math.abs(hipDepth) < config.minDepthDelta || Math.abs(kneeDepth) < config.minDepthDelta) problem = "กรุณาหันข้างให้กล้อง";
        else if (hipDepth < -config.minDepthDelta && kneeDepth < -config.minDepthDelta) problem = `กรุณาหันขา${config.side === "right" ? "ขวา" : "ซ้าย"}เข้าหากล้อง`;
        else if (hipDepth <= config.minDepthDelta || kneeDepth <= config.minDepthDelta || footDirection! < config.minDirection || thighDirection < config.minDirection) problem = "กรุณาหันข้างให้กล้อง";
      }
      orientationProblem = problem;
      const thighTilt = Math.atan2(Math.abs((leg.y - hip.y) * height), Math.abs((leg.x - hip.x) * width)) * 180 / Math.PI;
      const torsoTilt = visible(config.shoulder) ? Math.atan2(Math.abs((shoulder.x - hip.x) * width), Math.abs((shoulder.y - hip.y) * height)) * 180 / Math.PI : Infinity;
      postureAdvice = !visible(config.shoulder) || shoulder.y >= hip.y || thighTilt > (config.seatedMaxThighTilt ?? config.maxThighTilt) || torsoTilt > config.maxTorsoTilt;
      if (!problem && !(config.lockOrientation && this.orientationLocked) && (torso === null || torso < config.torsoThigh.min || torso > config.torsoThigh.max || (!config.postureGuidanceOnly && postureAdvice))) problem = "นั่งหลังตรงและวางต้นขาให้ได้ระดับ";
      this.hip ??= { ...hip };
      if (config.postureGuidanceOnly && Math.hypot(hip.x - this.hip.x, hip.y - this.hip.y) > config.maxHipDrift) postureAdvice = true;
      if (!problem && !config.postureGuidanceOnly && Math.hypot(hip.x - this.hip.x, hip.y - this.hip.y) > config.maxHipDrift) problem = "นั่งหลังตรงและวางต้นขาให้ได้ระดับ";
      if (!problem && movement.phase === "preparing" && (knee < criteria.start.min || knee > criteria.start.max)) problem = "งอเข่ากลับสู่ท่าเริ่มต้น";
    }
    const timeValid = Number.isFinite(at) && at > this.previous;
    if (!timeValid) { this.stableSince = null; this.hip = null; }
    if (timeValid) this.previous = at;
    let depth = "ไม่สามารถยืนยัน";
    if ([hipIndex,kneeIndex,config.oppositeHip,config.oppositeKnee].every(visible)) {
      const hipDelta = points[config.oppositeHip].z - points[hipIndex].z, kneeDelta = points[config.oppositeKnee].z - points[kneeIndex].z;
      if (hipDelta > config.minDepthDelta && kneeDelta > config.minDepthDelta) depth = "ข้อมูลเฟรมนี้ชี้ว่าข้างที่เลือกใกล้กว่า";
      else if (hipDelta < -config.minDepthDelta && kneeDelta < -config.minDepthDelta) depth = "ข้อมูลเฟรมนี้ชี้ว่าอีกข้างใกล้กว่า";
    }
    const checks: PreparationDebug["checks"] = [
      { name: "คุณภาพ hip–knee–ankle / acquisition", passed: reliable && knee !== null, value: null },
      { name: "มุมเข่าเริ่มต้น", passed: movement.phase !== "preparing" || (knee !== null && knee >= criteria.start.min && knee <= criteria.start.max), value: knee, min: criteria.start.min, max: criteria.start.max },
      { name: "มุมลำตัว–ต้นขา", passed: (!config.maintainTorsoRange && this.orientationLocked) || (torso !== null && torso >= config.torsoThigh.min && torso <= config.torsoThigh.max), value: torso, min: config.torsoThigh.min, max: config.torsoThigh.max },
      { name: "ทิศทางข้างที่เลือก", passed: this.orientationLocked || (reliable && (config.singleSideOrientation ? Math.abs((points[kneeIndex].x - points[hipIndex].x) * config.facingSign) >= config.minDirection : !orientationProblem)), value: reliable ? Math.abs(points[kneeIndex].x - points[hipIndex].x) : null, min: config.minDirection },
      { name: "timestamp", passed: timeValid, value: at },
    ];
    this.debug = { checks, blockers: checks.filter(check => !check.passed).map(check => check.name), stableMs: this.stability.elapsed, requiredMs: config.stableMs, orientation: this.orientationLocked ? "ยืนยันทิศทางแล้ว ล็อกข้างที่เลือก" : orientationProblem || (!reliable ? "ยังตรวจไม่ได้" : config.singleSideOrientation ? "ทิศข้างที่เลือกผ่าน" : "ทิศทาง/ความลึกผ่านเฟรมนี้"), depth, locked: this.orientationLocked, postureAdvice, reason: problem,
      direction: {
        foot: visible(config.heel) && visible(config.foot) ? (points[config.foot].x - points[config.heel].x) * config.facingSign : null,
        thigh: visible(hipIndex) && visible(kneeIndex) ? (points[kneeIndex].x - points[hipIndex].x) * config.facingSign : null,
        hipDepth: visible(hipIndex) && visible(config.oppositeHip) ? points[config.oppositeHip].z - points[hipIndex].z : null,
        kneeDepth: visible(kneeIndex) && visible(config.oppositeKnee) ? points[config.oppositeKnee].z - points[kneeIndex].z : null,
      }, landmarks: [...new Set([config.shoulder,hipIndex,kneeIndex,ankleIndex,config.heel,config.foot,config.oppositeHip,config.oppositeKnee])].map(index => ({ index, confidence: pointConfidence(points[index]) })) };
    if (problem || !timeValid) {
      if (problem && !this.debug.blockers.includes(problem)) this.debug.blockers.push(problem);
      const tolerance = config.edgeTolerance ?? 0;
      const nearKnee = knee !== null && knee >= criteria.start.min - tolerance && knee <= criteria.start.max + tolerance;
      const nearTorso = torso !== null && torso >= config.torsoThigh.min - tolerance && torso <= config.torsoThigh.max + tolerance;
      const grace = !torsoFailed && reliable && !orientationProblem && nearKnee && nearTorso ? config.graceMs ?? 0 : 0;
      this.stability.fail(at, grace); this.debug.stableMs = this.stability.elapsed;
      this.stableSince = null; this.badSince ??= at;
      const interrupt = torsoFailed || !timeValid || at - this.badSince >= criteria.maxGapMs;
      if (interrupt || movement.phase === "preparing") this.hip = null;
      if (interrupt) { this.orientationLocked = false; this.stability.reset(); this.debug.locked = false; this.debug.reason = "tracking/ท่าไม่ผ่านนานเกินกำหนด ยกเลิกรอบที่ยังไม่จบ"; }
      return { allowed: false, interrupt, message: this.guidance(problem || "ให้กล้องเห็นสะโพก เข่า และข้อเท้าข้างที่ฝึก", at, config.guidanceStableMs, !reliable || torsoFailed), knee, torso, ready: false };
    }
    this.badSince = null; this.stableSince ??= at;
    const stableElapsed = config.graceMs ? this.stability.pass(at, config.graceMs) : at - this.stableSince;
    const ready = movement.phase !== "preparing" || stableElapsed >= config.stableMs;
    if (!ready) this.debug.blockers.push("รอความนิ่งท่าเตรียม");
    if (ready && config.lockOrientation) this.orientationLocked = true;
    this.debug.stableMs = Math.min(stableElapsed, config.stableMs); this.debug.locked = this.orientationLocked; this.debug.reason = ready ? "ท่าเตรียมผ่าน" : "กำลังสะสมเฉพาะเวลาที่ข้อมูลผ่าน";
    if (movement.phase === "moving" && knee! >= criteria.correctPeak.min) this.returning = true;
    const message = !ready ? "รอท่าเตรียมนิ่ง" : movement.phase !== "moving" ? "ท่าเตรียมผ่าน · พร้อมเริ่ม" : this.returning ? "ค่อย ๆ กลับสู่ท่าเริ่มต้น" : "ค่อย ๆ เหยียดขา";
    return { allowed: ready, interrupt: false, message: this.guidance(message, at, config.guidanceStableMs, false), knee, torso, ready };
  }
  private guidance(message: string, at: number, stableMs: number, immediate: boolean) {
    if (immediate) { this.message = message; this.pending = ""; return message; }
    if (this.message === message) { this.pending = ""; return this.message; }
    if (this.pending !== message) { this.pending = message; this.pendingSince = at; }
    if (at - this.pendingSince >= stableMs) { this.message = message; this.pending = ""; }
    return this.message;
  }
}
