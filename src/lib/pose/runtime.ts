import type { PosePoint } from "./types";

export type PoseFrame = { points: PosePoint[]; world: PosePoint[]; timestamp: number; at: number; width: number; height: number };
export type PoseRuntime = { dispose: () => void };

export function openPoseRuntime(video: HTMLVideoElement, onFrame: (frame: PoseFrame) => void, onStatus: (status: "loading" | "ready" | "error") => void): PoseRuntime {
  const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
  let disposed = false; let busy = false; let ready = false; let raf = 0; let lastVideoTime = -1; let lastSent = -Infinity; let lastReceived = -Infinity;
  const watchdog = setTimeout(fail, 30000);
  let inferenceTimer: ReturnType<typeof setTimeout> | undefined;
  onStatus("loading");
  function fail() { if (!disposed) { onStatus("error"); dispose(); } }
  function dispose() {
    if (disposed) return;
    disposed = true; clearTimeout(watchdog); clearTimeout(inferenceTimer); cancelAnimationFrame(raf);
    worker.postMessage({ type: "close" });
    // Termination is also required if initialization/native inference never replies.
    const timer = setTimeout(() => worker.terminate(), 500);
    worker.onmessage = event => { if (event.data.type === "closed") { clearTimeout(timer); worker.terminate(); } };
  }
  async function tick(timestamp: number) {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    if (!ready || busy || video.readyState < 2 || video.currentTime === lastVideoTime || timestamp - lastSent < 100) return;
    busy = true; lastVideoTime = video.currentTime; lastSent = timestamp;
    try {
      const bitmap = await createImageBitmap(video);
      if (disposed) { bitmap.close(); return; }
      inferenceTimer = setTimeout(fail, 15000);
      worker.postMessage({ type: "frame", bitmap, timestamp, at: Date.now() }, [bitmap]);
    } catch { busy = false; fail(); }
  }
  worker.onmessage = event => {
    if (disposed) return;
    if (event.data.type === "ready") { clearTimeout(watchdog); ready = true; onStatus("ready"); }
    else if (event.data.type === "pose") {
      clearTimeout(inferenceTimer); busy = false;
      if (!Number.isFinite(event.data.timestamp) || event.data.timestamp <= lastReceived) return;
      lastReceived = event.data.timestamp; onFrame(event.data);
    }
    else if (event.data.type === "error") fail();
  };
  worker.onerror = fail;
  worker.postMessage({ type: "init", origin: location.origin });
  raf = requestAnimationFrame(tick);
  return { dispose };
}
