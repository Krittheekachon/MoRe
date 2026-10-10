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
