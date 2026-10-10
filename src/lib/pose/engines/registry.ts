import type { CompletedRep, PoseCriteria, PosePoint } from "../types";
import { angleReturnEngine } from "./angle-return";
import type { MovementSnapshot, PoseFeedback } from "../feedback-types";

export interface RepetitionCounter {
  readonly repetitions: CompletedRep[];
  readonly movement: MovementSnapshot;
  readonly debug?: { state: string; stableMs: number; requiredMs: number; reason: string };
  sample(angle: number | null, at: number, confidence?: number): CompletedRep | null;
  interrupt(): void;
  suspend?(at?: number): void;
  reset(): void;
}
export interface PoseEngine {
  createCounter(criteria: PoseCriteria): RepetitionCounter;
  createFeedback(criteria: PoseCriteria): PoseFeedback;
  measure(points: PosePoint[], criteria: PoseCriteria, width: number, height: number): number | null;
  confidence(points: PosePoint[], criteria: PoseCriteria): number;
  validCriteria(criteria: PoseCriteria): boolean;
  complete(rep: CompletedRep, criteria: PoseCriteria): boolean;
  correct(rep: CompletedRep, criteria: PoseCriteria): boolean;
}
const engines: Readonly<Record<string, PoseEngine>> = { "angle-return": angleReturnEngine };
export function poseEngine(criteria: PoseCriteria): PoseEngine {
  // Legacy approved criteria and existing fixtures retain the original engine.
  const engine = engines[criteria.engine ?? "angle-return"];
  if (!engine) throw new Error("Unsupported pose engine");
  return engine;
}
