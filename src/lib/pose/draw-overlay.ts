import type { PosePoint } from "./types";
import { poseOverlayConfig } from "./overlay-config";
import type { PoseFeedbackStatus } from "./feedback-types";
import { poseConnections } from "./connections";
import { pointConfidence } from "./cycle";

// Render real image landmarks; mirroring remains shared with the video in CSS.
export function drawPoseOverlay(context: CanvasRenderingContext2D, points: PosePoint[], width: number, height: number, status?: PoseFeedbackStatus, focus?: readonly number[]) {
  context.clearRect(0, 0, width, height);
  if (!poseOverlayConfig.showLandmarks && !poseOverlayConfig.showConnections) return;
  context.save();
  context.fillStyle = status ? poseOverlayConfig.statusColors[status] : poseOverlayConfig.landmarkColor;
  context.strokeStyle = poseOverlayConfig.outlineColor;
  context.lineWidth = Math.max(0, poseOverlayConfig.outlineWidth);
  context.globalAlpha = Math.max(0, Math.min(1, poseOverlayConfig.opacity));
  const radius = Math.max(0, poseOverlayConfig.landmarkRadius);
  if (poseOverlayConfig.showConnections && poseOverlayConfig.connectionWidth > 0) {
    context.lineCap = "round";
    for (const [start, end] of poseConnections) {
      if (focus && (!focus.includes(start) || !focus.includes(end))) continue;
      const a = points[start], b = points[end];
      if (!a || !b || ![a.x, a.y, b.x, b.y].every(Number.isFinite) || pointConfidence(a) < poseOverlayConfig.minDisplayVisibility || pointConfidence(b) < poseOverlayConfig.minDisplayVisibility) continue;
      context.beginPath();
      context.moveTo(a.x * width, a.y * height);
      context.lineTo(b.x * width, b.y * height);
      context.strokeStyle = poseOverlayConfig.outlineColor;
      context.lineWidth = poseOverlayConfig.connectionWidth + 2 * Math.max(0, poseOverlayConfig.outlineWidth);
      if (poseOverlayConfig.outlineWidth > 0) context.stroke();
      context.strokeStyle = context.fillStyle;
      context.lineWidth = poseOverlayConfig.connectionWidth;
      context.stroke();
    }
  }
  context.strokeStyle = poseOverlayConfig.outlineColor;
  context.lineWidth = Math.max(0, poseOverlayConfig.outlineWidth);
  if (poseOverlayConfig.showLandmarks) for (const [index, point] of points.entries()) {
    if (focus && !focus.includes(index)) continue;
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || pointConfidence(point) < poseOverlayConfig.minDisplayVisibility) continue;
    context.beginPath();
    context.arc(point.x * width, point.y * height, radius, 0, 2 * Math.PI);
    context.fill();
    if (poseOverlayConfig.outlineWidth > 0) context.stroke();
  }
  context.restore();
}
