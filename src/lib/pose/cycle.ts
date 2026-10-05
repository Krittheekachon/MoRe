import type { CompletedRep, PoseCriteria, PosePoint } from "./types";

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
  readonly repetitions: CompletedRep[] = [];
  constructor(private readonly criteria: PoseCriteria) {}
  interrupt() { this.phase = "unarmed"; this.stableSince = null; this.candidate = null; }
  reset() { this.interrupt(); this.repetitions.length = 0; this.previous = -Infinity; }
  sample(angle: number | null, at: number, confidence = 1): CompletedRep | null {
    if (!Number.isFinite(at) || at <= this.previous) return null;
    if (at - this.previous > this.criteria.maxGapMs) this.interrupt();
    this.previous = at;
    if (angle === null || !Number.isFinite(angle) || angle < 0 || angle > 180 || !Number.isFinite(confidence) || confidence < this.criteria.minVisibility) { this.interrupt(); return null; }
    const atStart = angle >= this.criteria.start.min && angle <= this.criteria.start.max;
    if (this.phase === "unarmed") {
      if (!atStart) { this.stableSince = null; return null; }
      this.stableSince ??= at;
      if (at - this.stableSince >= this.criteria.stableMs) { this.phase = "start"; this.baseline = angle; this.stableSince = null; }
      return null;
    }
    if (this.phase === "start") {
      if (atStart) { this.baseline = angle; this.stableSince = null; this.candidate = null; return null; }
      if (angle < this.criteria.departureMin) { this.stableSince = null; this.candidate = null; return null; }
      this.stableSince ??= at;
      this.candidate ??= { startedAt: at, completedAt: at, startAngle: this.baseline, peakAngle: angle, endAngle: angle, confidence };
      this.candidate.peakAngle = Math.max(this.candidate.peakAngle, angle);
      this.candidate.confidence = Math.min(this.candidate.confidence, confidence);
      if (at - this.stableSince >= this.criteria.stableMs) { this.phase = "away"; this.stableSince = null; }
      return null;
    }
    this.candidate!.peakAngle = Math.max(this.candidate!.peakAngle, angle);
    this.candidate!.confidence = Math.min(this.candidate!.confidence, confidence);
    if (!atStart) { this.stableSince = null; return null; }
    this.stableSince ??= at;
    if (at - this.stableSince < this.criteria.stableMs) return null;
    const rep = { ...this.candidate!, endAngle: angle, completedAt: at };
    this.repetitions.push(rep);
    this.phase = "start"; this.baseline = angle; this.candidate = null; this.stableSince = null;
    return rep;
  }
}
