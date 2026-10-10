import type { PoseCriteria } from "./types";

export type PoseFeedbackStatus = "invalid-start" | "ready" | "target-reached" | "tracking-lost";
export type MovementSnapshot = { phase: "preparing" | "ready" | "moving"; completedReps: number };
export interface PoseFeedback {
  update(angle: number | null, at: number, confidence: number, movement: MovementSnapshot): PoseFeedbackStatus;
  reset(): void;
}
export type FeedbackFactory = (criteria: PoseCriteria) => PoseFeedback;
