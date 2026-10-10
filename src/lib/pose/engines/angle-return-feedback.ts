import type { MovementSnapshot, PoseFeedback, PoseFeedbackStatus } from "../feedback-types";
import type { PoseCriteria } from "../types";

// Display-only state. Never modifies the counter or saved correctness.
export class AngleReturnFeedback implements PoseFeedback {
  private status: PoseFeedbackStatus = "ready";
  private pending: PoseFeedbackStatus | null = null;
  private since = 0;
  private previous = -Infinity;
  private completed: number | null = null;
  private reached = false;
  constructor(private readonly criteria: PoseCriteria) {}
  reset() { this.status = "ready"; this.pending = null; this.previous = -Infinity; this.completed = null; this.reached = false; }
  update(angle: number | null, at: number, confidence: number, movement: MovementSnapshot): PoseFeedbackStatus {
    if (angle === null || !Number.isFinite(angle) || !Number.isFinite(confidence) || confidence < this.criteria.minVisibility) {
      if (Number.isFinite(at) && at > this.previous) this.previous = at;
      this.pending = null;
      return "tracking-lost"; // Immediate highest priority; do not paint stale success.
    }
    if (!Number.isFinite(at) || at <= this.previous) return this.status;
    if (at - this.previous > this.criteria.maxGapMs) { this.pending = null; this.reached = false; }
    this.previous = at;
    this.completed ??= movement.completedReps;
    if (movement.completedReps !== this.completed) {
      this.completed = movement.completedReps; this.reached = false; this.pending = null;
      return this.status = "ready"; // Reset only when the engine finishes a rep.
    }
    if (movement.phase === "preparing" && this.reached) { this.reached = false; this.status = "ready"; }
    if (this.reached) return this.status = "target-reached";
    const atStart = angle >= this.criteria.start.min && angle <= this.criteria.start.max;
    const atTarget = angle >= this.criteria.correctPeak.min && angle <= this.criteria.correctPeak.max;
    const desired: PoseFeedbackStatus = movement.phase === "preparing"
      ? atStart ? "ready" : "invalid-start"
      : movement.phase === "moving" && atTarget ? "target-reached" : "ready";
    if (desired === this.status) { this.pending = null; return this.status; }
    if (this.pending !== desired) { this.pending = desired; this.since = at; }
    if (at - this.since >= this.criteria.stableMs) {
      this.status = desired; this.pending = null;
      if (desired === "target-reached") this.reached = true;
    }
    return this.status;
  }
}
