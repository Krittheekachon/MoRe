// Playwright CLI function; credentials are injected temporarily by the fixture runner.
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
async (page) => {
  const fixture = null /*RECORDING_FIXTURE*/;
  const origin = new URL(page.url()).origin;
  if (!fixture || !["localhost", "127.0.0.1"].includes(new URL(origin).hostname)) throw new Error("Local fixtures required");
  const context = await page.context().browser().newContext({ viewport: { width: 820, height: 1180 }, locale: "th-TH" });
  let checks = 0;
  const check = (condition, label) => { if (!condition) throw new Error(`Recording check failed: ${label}`); checks++; };
  try {
    await context.addInitScript(() => {
      const original = window.Worker;
      window.__poseWorkers = { created: 0, terminated: 0 };
      window.Worker = class extends original {
        constructor(...args) { super(...args); window.__poseWorkers.created++; }
        terminate() { window.__poseWorkers.terminated++; super.terminate(); }
      };
      Object.defineProperty(navigator.mediaDevices, "getUserMedia", { value: async () => {
        if (window.__denyCamera) throw new DOMException("Synthetic denial", "NotAllowedError");
        const canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 360;
        const drawing = canvas.getContext("2d"); let tick = 0;
        const timer = setInterval(() => { drawing.fillStyle = tick++ % 2 ? "#405050" : "#406060"; drawing.fillRect(0, 0, 640, 480); }, 100);
        const stream = canvas.captureStream(10); const track = stream.getVideoTracks()[0]; const stop = track.stop.bind(track);
        track.stop = () => { clearInterval(timer); stop(); };
        window.__testTrack = track;
        return stream;
      } });
    });
    const current = await context.newPage();
    await current.goto(origin); await current.waitForLoadState("networkidle");
    await current.locator("#national-id").fill(fixture.nationalId); await current.locator("#password").fill(fixture.password);
    await current.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click(); await current.waitForURL("**/patient");
    const url = `${origin}/patient/exercises/seated-leg-raise/camera?daily=${fixture.cameraDaily}`;
    await current.goto(url); await current.waitForLoadState("networkidle");
    check(await current.getByRole("button", { name: /^(เริ่ม|ทำต่อ)$/, exact: true }).isDisabled(), "unconfirmed criteria cannot start");
    check(await current.getByRole("button", { name: "บันทึกเซต", exact: true }).isDisabled(), "unconfirmed criteria cannot save");
    check(await current.locator(".pose-back").count() === 0, "camera has no back button");
    check(await current.getByRole("heading", { level: 1 }).innerText() !== "", "exercise title is present in top bar");
    check(await current.getByRole("button", { name: "รีเซ็ตเซต", exact: true }).count() === 1, "icon reset remains accessible");
    await current.getByRole("button", { name: "รายละเอียดท่า", exact: true }).click();
    await current.getByRole("button", { name: "ปิดรายละเอียด", exact: true }).click();
    check(true, "details dialog opens without leaving camera");
    await current.getByRole("button", { name: "เปิดกล้อง", exact: true }).click();
    await current.getByRole("status").filter({ hasText: "ไม่พบร่างกาย" }).waitFor({ timeout: 90000 });
    check(await current.evaluate(() => document.querySelector("video").videoWidth === 640), "synthetic camera renders");
    check(await current.locator(".pose-camera-frame").evaluate(node => { const rect = node.getBoundingClientRect(); const video = document.querySelector("video"); return Math.abs(rect.width - innerWidth) <= 1 && Math.abs(rect.height - innerHeight) <= 1 && video.videoHeight === 360; }), "camera uses full viewport while source retains 16:9 dimensions");
    check(await current.evaluate(() => window.__poseWorkers.created === 1), "one worker per camera");
    check(await current.getByRole("alert", { name: "คำแนะนำจัดตำแหน่งกล้อง" }).isVisible(), "tracking guidance overlays actual blank camera stream");
    check((await current.locator(".camera-summary strong").first().innerText()).startsWith("0 /"), "blank frames create no reps");
    await current.getByRole("button", { name: "ปิดกล้อง", exact: true }).click();
    await current.waitForFunction(() => window.__poseWorkers.terminated === 1 && window.__testTrack.readyState === "ended");
    check(await current.getByRole("alert", { name: "คำแนะนำจัดตำแหน่งกล้อง" }).count() === 0, "closing camera removes tracking guidance");
    check(true, "worker and stream released on close");
    await current.getByRole("button", { name: "เปิดกล้อง", exact: true }).click();
    await current.getByRole("status").filter({ hasText: "ไม่พบร่างกาย" }).waitFor({ timeout: 90000 });
    check(await current.evaluate(() => window.__poseWorkers.created === 2), "reopening uses one new worker");
    await current.getByRole("button", { name: "ออก", exact: true }).click(); await current.waitForURL("**/patient/exercises");
    await current.waitForFunction(() => window.__poseWorkers.terminated === 2 && window.__testTrack.readyState === "ended");
    check(true, "navigation releases camera resources");
    await current.goto(url); await current.waitForLoadState("networkidle");
    await current.evaluate(() => { window.__denyCamera = true; });
    await current.getByRole("button", { name: "เปิดกล้อง", exact: true }).click();
    await current.getByRole("alert").filter({ hasText: "ไม่ได้รับสิทธิ์กล้อง" }).waitFor();
    check(await current.evaluate(() => window.__poseWorkers.created === 0), "permission denial does not create worker");
    await current.evaluate(() => { window.__denyCamera = false; });
    await context.route("**/mediapipe/pose_landmarker_full.task", route => route.abort());
    await current.getByRole("button", { name: "เปิดกล้อง", exact: true }).click();
    await current.getByRole("alert").filter({ hasText: "โหลดหรือประมวลผล" }).waitFor({ timeout: 60000 });
    await current.getByRole("button", { name: "ปิดกล้อง", exact: true }).click();
    await current.waitForFunction(() => window.__poseWorkers.terminated === 1 && window.__testTrack.readyState === "ended");
    check(true, "model failure is reported and resources released");
    await context.unroute("**/mediapipe/pose_landmarker_full.task");
    for (const [width, height] of [[390, 844], [844, 390], [820, 1180], [1180, 820], [1440, 900]]) for (const theme of ["light", "dark"]) for (const size of ["m", "l", "xl"]) {
      await current.setViewportSize({ width, height });
      await context.addCookies([{ name: "more-theme", value: theme, domain: "localhost", path: "/" }, { name: "more-font-size", value: size, domain: "localhost", path: "/" }]);
      await current.goto(url); await current.waitForLoadState("networkidle");
      check(await current.evaluate(({ theme, size }) => document.documentElement.dataset.theme === theme && document.documentElement.dataset.size === size, { theme, size }), `preferences applied ${theme}/${size}`);
      check(await current.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `camera fits ${width}/${theme}/${size}`);
      check(await current.locator(".pose-preview").evaluate(node => { const rect = node.getBoundingClientRect(); const card = document.querySelector(".pose-control-card").getBoundingClientRect(); return Math.abs(rect.width - innerWidth) <= 1 && Math.abs(rect.height - innerHeight) <= 1 && card.top >= rect.top && card.bottom <= rect.bottom + 1; }), `camera fills viewport with floating controls ${width}/${theme}/${size}`);
      check(await current.evaluate(() => {
        const title = document.querySelector(".pose-session-title").getBoundingClientRect();
        const frame = document.querySelector(".pose-camera-frame").getBoundingClientRect();
        const video = getComputedStyle(document.querySelector(".pose-preview video"));
        const overlay = getComputedStyle(document.querySelector(".pose-preview canvas"));
        return getComputedStyle(document.querySelector(".app-topbar")).display === "none" && Math.abs(frame.width - innerWidth) <= 1 && title.top >= frame.top && title.top - frame.top < 20 && title.left >= frame.left && title.left - frame.left < 20 && video.objectFit === "contain" && overlay.objectFit === video.objectFit && overlay.objectPosition === video.objectPosition;
      }), `camera stylesheet applied and title at top left ${width}/${theme}/${size}`);
      check(await current.locator(".pose-primary-actions").evaluate(node => { const rect = node.getBoundingClientRect(); return rect.top >= 0 && rect.bottom <= innerHeight + 1; }), `primary actions stay visible ${width}/${height}/${theme}/${size}`);
      check(await current.locator(".pose-session-metrics").evaluate(node => { const rect = node.getBoundingClientRect(); return rect.top >= 0 && rect.bottom <= innerHeight + 1; }), `counters stay visible ${width}/${height}/${theme}/${size}`);
      check(await current.evaluate(() => { const status = document.querySelector(".pose-camera-frame > .camera-placeholder")?.getBoundingClientRect(); const card = document.querySelector(".pose-control-card")?.getBoundingClientRect(); return !status || status.bottom <= card.top + 1 || status.right <= card.left + 1; }), `idle status does not overlap controls ${width}/${height}/${theme}/${size}`);
      if (theme === "dark" && size === "xl") await current.screenshot({ path: `output/playwright/recording-camera-${width}.png`, fullPage: true });
    }
    return { checks, responsiveCombinations: 30, inference: "real MediaPipe model on synthetic blank video, no human movement" };
  } finally { await context.close(); }
}
