import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import { poseTrackingConfig } from "./tracking-config";

let task: PoseLandmarker | null = null;
let closed = false;
self.onmessage = async (event: MessageEvent) => {
  const message = event.data;
  if (message.type === "close") { closed = true; task?.close(); task = null; self.postMessage({ type: "closed" }); return; }
  if (message.type === "init") {
    try {
      const files = await FilesetResolver.forVisionTasks(`${message.origin}/mediapipe/wasm`);
      const created = await PoseLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: `${message.origin}/mediapipe/pose_landmarker_full.task`, delegate: "CPU" },
        runningMode: "VIDEO", numPoses: 1, outputSegmentationMasks: false,
        minPoseDetectionConfidence: poseTrackingConfig.minPoseDetectionConfidence,
        minPosePresenceConfidence: poseTrackingConfig.minPosePresenceConfidence,
        minTrackingConfidence: poseTrackingConfig.minTrackingConfidence,
        canvas: new OffscreenCanvas(1, 1),
      });
      if (closed) { created.close(); return; }
      task = created; self.postMessage({ type: "ready" });
    } catch { self.postMessage({ type: "error" }); }
    return;
  }
  if (message.type === "frame") {
    const bitmap: ImageBitmap = message.bitmap;
    try {
      if (!task || closed) return;
      const result = task.detectForVideo(bitmap, message.timestamp);
      self.postMessage({ type: "pose", points: result.landmarks[0] || [], world: result.worldLandmarks[0] || [], timestamp: message.timestamp, at: message.at, width: bitmap.width, height: bitmap.height });
      result.close();
    } catch { self.postMessage({ type: "error" }); }
    finally { bitmap.close(); }
  }
};
