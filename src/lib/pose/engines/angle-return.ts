import { jointAngle, pointConfidence, RepetitionCycle } from "../cycle";
import type { CompletedRep, PoseCriteria, PosePoint } from "../types";
import { AngleReturnFeedback } from "./angle-return-feedback";

export const angleReturnEngine = {
  createCounter: (criteria: PoseCriteria) => new RepetitionCycle(criteria),
  createFeedback: (criteria: PoseCriteria) => new AngleReturnFeedback(criteria),
  measure(points: PosePoint[], criteria: PoseCriteria, width: number, height: number) {
    return jointAngle(points, criteria, width, height);
  },
  confidence(points: PosePoint[], criteria: PoseCriteria) {
    return Math.min(...criteria.landmarks.map(index => pointConfidence(points[index])));
  },
  validCriteria(criteria: PoseCriteria) {
    if (criteria.stabilityGraceMs !== undefined && (!Number.isFinite(criteria.stabilityGraceMs) || criteria.stabilityGraceMs < 0 || criteria.stabilityGraceMs >= criteria.maxGapMs)) return false;
    if (criteria.stabilityEdgeTolerance !== undefined && (!Number.isFinite(criteria.stabilityEdgeTolerance) || criteria.stabilityEdgeTolerance < 0 || criteria.start.max + criteria.stabilityEdgeTolerance >= criteria.departureMin || (criteria.returned ?? criteria.start).max + criteria.stabilityEdgeTolerance >= criteria.departureMin)) return false;
    if (criteria.returned && (criteria.returned.min < 0 || criteria.returned.max > 180 || criteria.returned.min > criteria.returned.max || criteria.returned.max >= criteria.departureMin)) return false;
    return criteria.departureMin > criteria.start.max && criteria.start.min >= 0 && criteria.start.max < 180 && criteria.start.min <= criteria.start.max && criteria.correctPeak.min >= criteria.departureMin && criteria.correctPeak.max <= 180 && criteria.correctPeak.min <= criteria.correctPeak.max && criteria.stableMs > 0 && criteria.maxGapMs > criteria.stableMs && criteria.minVisibility > 0 && criteria.minVisibility <= 1;
  },
  complete(rep: CompletedRep, criteria: PoseCriteria) {
    const returned = criteria.returned ?? criteria.start;
    return rep.peakAngle >= criteria.departureMin && rep.peakAngle >= rep.startAngle && rep.peakAngle >= rep.endAngle && rep.startAngle >= criteria.start.min && rep.startAngle <= criteria.start.max && rep.endAngle >= returned.min && rep.endAngle <= returned.max && rep.confidence >= criteria.minVisibility;
  },
  correct(rep: CompletedRep, criteria: PoseCriteria) {
    return rep.peakAngle >= criteria.correctPeak.min && rep.peakAngle <= criteria.correctPeak.max;
  },
};
