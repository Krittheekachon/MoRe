import { audioConfig, soundPath, type AudioEvent, type Voice } from "./catalog";
type Media = Pick<HTMLAudioElement, "src" | "currentTime" | "muted" | "play" | "pause" | "onended" | "onerror">;
/** One player, no queue. Browser objects are constructed only after a gesture. */
export class TrainingAudioController {
  private media: Media | null = null;
  private finish: ((played: boolean) => void) | null = null;
  private current: string | null = null;
  private priority = 0;
  private lastEnd = new Map<string, number>();
  enabled = audioConfig.enabled;
  voice: Voice = audioConfig.voice;
  constructor(private create: () => Media = () => new Audio(), private now = () => performance.now()) {}
  async unlock() {
    this.media ??= this.create();
    const media = this.media;
    if (this.current) return;
    media.src = soundPath(this.voice, 1)!; media.muted = true;
    try { await media.play(); } catch { /* Autoplay may require another gesture. */ }
    if (!this.current) { media.pause(); media.currentTime = 0; }
    media.muted = false;
  }
  configure(enabled: boolean, voice: Voice) {
    if (enabled !== this.enabled || voice !== this.voice) { this.stop(); this.lastEnd.clear(); }
    this.enabled = enabled; this.voice = voice;
  }
  stop() { this.finish?.(false); this.media?.pause(); this.current = null; this.priority = 0; }
  clearGuidanceCooldown() { this.lastEnd.clear(); }
  cancelGuidance() { if (this.priority === 1) this.stop(); }
  cancel(event: AudioEvent) { if (this.current === event) this.stop(); }
  play(event: AudioEvent | number | "whistle", priority = 1, timeoutMs = audioConfig.playbackTimeoutMs): Promise<boolean> {
    const key = String(event);
    const path = event === "whistle" ? "/audio/shared/Whistle Sound Effect Ringtone.mp3" : soundPath(this.voice, event);
    if (priority === 1 && this.priority === 1 && this.current !== key) this.stop();
    if (!this.enabled || !path || this.current === key || (this.current && (priority < this.priority || (priority === this.priority && priority !== 1 && priority !== 5))) || (priority === 1 && this.now() - (this.lastEnd.get(key) ?? -Infinity) < audioConfig.cooldownMs)) return Promise.resolve(false);
    this.stop(); this.media ??= this.create();
    const media = this.media; this.current = key; this.priority = priority;
    return new Promise(resolve => {
      let done = false;
      const timer = setTimeout(() => finish(false), timeoutMs);
      const finish = (played: boolean) => {
        if (done) return; done = true; clearTimeout(timer);
        media.onended = null; media.onerror = null; media.pause();
        this.lastEnd.set(key, this.now()); this.current = null; this.priority = 0; this.finish = null; resolve(played);
      };
      this.finish = finish; media.src = path; media.currentTime = 0; media.muted = false;
      media.onended = () => finish(true); media.onerror = () => finish(false);
      try { void media.play().catch(() => finish(false)); } catch { finish(false); }
    });
  }
}
