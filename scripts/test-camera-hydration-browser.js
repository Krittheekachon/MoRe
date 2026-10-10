// Local temporary fixtures supplied by test-recording.mjs; never log credentials.
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
async (sessionPage) => {
  const fixture = null /*RECORDING_FIXTURE*/;
  const baseline = false /*HYDRATION_BASELINE*/;
  const origin = new URL(sessionPage.url()).origin;
  let checks = 0; const evidence = [];
  const check = (value, label) => { if (!value) throw new Error(`Camera hydration: ${label}`); checks++; };
  const browser = sessionPage.context().browser();
  const auth = await browser.newContext();
  const login = await auth.request.post(origin + "/api/auth/login", { headers: { Origin: origin }, data: { nationalId: fixture.nationalId, password: fixture.password } });
  check(login.ok(), "fixture login"); const storageState = await auth.storageState(); await auth.close();
  for (const assigned of [true, false]) for (const inject of [false, true]) {
    const context = await browser.newContext({ storageState, viewport: { width: 820, height: 1180 }, locale: "th-TH" });
    let release;
    try {
      const page = await context.newPage(); const errors = [];
      page.on("console", event => { if (event.type() === "error") errors.push(event.text()); });
      page.on("pageerror", error => errors.push(error.message));
      const gate = new Promise(resolve => { release = resolve; });
      await page.route("**/*", async route => { if (route.request().resourceType() === "script") await gate; await route.continue(); });
      const daily = assigned ? fixture.cameraAssignedDaily : fixture.cameraFreeDaily;
      const url = `${origin}/patient/exercises/demo-knee-extension/camera?daily=${daily}`;
      const response = await page.goto(url, { waitUntil: "commit" });
      await page.locator('[aria-label="ข้างที่ฝึก"]').waitFor({ state: "attached" });
      const html = await response.text();
      check(!/__gcruniqueid/i.test(html), "attribute absent from server response");
      const before = await page.evaluate(source => {
        const parsed = new DOMParser().parseFromString(source, "text/html");
        const selector = '[aria-label="ข้างที่ฝึก"]';
        return { server: parsed.querySelector(selector).outerHTML, dom: document.querySelector(selector).outerHTML, native: !!document.querySelector(".pose-session select") };
      }, html);
      check(before.server === before.dom, "server/pre-hydration side markup equal");
      if (inject) await page.evaluate(() => { const field = document.querySelector(".pose-session select"); if (field) field.setAttribute("__gCrUniqueID", "1"); });
      release(); await page.waitForLoadState("networkidle");
      const warnings = errors.filter(error => /hydrated|hydration|didn't match/i.test(error));
      check(baseline && inject ? warnings.some(error => /__gcruniqueid/i.test(error)) : errors.length === 0, "expected initial warning evidence");
      evidence.push({ assigned, injectNativeSelect: inject, nativeSelectPresent: before.native, serverDOMMatch: true, hydrationWarnings: warnings.length });
      check(await page.locator("video").evaluate(video => video.srcObject === null), "hydration does not open camera");
      if (!baseline) {
        const group = page.getByRole("group", { name: "ข้างที่ฝึก", exact: true });
        const left = group.getByRole("button", { name: /ซ้าย/ }), right = group.getByRole("button", { name: /ขวา/ });
        check(await right.getAttribute("aria-pressed") === String(assigned), "initial assigned side");
        check(await left.getAttribute("aria-pressed") === "false", "left initially unselected");
        if (assigned) check(await left.isDisabled() && await right.isDisabled(), "plan side remains locked");
        else { check(await page.getByText("เลือกข้างที่ฝึก", { exact: true }).isVisible(), "empty side guidance"); await left.click(); check(await left.getAttribute("aria-pressed") === "true", "select left"); await right.click(); check(await right.getAttribute("aria-pressed") === "true" && await left.getAttribute("aria-pressed") === "false", "select right using same state"); }
      }
      for (let i = 0; i < 2; i++) await page.reload({ waitUntil: "networkidle" });
      check(errors.filter(error => /hydrated|hydration|didn't match/i.test(error)).length === warnings.length, "two network reloads introduce no warning");
      await page.getByRole("button", { name: "ออก", exact: true }).click(); await page.waitForURL("**/patient/exercises");
      await page.locator(`a[href*="/guide?daily=${daily}"]`).click();
      await page.getByRole("link", { name: "ไปหน้ากล้อง" }).click(); await page.waitForURL(url);
      check(errors.filter(error => /hydrated|hydration|didn't match/i.test(error)).length === warnings.length, "internal navigation adds no warning");
    } finally { release?.(); await context.close(); }
  }
  if (!baseline) {
    const context = await browser.newContext({ storageState });
    try {
      await context.addInitScript(() => {
        const Original = window.Worker; window.__workers = { created: 0, ended: 0 };
        window.Worker = class extends Original { constructor(...args) { super(...args); window.__workers.created++; } terminate() { window.__workers.ended++; super.terminate(); } };
        Object.defineProperty(navigator.mediaDevices, "getUserMedia", { value: async () => {
          const canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 480;
          const draw = canvas.getContext("2d"); const timer = setInterval(() => { draw.fillStyle = "#31505a"; draw.fillRect(0, 0, 640, 480); }, 100);
          const stream = canvas.captureStream(10); const track = stream.getVideoTracks()[0]; const stop = track.stop.bind(track);
          track.stop = () => { clearInterval(timer); stop(); }; window.__track = track; return stream;
        } });
      });
      const page = await context.newPage(); const errors = [];
      page.on("console", event => { if (event.type() === "error") errors.push(event.text()); });
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(`${origin}/patient/exercises/demo-knee-extension/camera?daily=${fixture.cameraFreeDaily}`);
      await page.waitForLoadState("networkidle");
      const group = page.getByRole("group", { name: "ข้างที่ฝึก", exact: true });
      await group.getByRole("button", { name: "ซ้าย", exact: true }).click();
      await page.getByRole("button", { name: "เปิดกล้อง", exact: true }).click();
      await page.getByRole("status").filter({ hasText: "ไม่พบร่างกาย" }).waitFor({ timeout: 90000 });
      check(await group.getByRole("button").first().isDisabled() && await group.getByRole("button").last().isDisabled(), "camera locks selected side");
      check(await page.evaluate(() => window.__workers.created === 1), "one actual MediaPipe worker");
      const debugToggle = page.getByRole("button", { name: "Debug ท่าทดสอบ", exact: true });
      check(await debugToggle.getAttribute("aria-expanded") === "false", "test debug starts closed");
      await debugToggle.click();
      await page.locator("#pose-test-debug").waitFor();
      check((await page.locator("#pose-test-debug").innerText()).includes("รอจัดท่า"), "test debug shows preparation state");
      check((await page.locator("#pose-test-debug").innerText()).includes("Δz"), "test debug includes orientation evidence and criteria");
      await debugToggle.click();
      check(await page.locator("#pose-test-debug").count() === 0 && await page.evaluate(() => window.__workers.created === 1), "closing debug preserves worker and camera");
      const start = page.getByRole("button", { name: "เริ่ม", exact: true });
      await start.click(); await page.getByRole("button", { name: "หยุด", exact: true }).click();
      check(await page.getByRole("button", { name: "บันทึกเซต", exact: true }).isEnabled(), "pause preserves recording slot");
      await start.click(); await page.getByRole("button", { name: "หยุด", exact: true }).click();
      check((await page.locator(".camera-summary strong").first().innerText()).startsWith("0 /"), "blank real inference cannot count reps on resume");
      await page.getByRole("button", { name: "รีเซ็ตเซต", exact: true }).click();
      await page.getByRole("button", { name: "ยืนยัน", exact: true }).click();
      await page.waitForFunction(() => document.querySelector(".pose-primary-actions button:last-child").disabled);
      check(true, "reset clears slot and disables save");
      check(await page.evaluate(() => window.__workers.created === 1 && window.__workers.ended === 0 && window.__track.readyState === "live"), "reset preserves live stream and original model worker");
      await page.waitForFunction(() => document.querySelector('.pose-tracking-card'));
      check(await page.getByRole("button", {name:"ปิดกล้อง",exact:true}).count() === 1, "reset keeps camera open and valid preview config for blank-frame guidance");
      await start.click(); await page.getByRole("button", { name: "หยุด", exact: true }).waitFor();
      const saved = page.waitForResponse(response => response.request().method() === "POST" && /\/training\/sets\//.test(response.url()));
      await page.getByRole("button", { name: "บันทึกเซต", exact: true }).click();
      const result = await saved;
      check(result.ok() && result.request().postDataJSON().side === "left", "same selected side sent to recording");
      await page.getByRole("heading", { name: "บันทึกเซตแล้ว", exact: true }).waitFor();
      check((await result.json()).reps === 0, "partial zero-rep set saved without fake landmarks");
      await page.getByRole("button", { name: "ปิด", exact: true }).click();
      await page.getByRole("button", { name: "ปิดกล้อง", exact: true }).click();
      await page.waitForFunction(() => window.__track.readyState === "ended" && window.__workers.ended === 1);
      check(true, "tracks/worker released; render did not reload model");
      // MediaPipe writes this informational initialization line to stderr; retain all other errors.
      const failures = errors.filter(error => error.trim() !== "INFO: Created TensorFlow Lite XNNPACK delegate for CPU.");
      check(failures.length === 0, `functional flow has no unexpected console/page errors: ${failures.map(error => error.split("\n")[0]).join(" | ")}`);
    } finally { await context.close(); }
  }
  return { checks, evidence, baseline, physicalIPadTested: false, realHumanCameraTested: false };
}
