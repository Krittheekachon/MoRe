import "server-only";
import type { PoseCriteria } from "./types";

// Populate only after clinician confirmation of exercise identity, metric and criteria.
// DB versions alone do not constitute approval. Test fixtures never enter this registry.
export const approvedPoseCriteria: Readonly<Record<string, Readonly<Record<"left" | "right", PoseCriteria>>>> = {};
