import type { ExerciseDefinition } from "../exercise-definition";

// Engineering fixture only; independent of the teammate's real exercise.
// Keep DB checkpoint ranges/versions synchronized when editing thresholds.
export const legacyV2CameraKneeExtension: ExerciseDefinition = {
  exerciseCode: "demo-knee-extension", engine: "angle-return",
  definitionVersion: 1, criteriaVersion: 2,
  landmarksBySide: { left: [23, 25, 27], right: [24, 26, 28] },
  coordinates: "image-2d",
  start: { min: 75, max: 105 }, departureMin: 120,
  correctPeak: { min: 160, max: 170 }, stableMs: 200,
  maxGapMs: 1000, minVisibility: 0.6,
};
// Preserve the legacy Demo definition; never rewrite old checkpoint/results.
export const legacyCameraKneeExtension: ExerciseDefinition = { ...legacyV2CameraKneeExtension, criteriaVersion: 1, correctPeak: { min: 140, max: 180 } };
const preparation = {
  torsoThigh: { min: 80, max: 100 }, maxThighTilt: 15, maxTorsoTilt: 15,
  minDirection: 0.015, minDepthDelta: 0.015, maxSideWidth: 0.18, maxHipDrift: 0.025,
  stableMs: 400, guidanceStableMs: 250,
};
export const legacyV3CameraKneeExtension: ExerciseDefinition = {
  ...legacyV2CameraKneeExtension, criteriaVersion: 3,
  start: { min: 80, max: 90 }, returned: { min: 80, max: 92 }, departureMin: 110,
  preparationBySide: {
    left: { ...preparation, side: "left", shoulder: 11, heel: 29, foot: 31, oppositeHip: 24, oppositeKnee: 26, facingSign: 1 },
    right: { ...preparation, side: "right", shoulder: 12, heel: 30, foot: 32, oppositeHip: 23, oppositeKnee: 25, facingSign: -1 },
  },
};
export const legacyV4CameraKneeExtension: ExerciseDefinition = {
  ...legacyV3CameraKneeExtension, criteriaVersion: 4,
  start: { min: 75, max: 105 }, returned: { min: 75, max: 108 }, departureMin: 125,
  stabilityGraceMs: 250, stabilityEdgeTolerance: 3,
  preparationBySide: {
    left: { ...legacyV3CameraKneeExtension.preparationBySide!.left, torsoThigh: { min: 70, max: 110 }, postureGuidanceOnly: true, singleSideOrientation: true, lockOrientation: true, graceMs: 250, edgeTolerance: 3 },
    right: { ...legacyV3CameraKneeExtension.preparationBySide!.right, torsoThigh: { min: 70, max: 110 }, postureGuidanceOnly: true, singleSideOrientation: true, lockOrientation: true, graceMs: 250, edgeTolerance: 3 },
  },
};
// Wider preparation fixture for camera feedback testing; not clinical criteria.
// seatedMaxThighTilt is positioning guidance only, not readiness permission.
export const cameraKneeExtension: ExerciseDefinition = {
  ...legacyV4CameraKneeExtension, criteriaVersion: 5,
  start: { min: 60, max: 115 }, returned: { min: 60, max: 118 },
  preparationBySide: {
    left: { ...legacyV4CameraKneeExtension.preparationBySide!.left, torsoThigh: { min: 90, max: 110 }, maintainTorsoRange: true, seatedMaxThighTilt: 35 },
    right: { ...legacyV4CameraKneeExtension.preparationBySide!.right, torsoThigh: { min: 90, max: 110 }, maintainTorsoRange: true, seatedMaxThighTilt: 35 },
  },
};
