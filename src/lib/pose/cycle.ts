import type { CompletedRep, PoseCriteria, PosePoint } from "./types";
import type { MovementSnapshot } from "./feedback-types";
import { StableWindow } from "./stable-window";

export function pointConfidence(point: PosePoint | undefined) {
  if (!point || !Number.isFinite(point.visibility)) return 0;
  // Tasks Vision 1.0.1 exposes visibility, not per-landmark presence.
  return Math.min(point.visibility!, point.presence === undefined ? point.visibility! : Number.isFinite(point.presence) ? point.presence : 0);
}

export function jointAngle(points: PosePoint[], criteria: PoseCriteria, width: number, height: number): number | null {
  const selected = criteria.landmarks.map(index => points[index]);
  if (selected.some(point => !point || ![point.x, point.y, point.z].every(Number.isFinite) ||
    pointConfidence(point) < criteria.minVisibility)) return null;
  const [a, b, c] = selected;
  const scaleX = criteria.coordinates === "image-2d" ? width : 1;
  const scaleY = criteria.coordinates === "image-2d" ? height : 1;
  const scaleZ = criteria.coordinates === "image-2d" ? 0 : 1;
  const u = [(a.x - b.x) * scaleX, (a.y - b.y) * scaleY, (a.z - b.z) * scaleZ];
  const v = [(c.x - b.x) * scaleX, (c.y - b.y) * scaleY, (c.z - b.z) * scaleZ];
  const norm = Math.hypot(...u) * Math.hypot(...v);
  if (!norm || !Number.isFinite(norm)) return null;
  return Math.acos(Math.max(-1, Math.min(1, u.reduce((sum, value, i) => sum + value * v[i], 0) / norm))) * 180 / Math.PI;
}

// Every interruption invalidates only the unfinished cycle, never completed reps.
export class RepetitionCycle {
  private phase: "unarmed" | "start" | "away" = "unarmed";
  private stableSince: number | null = null;
  private previous = -Infinity;
  private baseline = 0;
  private candidate: CompletedRep | null = null;
  private stability = new StableWindow();
  private reason = "รอยืนยันจุดเริ่มต้น";
  readonly repetitions: CompletedRep[] = [];
  constructor(private readonly criteria: PoseCriteria) {}
  get movement(): MovementSnapshot {
    return { phase: this.phase === "unarmed" ? "preparing" : this.phase === "away" || this.candidate ? "moving" : "ready", completedReps: this.repetitions.length };
  }
  get debug() { return { state: this.phase === "unarmed" ? "รอจุดเริ่มต้น" : this.phase === "away" ? "รอกลับ" : "รอเหยียดออก", stableMs: this.stability.elapsed, requiredMs: this.criteria.stableMs, reason: this.reason }; }
  private clearStability() { this.stableSince = null; this.stability.reset(); }
  private stable(at: number) { if (this.criteria.stabilityGraceMs) return this.stability.pass(at, this.criteria.stabilityGraceMs) >= this.criteria.stableMs; this.stableSince ??= at; return at - this.stableSince >= this.criteria.stableMs; }
  interrupt() { this.phase = "unarmed"; this.clearStability(); this.candidate = null; this.reason = "รอบที่ยังไม่จบถูกยกเลิก ต้องยืนยันจุดเริ่มต้นใหม่"; }
  suspend(at = this.previous) {
    if (this.criteria.stabilityGraceMs) { const expired = this.stability.fail(at, this.criteria.stabilityGraceMs); if (expired && this.phase === "start") this.candidate = null; this.reason = "ระงับเฟรมที่ไม่ผ่าน ไม่สะสมเวลาความนิ่ง"; }
    else { this.clearStability(); if (this.phase === "start") this.candidate = null; }
  }
  reset() { this.interrupt(); this.repetitions.length = 0; this.previous = -Infinity; }
  sample(angle: number | null, at: number, confidence = 1): CompletedRep | null {
    if (!Number.isFinite(at) || at <= this.previous) return null;
    if (at - this.previous > this.criteria.maxGapMs) this.interrupt();
    this.previous = at;
    if (angle === null || !Number.isFinite(angle) || angle < 0 || angle > 180 || !Number.isFinite(confidence) || confidence < this.criteria.minVisibility) { this.interrupt(); return null; }
    if (this.phase === "start" && this.criteria.stabilityGraceMs && this.stability.expired(at, this.criteria.stabilityGraceMs)) { this.candidate = null; this.clearStability(); }
    const atStart = angle >= this.criteria.start.min && angle <= this.criteria.start.max;
    if (this.phase === "unarmed") {
      if (!atStart) { this.edgeFailure(angle, this.criteria.start, at); this.reason = "เข่ายังไม่อยู่ช่วงเริ่มต้น"; return null; }
      this.reason = "กำลังยืนยันจุดเริ่มต้น";
      if (this.stable(at)) { this.phase = "start"; this.baseline = angle; this.clearStability(); this.reason = "พร้อม รอเหยียดออก"; }
      return null;
    }
    if (this.phase === "start") {
      if (atStart) { this.baseline = angle; this.clearStability(); this.candidate = null; this.reason = "พร้อม รอเหยียดออก"; return null; }
      if (angle < this.criteria.departureMin) {
        if (this.criteria.stabilityGraceMs && angle >= this.criteria.departureMin - (this.criteria.stabilityEdgeTolerance ?? 0)) this.suspend(at);
        else { this.clearStability(); this.candidate = null; }
        this.reason = "ยังเหยียดไม่ถึงเกณฑ์ออก หรือยังไม่นิ่ง"; return null;
      }
      this.candidate ??= { startedAt: at, completedAt: at, startAngle: this.baseline, peakAngle: angle, endAngle: angle, confidence };
      this.candidate.peakAngle = Math.max(this.candidate.peakAngle, angle);
      this.candidate.confidence = Math.min(this.candidate.confidence, confidence);
      if (this.stable(at)) { this.phase = "away"; this.clearStability(); this.reason = "เหยียดออกแล้ว รอกลับ"; }
      return null;
    }
    this.candidate!.peakAngle = Math.max(this.candidate!.peakAngle, angle);
    this.candidate!.confidence = Math.min(this.candidate!.confidence, confidence);
    const returned = this.criteria.returned ?? this.criteria.start;
    if (angle < returned.min || angle > returned.max) { this.edgeFailure(angle, returned, at); this.reason = "ยังไม่กลับช่วงกลับ"; return null; }
    this.reason = "กลับถึงช่วงแล้ว รอยืนยันความนิ่ง";
    if (!this.stable(at)) return null;
    const rep = { ...this.candidate!, endAngle: angle, completedAt: at };
    this.repetitions.push(rep);
    this.phase = atStart ? "start" : "unarmed"; this.baseline = angle; this.candidate = null; this.clearStability(); this.reason = "จบรอบ นับหนึ่งครั้ง";
    return rep;
  }
  private edgeFailure(angle: number, range: { min: number; max: number }, at: number) {
    const tolerance = this.criteria.stabilityEdgeTolerance ?? 0;
    if (this.criteria.stabilityGraceMs && angle >= range.min - tolerance && angle <= range.max + tolerance) this.suspend(at);
    else this.clearStability();
  }
}
