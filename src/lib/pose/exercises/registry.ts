import type { ExerciseDefinition } from "../exercise-definition";
import { cameraKneeExtension } from "./camera-knee-extension";

// Register each new exercise in its own file. This is a config catalog,
// not clinical approval: server authorization remains mandatory.
export const exerciseDefinitions: Readonly<Record<string, ExerciseDefinition>> = {
  [cameraKneeExtension.exerciseCode]: cameraKneeExtension,
};
