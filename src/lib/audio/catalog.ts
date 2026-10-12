export type Voice = "male" | "female";
export const audioConfig = { enabled: true, voice: "female" as Voice, cooldownMs: 5000, encouragementMs: 2000, encouragementAngle: { min: 140, max: 150 }, loweringDelta: 1, countdownStepMs: 1000, countdownAudioTimeoutMs: 3000, maxRep: 20, playbackTimeoutMs: 20000 };
export function parseAudioEnabled(value?: string) { return value === "0" ? false : value === "1" ? true : audioConfig.enabled; }
export function parseVoice(value?: string): Voice { return value === "male" || value === "female" ? value : audioConfig.voice; }
export const globalSounds = { ankle: "camera-ankle.mp3", ready: "ready_for_countdown.mp3", missing: "move_into_camera_view.mp3" };
export const kneeSounds = { intro: "exercise_intro.mp3", camera: "adjust_camera_position.mp3", visibility: "improve_tracking_visibility.mp3", posture: "correct_seated_posture.mp3", side: "turn_side_to_camera.mp3", encourage: "encourage_knee_extension.mp3" };
export type AudioEvent = keyof typeof globalSounds | keyof typeof kneeSounds;
export function soundPath(voice: Voice, event: AudioEvent | number) {
  const base = `/audio/more-${voice}`;
  if (typeof event === "number") return Number.isInteger(event) && event >= 1 && event <= audioConfig.maxRep ? `${base}/global/rep_count_${String(event).padStart(2, "0")}.mp3` : null;
  return event in globalSounds ? `${base}/global/${globalSounds[event as keyof typeof globalSounds]}` : `${base}/seated-knee-extension/${kneeSounds[event as keyof typeof kneeSounds]}`;
}
