export type PoseModel = "full" | "heavy";
export const defaultPoseModel: PoseModel = "heavy";
export function poseModelPath(model: PoseModel) {
  return `/mediapipe/pose_landmarker_${model === "heavy" ? "heavy" : "full"}.task`;
}
