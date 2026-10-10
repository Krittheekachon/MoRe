import path from "node:path";
import assert from "node:assert/strict";
import { createJiti } from "jiti";
const jiti = createJiti(import.meta.url);
const { bindExerciseCriteria } = await jiti.import(path.resolve("src/lib/pose/exercise-definition.ts"));
const { cameraKneeExtension } = await jiti.import(path.resolve("src/lib/pose/exercises/camera-knee-extension.ts"));
const { poseEngine } = await jiti.import(path.resolve("src/lib/pose/engines/registry.ts"));
const criteria = bindExerciseCriteria(cameraKneeExtension, "left", { metricId: 1, checkpointIds: { start: 1, peak: 2, returned: 3 } });
const engine = poseEngine(criteria);
const { drawPoseOverlay } = await jiti.import(path.resolve("src/lib/pose/draw-overlay.ts"));
const { poseOverlayConfig } = await jiti.import(path.resolve("src/lib/pose/overlay-config.ts"));
const counter = engine.createCounter(criteria), baseline = engine.createCounter(criteria), feedback = engine.createFeedback(criteria);
let at = 1000, checks = 0;
function check(value, expected) { assert.deepEqual(value, expected); checks++; }
function frame(angle, confidence = 1) {
  at += 200; baseline.sample(angle, at, confidence); counter.sample(angle, at, confidence);
  const status = feedback.update(angle, at, confidence, counter.movement);
  check(counter.repetitions, baseline.repetitions); // All saved fields remain identical.
  return status;
}
frame(50); check(frame(50), "invalid-start");
frame(90); check(frame(90), "ready");
check(frame(125), "ready"); check(frame(130), "ready");
check(frame(165), "ready"); check(frame(165), "target-reached");
check(frame(130), "target-reached"); check(frame(120), "target-reached");
check(frame(90), "target-reached"); check(frame(90), "ready");
check(counter.repetitions.length, 1); check(engine.correct(counter.repetitions[0], criteria), true);
frame(125); frame(130); check(frame(90), "ready"); check(frame(90), "ready");
check(counter.repetitions.length, 2); check(engine.correct(counter.repetitions[1], criteria), false);
check(frame(null), "tracking-lost"); check(frame(90), "ready"); check(frame(90), "ready");
check(frame(90, 0.1), "tracking-lost"); check(frame(90), "ready"); frame(90);
frame(125); frame(130); frame(165); check(frame(165), "target-reached");
check(frame(null), "tracking-lost"); check(frame(90), "ready"); check(frame(90), "ready");
check(counter.repetitions.length, 2); // Interrupted draft cannot produce a rep.
counter.interrupt(); baseline.interrupt(); feedback.reset();
frame(50); check(frame(50), "invalid-start"); frame(90); check(frame(90), "ready");
frame(125); frame(130); frame(165); check(frame(130), "ready"); // One-frame target spike does not turn green.
frame(90); check(frame(90), "ready");
check(counter.repetitions.length, 3); // Presentation smoothing does not change original counts.
check(feedback.update(90, at, 0, counter.movement), "tracking-lost");
const context = { clearRect() {}, save() {}, restore() {}, beginPath() {}, arc() {}, fill() {}, stroke() {}, moveTo() {}, lineTo() {} };
for (const status of ["invalid-start", "ready", "target-reached", "tracking-lost"]) {
  drawPoseOverlay(context, [{ x: 0.5, y: 0.5, z: 0 }], 640, 480, status);
  check(context.fillStyle, poseOverlayConfig.statusColors[status]);
  check(context.strokeStyle, poseOverlayConfig.outlineColor);
}
console.log(JSON.stringify({ feedbackChecks: checks, unchangedRepetitionPayload: true, physicalCameraTested: false }));
