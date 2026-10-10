// Runtime-only start gate. Uses accepted frame timestamps, never stale poses.
export class PreparationCountdown {
  private started: number | null = null;
  private previous = -Infinity;
  private finished = false;
  constructor(readonly durationMs = 5000) {}
  reset() { this.started = null; this.previous = -Infinity; this.finished = false; }
  update(ready: boolean, at: number, maxGapMs: number) {
    if (this.finished) return { allowed: true, remaining: null };
    if (!ready || !Number.isFinite(at) || at <= this.previous || at - this.previous > maxGapMs) this.started = null;
    const valid = ready && Number.isFinite(at) && at > this.previous;
    this.previous = at;
    if (!valid) return { allowed: false, remaining: null };
    this.started ??= at;
    const remaining = Math.ceil((this.durationMs - (at - this.started)) / 1000);
    if (remaining <= 0) { this.finished = true; return { allowed: true, remaining: null }; }
    return { allowed: false, remaining };
  }
}
