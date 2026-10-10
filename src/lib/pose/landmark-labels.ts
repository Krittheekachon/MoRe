import { pointConfidence } from "./cycle";
import type { PoseCriteria, PosePoint } from "./types";
import { poseOverlayConfig as config } from "./overlay-config";
import type { PreparationResult } from "./exercises/knee-preparation";
import { jointAngle } from "./cycle";

const names = ["จมูก", "ตาซ้ายด้านใน", "ตาซ้าย", "ตาซ้ายด้านนอก", "ตาขวาด้านใน", "ตาขวา", "ตาขวาด้านนอก", "หูซ้าย", "หูขวา", "ปากซ้าย", "ปากขวา", "ไหล่ซ้าย", "ไหล่ขวา", "ศอกซ้าย", "ศอกขวา", "ข้อมือซ้าย", "ข้อมือขวา", "นิ้วก้อยซ้าย", "นิ้วก้อยขวา", "นิ้วชี้ซ้าย", "นิ้วชี้ขวา", "นิ้วโป้งซ้าย", "นิ้วโป้งขวา", "สะโพกซ้าย", "สะโพกขวา", "เข่าซ้าย", "เข่าขวา", "ข้อเท้าซ้าย", "ข้อเท้าขวา", "ส้นเท้าซ้าย", "ส้นเท้าขวา", "ปลายเท้าซ้าย", "ปลายเท้าขวา"];
export function landmarkLabel(index: number) { return names[index] ?? `Landmark ${index}`; }
export function measurementLabels(criteria: PoseCriteria, points: PosePoint[]) {
  const focus = criteria.preparation ? [criteria.preparation.shoulder, ...criteria.landmarks, criteria.preparation.heel, criteria.preparation.foot] : criteria.landmarks;
  return focus.map(index => ({ index, name: names[index] ?? `Landmark ${index}`, confidence: pointConfidence(points[index]), point: points[index] }));
}

// Canvas is mirrored in CSS. Counter-mirror text only so labels stay readable.
export function drawMeasurementLabels(context: CanvasRenderingContext2D, points: PosePoint[], width: number, height: number, criteria: PoseCriteria, trusted: boolean, preparation?: PreparationResult | null, showFeet = true, safeArea = { top: 0, bottom: height }) {
  if (!config.showMeasurementLabels) return;
  context.save(); context.font = `600 ${config.labelFontSize}px sans-serif`;
  const occupied: { left: number; top: number; width: number; height: number }[] = [];
  for (const label of measurementLabels(criteria, points)) {
    const showsAngle = !!criteria.preparation && (label.index === criteria.landmarks[0] || label.index === criteria.landmarks[1]);
    const showsShoulder = config.showShoulderLabel && label.index === criteria.preparation?.shoulder;
    if (!config.showNameOnlyLabels && !showsAngle && !showsShoulder) continue;
    if (!showFeet && criteria.preparation && [criteria.preparation.heel, criteria.preparation.foot].includes(label.index)) continue;
    const point = label.point;
    if (!point || ![point.x, point.y].every(Number.isFinite) || point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1 || label.confidence < criteria.minVisibility) continue;
    let text = `${label.name}${trusted ? "" : " · รอนิ่ง"}`;
    if (criteria.preparation && label.index === criteria.landmarks[1]) {
      const angle = preparation?.knee == null ? null : jointAngle(points, criteria, width, height);
      text = `เข่า ${angle === null ? "—" : Math.round(angle) + "°"}${trusted ? "" : " · รอนิ่ง"}`;
    }
    if (criteria.preparation && label.index === criteria.landmarks[0]) {
      const angle = preparation?.torso == null ? null : jointAngle(points, { ...criteria, landmarks: [criteria.preparation.shoulder, criteria.landmarks[0], criteria.landmarks[1]] }, width, height);
      text = `ลำตัว ${angle === null ? "—" : Math.round(angle) + "°"}${trusted ? "" : " · รอนิ่ง"}`;
    }
    const boxWidth = Math.min(width, context.measureText(text).width + 16), boxHeight = config.labelFontSize + 14;
    const left = Math.max(0, Math.min(width - boxWidth, width - point.x * width + 8));
    if (safeArea.bottom - safeArea.top < boxHeight) continue;
    let top = Math.max(safeArea.top, Math.min(safeArea.bottom - boxHeight, point.y * height - boxHeight));
    for (let attempt = 0; attempt < 12 && occupied.some(box => left < box.left + box.width && left + boxWidth > box.left && top < box.top + box.height && top + boxHeight > box.top); attempt++) top = Math.max(safeArea.top, Math.min(safeArea.bottom - boxHeight, top + (top + boxHeight * 2 <= safeArea.bottom ? boxHeight + 4 : -boxHeight - 4)));
    if (occupied.some(box => left < box.left + box.width && left + boxWidth > box.left && top < box.top + box.height && top + boxHeight > box.top)) continue;
    occupied.push({ left, top, width: boxWidth, height: boxHeight });
    // Tether a displaced label to its landmark; knee/hip segments remain visible.
    context.beginPath(); context.moveTo(point.x * width, point.y * height); context.lineTo(width - left, top + boxHeight / 2); context.strokeStyle = config.labelColor; context.lineWidth = 1; context.stroke();
    context.save(); context.translate(width - left, top); context.scale(-1, 1);
    context.fillStyle = config.labelBackground; context.fillRect(0, 0, boxWidth, boxHeight);
    context.fillStyle = config.labelColor; context.textBaseline = "top"; context.fillText(text, 8, 6, Math.max(1, boxWidth - 16));
    context.restore();
  }
  context.restore();
}
