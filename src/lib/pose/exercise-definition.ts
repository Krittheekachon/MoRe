import type { PoseCriteria, Side } from "./types";

// Pure, serializable configuration: no DB access or browser APIs.
export type ExerciseDefinition = Omit<PoseCriteria, "metricId" | "checkpointIds" | "landmarks" | "preparation"> & {
  landmarksBySide: Record<Side, PoseCriteria["landmarks"]>;
  preparationBySide?: Record<Side, NonNullable<PoseCriteria["preparation"]>>;
};
export type MetricBinding = Pick<PoseCriteria, "metricId" | "checkpointIds">;

export function bindExerciseCriteria(definition: ExerciseDefinition, side: Side, binding: MetricBinding): PoseCriteria {
  const { landmarksBySide, preparationBySide, ...config } = definition;
  // Copies prevent one exercise/runtime from mutating another one's config.
  return { ...config, ...binding, ...(preparationBySide ? { preparation: structuredClone(preparationBySide[side]) } : {}), ...(config.returned ? { returned: { ...config.returned } } : {}), landmarks: [...landmarksBySide[side]], start: { ...config.start }, correctPeak: { ...config.correctPeak }, checkpointIds: { ...binding.checkpointIds } };
}
