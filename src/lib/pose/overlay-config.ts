// Shared visual settings for every exercise using PoseCamera.
// Canvas pixels use the camera's intrinsic resolution, not CSS pixels.
// These settings never change pose detection, counting or clinical criteria.
export const poseOverlayConfig = {
  minDisplayVisibility: 0.6,
  showMeasurementLabels: true,
  showNameOnlyLabels: false, // Keep angle labels; hide joint-name-only labels.
  showShoulderLabel: true,
  labelFontSize: 18,
  labelBackground: "#10202fee",
  labelColor: "#ffffff",
  showLandmarks: true,
  showConnections: true,
  connectionWidth: 6,
  landmarkRadius: 3,
  landmarkColor: "#64d5db",
  // Bright fills with dark outlines remain visible on light/dark camera scenes.
  statusColors: {
    "invalid-start": "#ff5252",
    ready: "#ffdf32",
    "target-reached": "#31e981",
    "tracking-lost": "#b0b8c4",
  },
  outlineColor: "#17212b",
  outlineWidth: 1,
  opacity: 1,
};
