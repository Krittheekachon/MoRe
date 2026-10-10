// Timestamp-based evidence. Invalid intervals never contribute to elapsed time.
export class StableWindow {
  elapsed = 0;
  private previous: number | null = null;
  private badSince: number | null = null;
  reset() { this.elapsed = 0; this.previous = null; this.badSince = null; }
  expired(at: number, graceMs: number) { return this.badSince !== null && at - this.badSince >= graceMs; }
  pass(at: number, graceMs = 0) {
    if (this.expired(at, graceMs)) this.elapsed = 0;
    if (this.previous !== null && at > this.previous && this.badSince === null) this.elapsed += at - this.previous;
    this.previous = at; this.badSince = null; return this.elapsed;
  }
  fail(at: number, graceMs: number) {
    this.previous = null; this.badSince ??= at;
    const expired = !Number.isFinite(at) || graceMs <= 0 || at - this.badSince >= graceMs;
    if (expired) this.elapsed = 0;
    return expired;
  }
}
