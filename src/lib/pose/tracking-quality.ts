import { pointConfidence } from "./cycle";
import { poseTrackingConfig as config } from "./tracking-config";
import type { PosePoint, PoseCriteria } from "./types";
import { refreshMockCameraPolicy } from "./camera-test-adapter";

// One time-adaptive EMA, shared by measurement/counting and rendering.
// Independent state for every landmark; x/y/z never share an accumulator.
export class PoseLandmarkSmoother {
  private previous = new Map<number, { at: number; point: PosePoint }>();
  reset() { this.previous.clear(); }
  update(points: PosePoint[], at: number, minConfidence = 0.6, imageCoordinates = true) {
    for (const index of this.previous.keys()) if (!points[index]) this.previous.delete(index);
    return points.map((point, index) => {
      const valid = Number.isFinite(at) && [point.x, point.y, point.z].every(Number.isFinite) && pointConfidence(point) >= minConfidence && (!imageCoordinates || (point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1));
      if (!valid) { this.previous.delete(index); return { ...point, visibility: 0 }; }
      const last = this.previous.get(index), gap = last ? at - last.at : 0;
      if (last && gap <= 0) return { ...point, visibility: 0 }; // Never consume stale samples.
      const blend = !last || gap > config.maxFrameGapMs ? 1 : 1 - Math.exp(-gap / config.landmarkSmoothingMs);
      const output = { ...point,
        x: last ? last.point.x + (point.x - last.point.x) * blend : point.x,
        y: last ? last.point.y + (point.y - last.point.y) * blend : point.y,
        z: last ? last.point.z + (point.z - last.point.z) * blend : point.z,
      };
      this.previous.set(index, { at, point: output }); return output;
    });
  }
}

export { PoseLandmarkSmoother as PoseDisplaySmoother }; // Compatibility, not a second filter.

// Reject discontinuities; never hold old points or manufacture angles for counting.
export class PoseTrackingQuality {
  private previous: { at: number; points: PosePoint[] } | null = null;
  private since: number | null = null;
  private key = "";
  reset() { this.previous = null; this.since = null; this.key = ""; }
  update(points: PosePoint[], criteria: PoseCriteria, at: number) {
    const key = `${criteria.exerciseCode}:${criteria.landmarks.join(",")}:${criteria.minVisibility}`;
    if (this.key !== key) { this.reset(); this.key = key; }
    // The far leg is commonly occluded in side-on seated views. It must not
    // invalidate the visible measurement chain or continually reset its EMA.
    // Optional direction/depth landmarks are checked separately by preparation.
    const preparation = refreshMockCameraPolicy(criteria).preparation;
    const indices = preparation && !preparation.postureGuidanceOnly && !preparation.singleSideOrientation ? [...new Set([...criteria.landmarks, preparation.shoulder])] : criteria.landmarks;
    const selected = indices.map(index => points[index]);
    if (!Number.isFinite(at) || selected.some(point => !point || ![point.x, point.y, point.z].every(Number.isFinite) || point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1 || pointConfidence(point) < criteria.minVisibility)) {
      this.previous = null; this.since = null; return false;
    }
    const last = this.previous;
    const gap = last ? at - last.at : 0;
    if (last && gap <= 0) { this.previous = null; this.since = null; return false; }
    const hip = points[criteria.landmarks[0]], knee = points[criteria.landmarks[1]];
    const bodyScale = Math.max(config.minBodyScale, Math.min(config.maxBodyScale, Math.hypot(hip.x - knee.x, hip.y - knee.y) / config.referenceSegmentLength));
    const jumped = last && selected.some((point, index) => Math.hypot(point.x - last.points[index].x, point.y - last.points[index].y) > bodyScale * (config.jumpAllowance + config.maxNormalizedSpeed * gap / 1000));
    if (!last || gap > config.maxFrameGapMs || jumped) this.since = at;
    this.previous = { at, points: selected.map(point => ({ ...point })) };
    return at - (this.since ?? at) >= config.acquireMs;
  }
}
