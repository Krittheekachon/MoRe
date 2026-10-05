// eslint-disable-next-line @typescript-eslint/no-unused-expressions
async (page) => {
  const fixture = null /*DEMO_FIXTURE*/;
  const origin = "http://localhost:3001";
  const context = await page.context().browser().newContext({ viewport: { width: 820, height: 1180 } });
  let checks = 0;
  const check = (value, label) => { if (!value) throw new Error(`Demo check: ${label}`); checks++; };
  try {
    await context.addInitScript(() => {
      const Original = window.Worker; window.__workers = { created: 0, ended: 0 };
      window.Worker = class extends Original { constructor(...args) { super(...args); window.__workers.created++; } terminate() { window.__workers.ended++; super.terminate(); } };
      Object.defineProperty(navigator.mediaDevices, "getUserMedia", { value: async () => {
        if (window.__denied) throw new DOMException("Synthetic denial", "NotAllowedError");
        const canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 480;
        const draw = canvas.getContext("2d"); let tick = 0;
        const timer = setInterval(() => { draw.fillStyle = tick++ % 2 ? "#31505a" : "#315a50"; draw.fillRect(0, 0, 640, 480); }, 100);
        const stream = canvas.captureStream(10); const track = stream.getVideoTracks()[0]; const stop = track.stop.bind(track);
        track.stop = () => { clearInterval(timer); stop(); }; window.__track = track; return stream;
      } });
    });
    const account = fixture.accounts.patients[0];
    check((await context.request.post(origin + "/api/auth/login", { headers: { Origin: origin }, data: { nationalId: account.nationalId, password: account.password } })).ok(), "camera fixture login");
    const dailyResponse = await context.request.get(origin + "/api/patient/training/today"); const today = await dailyResponse.json();
    const item = today.items.find(item => item.canStart); check(!!item, "available Demo daily item");
    const current = await context.newPage(); const url = `${origin}/patient/exercises/${item.exercise.code}/camera?daily=${item.id}`;
    await current.goto(url); await current.waitForLoadState("networkidle");
    await current.evaluate(() => { window.__denied = true; }); await current.getByRole("button", { name: "เปิดกล้อง", exact: true }).click();
    await current.getByRole("alert").filter({ hasText: "ไม่ได้รับสิทธิ์กล้อง" }).waitFor(); check(await current.evaluate(() => window.__workers.created === 0), "permission denial no worker");
    await current.evaluate(() => { window.__denied = false; });
    await current.getByRole("button", { name: "เปิดกล้อง", exact: true }).click();
    await current.getByRole("status").filter({ hasText: "ไม่พบร่างกาย" }).waitFor({ timeout: 90000 });
    check(await current.evaluate(() => window.__workers.created === 1 && document.querySelector("video").videoWidth === 640), "actual model/one worker/synthetic stream");
    const pixel = await current.evaluate(() => { const video = document.querySelector("video"); const output = document.createElement("canvas"); output.width = 2; output.height = 2; const draw = output.getContext("2d"); draw.drawImage(video, 0, 0, 2, 2); return [...draw.getImageData(0, 0, 2, 2).data].some((value, index) => index % 4 !== 3 && value > 0); });
    check(pixel, "video pixels nonblank");
    await current.getByRole("button", { name: "เริ่ม / ทำต่อ", exact: true }).click(); await current.getByRole("button", { name: "หยุดพัก", exact: true }).waitFor();
    await current.waitForTimeout(1500); check((await current.locator(".camera-summary strong").first().innerText()).startsWith("0 /"), "no body cannot create repetitions");
    check(await current.locator(".app-main .display-trigger, .app-main .display-menu").count() === 0, "no active settings");
    await current.getByRole("button", { name: "หยุดพัก", exact: true }).click(); await current.locator(".pause-panel").waitFor();
    await current.locator(".pause-panel .display-trigger").click(); await current.getByRole("button", { name: "เสร็จสิ้น" }).click(); check(await current.locator(".pause-panel").isVisible(), "real runtime stays paused after settings");
    await current.getByRole("button", { name: "ออก", exact: true }).click(); await current.waitForURL("**/patient/exercises");
    await current.waitForFunction(() => window.__workers.ended === 1 && window.__track.readyState === "ended"); check(true, "worker/video tracks released on exit");
    await current.goto(url); await current.waitForLoadState("networkidle");
    await context.route("**/mediapipe/pose_landmarker_lite.task", route => route.abort());
    await current.getByRole("button", { name: "เปิดกล้อง", exact: true }).click(); await current.getByRole("alert").filter({ hasText: "โหลดหรือประมวลผล" }).waitFor({ timeout: 60000 });
    await current.getByRole("button", { name: "ปิดกล้อง", exact: true }).click();
    await current.waitForFunction(() => window.__workers.ended === 1 && window.__track.readyState === "ended"); check(true, "model failure releases resources");
    return { cameraChecks: checks, inference: "actual MediaPipe on synthetic blank stream", realHumanCameraTested: false };
  } finally { await context.close(); }
}
