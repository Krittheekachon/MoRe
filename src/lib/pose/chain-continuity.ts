import { pointConfidence } from "./cycle";
import type { PoseCriteria, PosePoint } from "./types";
import { chainTrackingConfig as config } from "./tracking-config";

type Sample = { at: number; key: string; points: PosePoint[]; lengths: number[]; opposite: PosePoint[] | null; foot: number[] | null };
// Image coordinates corrected for source aspect ratio, normalized to image height.
// This checks continuity, not anatomical identity or medical accuracy.
export class PoseChainContinuity {
  private baseline: Sample | null = null;
  private previous: Sample | null = null;
  private candidate: Sample | null = null;
  private stableSince: number | null = null;
  private reacquireSince: number | null = null;
  reason = "unconfirmed";
  reset() { this.baseline = this.previous = this.candidate = null; this.stableSince = this.reacquireSince = null; this.reason = "unconfirmed"; }
  private sample(points: PosePoint[], criteria: PoseCriteria, width: number, height: number, at: number): Sample | null {
    const ids = criteria.landmarks;
    const valid = (id: number) => { const p = points[id]; return !!p && [p.x,p.y,p.z].every(Number.isFinite) && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1 && pointConfidence(p) >= criteria.minVisibility; };
    if (!Number.isFinite(at) || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 || !ids.every(valid) || (criteria.preparation && !valid(criteria.preparation.shoulder))) return null;
    const map = (id: number) => ({ ...points[id], x: points[id].x * width / height });
    const selected = ids.map(map);
    const length = (a: PosePoint, b: PosePoint) => Math.hypot(a.x-b.x, a.y-b.y);
    const lengths = [length(selected[0],selected[1]), length(selected[1],selected[2])];
    if (lengths.some(v => v <= 0.001)) return null;
    const other = ids.map(id => id % 2 === 1 ? id + 1 : id - 1);
    const footIds = criteria.preparation ? [criteria.preparation.heel, criteria.preparation.foot] : [];
    // Optional evidence, never a visibility gate or a fabricated ankle.
    const foot = footIds.length === 2 && footIds.every(valid) ? [length(selected[2],map(footIds[0])), length(selected[2],map(footIds[1])), length(map(footIds[0]),map(footIds[1]))].map(v => v / lengths[1]) : null;
    return { foot, at, key: ids.join(",") + `:${width}/${height}`, points: selected, lengths, opposite: other.every(valid) ? other.map(map) : null };
  }
  get canConfirm() { return !!this.candidate && this.stableSince !== null && this.candidate.at - this.stableSince >= config.confirmStableMs; }
  confirm(at: number) {
    if (!this.canConfirm || !this.candidate || at-this.candidate.at > config.maxGapMs || at < this.candidate.at) return false;
    this.baseline = this.candidate; this.previous = this.candidate; this.reacquireSince = null; this.reason = "accepted"; return true;
  }
  private footConflict(current: Sample, reference: Sample) {
    return !!reference.foot && !!current.foot && current.foot.some((v,i) => Math.abs(v-reference.foot![i]) > config.footGeometryAllowance + reference.foot![i]*config.footGeometryTolerance);
  }
  private discontinuity(current: Sample, last: Sample) {
    if (this.footConflict(current,last)) return "ankle-geometry";
    const scale = Math.min(...(this.baseline ?? last).lengths);
    const dt = Math.max(0, current.at-last.at)/1000;
    const distance = (a: PosePoint,b: PosePoint) => Math.hypot(a.x-b.x,a.y-b.y);
    if (current.lengths.some((v,i) => Math.abs(v/last.lengths[i]-1) > config.frameLengthAllowance + config.frameLengthSpeed*dt)) return "segment-change";
    if (distance(current.points[0],last.points[0]) > scale*(config.hipAllowance + config.hipSpeed*dt)) return "hip-jump";
    if (current.points.some((p,i)=>distance(p,last.points[i]) > (this.baseline ?? last).lengths[i === 2 ? 1 : 0]*(config.pointAllowance + config.pointSpeed*dt))) return "point-jump";
    // Evidence only when the previously visible opposite chain is distinct.
    if (last.opposite) {
      const mean = (a: PosePoint[],b: PosePoint[]) => a.reduce((s,p,i)=>s+distance(p,b[i]),0)/a.length;
      const separation = mean(last.points,last.opposite);
      if (separation > scale*config.swapSeparation && mean(current.points,last.opposite) < mean(current.points,last.points)*config.swapRatio && mean(current.points,last.points) > scale*config.swapMovement) return "possible-side-swap";
    }
    return "";
  }
  update(points: PosePoint[], criteria: PoseCriteria, width: number, height: number, at: number) {
    const current = this.sample(points,criteria,width,height,at);
    if (!current) { this.candidate = null; this.stableSince = null; this.previous = null; this.reacquireSince = null; this.reason = "quality"; return false; }
    if (!this.baseline) {
      const last = this.candidate;
      if (!last || last.key !== current.key || current.at <= last.at || current.at-last.at > config.maxGapMs || this.discontinuity(current,last)) this.stableSince = at;
      this.candidate = current; this.reason = "unconfirmed"; return true; // Preview only; caller forbids counting.
    }
    if (this.baseline.key !== current.key) { this.reset(); this.reason = "camera-or-side-changed"; return false; }
    // Both auxiliaries must be trustworthy now AND at manual confirmation.
    // Rotating the foot changes its projected shape; allow absolute + relative
    // change. A contradiction identifies suspect geometry, not its clothing cause.
    const footConflict = this.footConflict(current,this.baseline);
    let problem = footConflict ? "ankle-geometry" : "";
    problem ||= current.lengths.some((v,i)=>Math.abs(v/this.baseline!.lengths[i]-1)>config.baselineLengthTolerance) ? "baseline-length" : "";
    const last = this.previous;
    if (last && current.at <= last.at) problem = "stale";
    else if (last && current.at-last.at <= config.maxGapMs) problem ||= this.discontinuity(current,last);
    if (problem) { this.reason = problem; this.reacquireSince = null; return false; } // Never learn rejected points.
    if (!last || at-last.at > config.maxGapMs || this.reason !== "accepted") {
      this.reacquireSince ??= at;
      // Keep baseline fixed; accept only current consistent samples for acquisition.
      if (last && this.discontinuity(current,last)) this.reacquireSince = at;
      this.previous = current;
      if (at-this.reacquireSince < config.reacquireMs) { this.reason = "reacquiring"; return false; }
    }
    this.previous = current; this.reason = "accepted"; return true;
  }
}
