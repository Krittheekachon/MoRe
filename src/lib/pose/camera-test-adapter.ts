import type { PoseCriteria, Side } from "./types";
import { bindExerciseCriteria } from "./exercise-definition";
import { cameraKneeExtension, legacyCameraKneeExtension, legacyV2CameraKneeExtension, legacyV3CameraKneeExtension, legacyV4CameraKneeExtension } from "./exercises/camera-knee-extension";
import { exerciseDefinitions } from "./exercises/registry";

// Software fixture only. Never register these values in approved-criteria.ts.
// The DB checkpoint ranges must match when changing this version.
const { start, departureMin, correctPeak, stableMs, maxGapMs, minVisibility } = cameraKneeExtension;
export const cameraTestThresholds = { start, departureMin, correctPeak, stableMs, maxGapMs, minVisibility };

// Normalize mock preparation snapshots opened before the single-side correction.
// Angle/version/checkpoint bindings and clinical definitions remain untouched.
export function refreshMockCameraPolicy(criteria: PoseCriteria): PoseCriteria {
  if (criteria.exerciseCode === "demo-knee-extension" && criteria.criteriaVersion === 5 && criteria.preparation) {
    const config = cameraKneeExtension.preparationBySide![criteria.preparation.side];
    if (criteria.preparation.maintainTorsoRange && criteria.preparation.torsoThigh.min === config.torsoThigh.min && criteria.preparation.torsoThigh.max === config.torsoThigh.max && criteria.preparation.seatedMaxThighTilt !== undefined) return criteria;
    return { ...criteria, preparation: { ...criteria.preparation, torsoThigh: { ...config.torsoThigh }, maintainTorsoRange: true, seatedMaxThighTilt: config.seatedMaxThighTilt } };
  }
  if (criteria.exerciseCode !== "demo-knee-extension" || ![3,4].includes(criteria.criteriaVersion) || !criteria.preparation || (criteria.preparation.singleSideOrientation === true && criteria.preparation.lockOrientation === true)) return criteria;
  return { ...criteria, preparation: { ...criteria.preparation, singleSideOrientation: true, lockOrientation: true } };
}
export function cameraCriteriaSignature(criteria: PoseCriteria): string {
  const ordered = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(ordered);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, ordered(item)]));
    return value;
  };
  return JSON.stringify(ordered(refreshMockCameraPolicy(criteria)));
}

export function cameraTestCriteria(exerciseCode: string, side: Side, metricId: number, checkpointIds: PoseCriteria["checkpointIds"], version = cameraKneeExtension.criteriaVersion): PoseCriteria {
  if (exerciseCode !== cameraKneeExtension.exerciseCode) throw new Error("Camera test adapter cannot configure a real exercise");
  if (![1, 2, 3, 4, cameraKneeExtension.criteriaVersion].includes(version)) throw new Error("Unsupported mock criteria version");
  return bindExerciseCriteria(version === 1 ? legacyCameraKneeExtension : version === 2 ? legacyV2CameraKneeExtension : version === 3 ? legacyV3CameraKneeExtension : version === 4 ? legacyV4CameraKneeExtension : exerciseDefinitions[exerciseCode], side, { metricId, checkpointIds });
}
