import { pointConfidence } from "../pose/cycle";
import type { PoseCriteria, PosePoint } from "../pose/types";
import { audioConfig, type AudioEvent } from "./catalog";
import { TrainingAudioController } from "./controller";
// Selected raw ankle only; never use held coordinates or require the far leg.
export function selectedAnkleUnclear(points: PosePoint[], criteria: PoseCriteria) {
  if (!points.length) return false;
  const ankle = points[criteria.landmarks[2]];
  return !ankle || ![ankle.x, ankle.y, ankle.z].every(Number.isFinite)
    || ankle.x < 0 || ankle.x > 1 || ankle.y < 0 || ankle.y > 1
    || pointConfidence(ankle) < criteria.minVisibility;
}
/** Presentation adapter only: consumes accepted preparation/counter snapshots. */
export class KneeAudio {
  remaining: number | null = null;
  ready = false;
  paused = false;
  setPaused(value: boolean) { this.paused = value; }
  private preparing = false;
  private token = 0;
  private latestAt = -Infinity;
  private valid = false;
  private encouragementAt: number | null = null;
  private encouraged = false;
  private lastAngle: number | null = null;
  private reps = 0;
  private lowering = false;
  constructor(readonly player = new TrainingAudioController()) {}
  reset(reps = this.reps) { this.token++; this.player.stop(); this.remaining = null; this.ready = false; this.preparing = false; this.valid = false; this.encouragementAt = null; this.encouraged = false; this.lastAngle = null; this.reps = reps; this.lowering = false; }
  resetForNewSet(cameraReady: boolean) {
    this.reset(0);
    this.player.clearGuidanceCooldown();
    this.setPaused(!cameraReady);
  }
  updatePreparation(allowed: boolean, at: number, gap: number, issue?: { message: string; missing: boolean; ankleUnclear?: boolean }) {
    this.latestAt = at; this.valid = allowed;
    // Audio completion never overrides the current engine's permission.
    if (this.ready) return allowed;
    if (!allowed) {
      if (this.preparing) {
        this.reset(); // Cancel numbers/whistle before playing the corrective MP3.
        this.guidance(issue?.message || "งอเข่ากลับสู่ท่าเริ่มต้น", issue?.missing ?? false, issue?.ankleUnclear ?? false);
      }
      return false;
    }
    if (!this.preparing) {
      this.preparing = true; const token = ++this.token;
      const live = () => token === this.token && this.valid && performance.now() - this.latestAt <= gap;
      void (async () => {
        await this.player.play("ready", 4);
        if (!live()) { if (token === this.token) this.reset(); return; }
        for (let number = 5; number >= 1; number--) {
          if (!live()) break;
          this.remaining = number; const began = performance.now();
          await this.player.play(number, 4, audioConfig.countdownAudioTimeoutMs);
          await new Promise(resolve => setTimeout(resolve, Math.max(0, audioConfig.countdownStepMs - (performance.now() - began))));
        }
        if (!live()) { if (token === this.token) this.reset(); return; }
        // The whistle is the start signal, not another preparation hold.
        // Its long tail or a missing ended event must never keep "1" on screen
        // or block counting. Pause/reset still stop this shared player.
        this.remaining = null; this.ready = true; this.preparing = false;
        void this.player.play("whistle", 4);
      })();
    }
    return false;
  }
  guidance(message: string, missing: boolean, ankleUnclear = false) {
    if (this.preparing) return;
    const event: AudioEvent | null = missing ? "missing" : ankleUnclear ? "ankle" : message.includes("หันข้าง") ? "side" : message.includes("มุมลำตัว") || message.includes("หลังตรง") || message.includes("งอเข่า") || message.includes("ท่าเริ่มต้น") ? "posture" : message.includes("ไม่ชัด") ? "visibility" : message.includes("ให้กล้องเห็น") ? "camera" : null;
    if (!event) { this.player.cancelGuidance(); return; }
    void this.player.play(event);
  }
  movement(reps: number, moving: boolean, allowed: boolean, angle: number | null, targetMin: number, at: number) {
    if (reps > this.reps) { this.reps = reps; this.lowering = false; this.encouraged = false; this.encouragementAt = null; void this.player.play(reps, 5); }
    const lowering = angle !== null && this.lastAngle !== null && angle < this.lastAngle - audioConfig.loweringDelta;
    this.lastAngle = !moving || angle === null ? null : Math.max(this.lastAngle ?? angle, angle);
    if (!moving) { this.lowering = false; this.encouraged = false; }
    if (lowering && moving) this.lowering = true;
    if (!moving || !allowed || angle === null || angle >= targetMin || angle < audioConfig.encouragementAngle.min || angle > audioConfig.encouragementAngle.max || this.lowering) {
      this.encouragementAt = null; this.player.cancel("encourage"); return;
    }
    this.encouragementAt ??= at;
    if (!this.encouraged && at - this.encouragementAt >= audioConfig.encouragementMs) { this.encouraged = true; void this.player.play("encourage"); }
  }
}
