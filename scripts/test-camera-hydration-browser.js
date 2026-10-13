// Local temporary fixtures supplied by test-recording.mjs; never log credentials.
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
async (sessionPage) => {
  const fixture = null /*RECORDING_FIXTURE*/;
  const baseline = false /*HYDRATION_BASELINE*/;
  const origin = fixture.origin || new URL(sessionPage.url()).origin;
  let checks = 0; const evidence = [];
  const check = (value, label) => { if (!value) throw new Error(`Camera hydration: ${label}`); checks++; };
  const browser = sessionPage.context().browser();
  const auth = await browser.newContext({ ignoreHTTPSErrors: true });
  const login = await auth.request.post(origin + "/api/auth/login", { headers: { Origin: origin }, data: { nationalId: fixture.nationalId, password: fixture.password } });
  check(login.ok(), "fixture login"); const storageState = await auth.storageState(); await auth.close();
  for (const assigned of [true, false]) for (const inject of [false, true]) {
    const context = await browser.newContext({ ignoreHTTPSErrors: true, storageState, viewport: { width: 820, height: 1180 }, locale: "th-TH" });
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
      await page.locator('.pose-side-control').waitFor({ state: "attached" });
      const html = await response.text();
      check(!/__gcruniqueid/i.test(html), "attribute absent from server response");
      const before = await page.evaluate(source => {
        const parsed = new DOMParser().parseFromString(source, "text/html");
        const selector = '.pose-side-control';
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
        const group = page.locator(".pose-side-control");
        if (assigned) check(await group.locator('.pose-side-value').innerText() === "ขวา" && await group.getByRole('button').count() === 0, "assigned side is read only");
        else { await group.getByRole('button', {name:"ซ้าย",exact:true}).click(); check(await group.locator('.pose-side-value').innerText() === "ซ้าย" && await group.getByRole('button').count() === 0, "selected side becomes read only"); }
      }
      for (let i = 0; i < 2; i++) await page.reload({ waitUntil: "networkidle" });
      check(errors.filter(error => /hydrated|hydration|didn't match/i.test(error)).length === warnings.length, "two network reloads introduce no warning");
      await page.getByRole("button", { name: "ออก", exact: true }).click().catch(()=>{throw Error("camera exit button unavailable")}); await page.waitForURL("**/patient/exercises");
      await page.locator(`a[href*="/guide?daily=${daily}"]`).click().catch(()=>{throw Error("exercise guide link unavailable")}); await page.waitForURL(`**/guide?daily=${daily}`);
      await page.getByRole("link", { name: "เริ่มฝึก", exact: true }).click().catch(()=>{throw Error("guide start link unavailable")}); await page.waitForURL(url);
      check(errors.filter(error => /hydrated|hydration|didn't match/i.test(error)).length === warnings.length, "internal navigation adds no warning");
    } finally { release?.(); await context.close(); }
  }
  if (!baseline) {
    const context = await browser.newContext({ ignoreHTTPSErrors: true, storageState });
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
      const group = page.locator(".pose-side-control");
      await group.getByRole("button", { name: "ซ้าย", exact: true }).click();
      await page.getByRole("button", { name: "เปิดกล้อง", exact: true }).click();
      await page.getByRole("status").filter({ hasText: "ไม่พบร่างกาย" }).waitFor({ timeout: 90000 });
      check(await group.getByRole("button").count() === 0 && await group.locator(".pose-side-value").innerText() === "ซ้าย", "camera locks selected side");
      check(await page.evaluate(() => window.__workers.created === 1), "one actual MediaPipe worker");
      check(await page.getByRole("button", { name: "Debug ท่าทดสอบ", exact: true }).count() === 0, "patient has no technical debug");
      const start = page.getByRole("button", { name: "เริ่ม", exact: true });
      check(await start.isEnabled(), "start arms automatic preparation even before pose is found");
      check(await page.locator(".pose-chain-check button").count() === 0, "no manual confirmation button");
      check(await page.getByRole("button", { name: "บันทึกเซต", exact: true }).isDisabled(), "trial does not allocate a recording slot");
      await page.getByRole("button", { name: "รีเซ็ตเซต", exact: true }).click();
      check(await page.evaluate(() => window.__workers.created === 1 && window.__workers.ended === 0 && window.__track.readyState === "live"), "reset preserves loaded worker and camera stream");
      check(await page.locator(".pose-chain-check").count() === 1 && await start.isEnabled(), "reset permits Start but does not acquire missing pose");
      await page.getByRole("button", { name: "ปิดกล้อง", exact: true }).click();
      await page.waitForFunction(() => window.__track.readyState === "ended" && window.__workers.ended === 1);
      check(true, "tracks/worker released; render did not reload model");
      await page.goto(origin + "/patient");
      for (const [width,height] of [[390,844],[390,740],[844,390],[834,1194],[834,1050],[1440,900]]) {
        await page.setViewportSize({width,height});
        await page.evaluate(()=>window.scrollTo(0,0));
        await page.waitForTimeout(100);
        const logout=page.getByRole("button",{name:"ออกจากระบบ",exact:true});
        check(await logout.isVisible() && (await logout.innerText()).includes("ออกจากระบบ"), `patient logout has visible text at ${width}`);
        check(await page.getByText("โหมดทดสอบกล้อง · ผลทดสอบระบบ ไม่ใช่ผลฝึกทางคลินิก",{exact:true}).count()===0,"home hides camera test banner");
        await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
        const bounds=await page.evaluate(()=>{
          const nav=document.querySelector('.app-navigation').getBoundingClientRect(),sidebar=document.querySelector('.app-sidebar'),button=document.querySelector('.app-logout button').getBoundingClientRect();
          return {bottom:nav.bottom,innerHeight:innerHeight,sidebarPosition:getComputedStyle(sidebar).position,navLeft:nav.left,buttonRight:button.right,buttonTop:button.top,overflow:document.documentElement.scrollWidth>innerWidth};
        });
        check(!bounds.overflow,"patient shell has no horizontal overflow");
        if(width<1024){
          check(Math.abs(bounds.bottom-height)<2 && bounds.sidebarPosition==='fixed',"mobile/tablet navigation remains pinned after scroll");
          check(await page.evaluate(()=>{
            const sidebar=document.querySelector('.app-sidebar');
            return Math.abs(sidebar.getBoundingClientRect().bottom-(visualViewport.offsetTop+visualViewport.height))<2;
          }),"navigation follows visible viewport bottom");
        }
        else check(bounds.navLeft<260 && bounds.sidebarPosition==='sticky',"desktop uses sidebar");
        await page.evaluate(()=>window.scrollTo(0,0));
        const button=await logout.boundingBox();check(button.x+button.width>width-50 && button.y<90,"logout is top right");
        await page.screenshot({path:`output/playwright/patient-home-${width}.png`,fullPage:false});
      }
      // MediaPipe writes this informational initialization line to stderr; retain all other errors.
      const failures = errors.filter(error => error.trim() !== "INFO: Created TensorFlow Lite XNNPACK delegate for CPU.");
      check(failures.length === 0, `functional flow has no unexpected console/page errors: ${failures.map(error => error.split("\n")[0]).join(" | ")}`);
    } finally { await context.close(); }
  }
  return { checks, evidence, baseline, physicalIPadTested: false, realHumanCameraTested: false };
}
