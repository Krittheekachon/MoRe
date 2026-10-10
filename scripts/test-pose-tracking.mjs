import assert from "node:assert/strict";
import path from "node:path";
import { createJiti } from "jiti";
const jiti = createJiti(import.meta.url);
const { PoseTrackingQuality, PoseDisplaySmoother } = await jiti.import(path.resolve("src/lib/pose/tracking-quality.ts"));
const { measurementLabels, drawMeasurementLabels } = await jiti.import(path.resolve("src/lib/pose/landmark-labels.ts"));
const { bindExerciseCriteria } = await jiti.import(path.resolve("src/lib/pose/exercise-definition.ts"));
const { cameraKneeExtension } = await jiti.import(path.resolve("src/lib/pose/exercises/camera-knee-extension.ts"));
const { RepetitionCycle, jointAngle } = await jiti.import(path.resolve("src/lib/pose/cycle.ts"));
const { drawPoseOverlay } = await jiti.import(path.resolve("src/lib/pose/draw-overlay.ts"));
const binding = { metricId: 1, checkpointIds: { start: 1, peak: 2, returned: 3 } };
const left = bindExerciseCriteria(cameraKneeExtension, "left", binding), right = bindExerciseCriteria(cameraKneeExtension, "right", binding);
let checks = 0; const check = (actual, expected) => { assert.deepEqual(actual, expected); checks++; };
function points(angle = 90, visibility = 1) {
  const output = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility }));
  output[23] = { x: 0.4, y: 0.4, z: 0, visibility }; output[25] = { x: 0.4, y: 0.6, z: 0, visibility };
  output[27] = { x: 0.4 + 0.2 * Math.sin(angle * Math.PI / 180), y: 0.6 - 0.2 * Math.cos(angle * Math.PI / 180), z: 0, visibility };
  return output;
}
const guard = new PoseTrackingQuality();
check(guard.update(points(), left, 0), false); check(guard.update(points(), left, 100), false); check(guard.update(points(), left, 300), true);
const jump = points(); jump[25].x += 0.5;
check(guard.update(jump, left, 400), false); check(guard.update(points(), left, 500), false);
check(guard.update(points(), left, 800), true);
check(guard.update(points(90, 0.1), left, 900), false); check(guard.update(points(), left, 1000), false); check(guard.update(points(), left, 1300), true);
check(guard.update([], left, 1400), false); check(guard.update(points(), left, 1500), false);
check(guard.update(points(), left, 1800), true); check(guard.update(points(), left, 2400), false);
check(guard.update(points(), right, 2500), false); check(guard.update(points(), right, 2800), true);
const outside = points(); outside[24].x = 1.2; check(guard.update(outside, right, 2900), false);
check(guard.update(points(), right, NaN), false); check(guard.update(points(), right, 3000), false); check(guard.update(points(), right, 2900), false);
check(measurementLabels(left, points()).map(label => label.name), ["ไหล่ซ้าย", "สะโพกซ้าย", "เข่าซ้าย", "ข้อเท้าซ้าย", "ส้นเท้าซ้าย", "ปลายเท้าซ้าย"]);
check(measurementLabels(right, points()).map(label => label.index), [12, 24, 26, 28, 30, 32]);
let at = 0; const counter = new RepetitionCycle(left); guard.reset();
function sample(angle, supplied = points(angle)) { at += 200; const valid = guard.update(supplied, left, at); counter.sample(valid ? jointAngle(supplied, left, 640, 640) : null, at, valid ? 1 : 0); }
for (const angle of [90, 90, 90, 90, 125, 165, 165, 90, 90]) sample(angle);
check(counter.repetitions.length, 1);
for (const angle of [90, 125, 165]) sample(angle);
sample(165, jump); sample(90); sample(90); sample(90);
check(counter.repetitions.length, 1); // Invalid frame discards draft, preserves completed rep.
const texts = [], flips = []; let strokes = 0;
const context = { save() {}, restore() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, arc() {}, fill() {}, stroke() { strokes++; }, translate() {}, scale(x,y) { flips.push([x,y]); }, fillRect() {}, measureText(text) { return { width: text.length * 8 }; }, fillText(text) { texts.push(text); } };
drawMeasurementLabels(context, points(), 640, 480, left, true);
check(texts.length, 3); check(flips.every(flip => flip[0] === -1 && flip[1] === 1), true);
texts.length = 0; drawMeasurementLabels(context, points(90, 0.1), 640, 480, left, true); check(texts.length, 0);
strokes = 0; drawPoseOverlay(context, points(90, 0.1), 640, 480, "tracking-lost"); check(strokes, 0);
const smoother = new PoseDisplaySmoother(), original = points();
smoother.update(original, 0); const moving = points(); moving[25].x += 0.1;
const smoothed = smoother.update(moving, 100);
check(smoothed[25].x > original[25].x && smoothed[25].x < moving[25].x, true);
check(moving[25].x, 0.5); // Never mutates data used for measurement/counting.
const lost = smoother.update(points(90, 0.1), 200); check(lost[25].visibility, 0);
smoother.reset(); check(smoother.update(moving, 300)[25].x, moving[25].x);
console.log(JSON.stringify({ trackingChecks: checks, physicalCameraTested: false, clinicalCriteriaChanged: false }));
