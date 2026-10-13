// Engineering tracking filters, independent of clinical exercise angles/versions.
export const poseTrackingConfig = {
  minPoseDetectionConfidence: 0.65,
  minPosePresenceConfidence: 0.65,
  minTrackingConfidence: 0.65,
  acquireMs: 300,
  maxFrameGapMs: 500,
  maxNormalizedSpeed: 2,
  jumpAllowance: 0.04,
  // EMA time constant; 100ms frames retain ~92% of each new position.
  // Angles derive from these points: no additional angle low-pass lag.
  landmarkSmoothingMs: 40,
  referenceSegmentLength: 0.25,
  minBodyScale: 0.75,
  maxBodyScale: 2,
};

// Experimental selected-leg guards. Distances are fractions of the confirmed
// shorter leg segment per second, not pixels. 2D foreshortening is a limitation.
export const chainTrackingConfig = {
  confirmStableMs: 500, maxGapMs: 500, reacquireMs: 400,
  baselineLengthTolerance: 0.45, frameLengthAllowance: 0.10, frameLengthSpeed: 2,
  hipAllowance: 0.12, hipSpeed: 1.5,
  pointAllowance: 0.20, pointSpeed: 8,
  // Optional ankle/heel/toe geometry, normalized by this person's shin.
  footGeometryAllowance: 0.20, footGeometryTolerance: 0.60,
  swapSeparation: 0.25, swapMovement: 0.20, swapRatio: 0.45,
};
