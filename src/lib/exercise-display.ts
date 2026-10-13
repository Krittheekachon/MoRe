// Patient-facing name only; retain catalog codes and stored history.
export function exerciseDisplayName(exercise: { code: string; name_th: string }) {
  return exercise.code === "demo-knee-extension" ? "นั่งเหยียดขา - Seated Knee Extension" : exercise.name_th;
}
