// eslint-disable-next-line @typescript-eslint/no-unused-expressions
async (sessionPage) => {
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  const account = null /*ACCOUNT*/;
  let checks = 0;
  const check = (value, label) => { if (!value) throw new Error(`Camera flow: ${label}`); checks++; };
  const origin = "http://localhost:3001";
  await page.goto(origin);
  await page.getByRole("textbox", { name: "รหัสบัตรประชาชน", exact: true }).fill(account.nationalId);
  await page.getByRole("textbox", { name: "รหัสผ่าน", exact: true }).fill(account.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await page.waitForURL("**/patient");
  await page.goto(origin + "/patient/plan");
  await page.locator("summary").filter({ hasText: "Module" }).click();
  check(await page.getByRole("checkbox").count() === 1, "only one test exercise");
  await page.getByRole("checkbox").check();
  check(await page.getByLabel("เซต", { exact: true }).inputValue() === "1", "one set default");
  check(await page.getByLabel("ครั้ง / เซต", { exact: true }).inputValue() === "5", "five reps default");
  await page.getByLabel("เซต", { exact: true }).fill("2");
  await page.getByRole("combobox").selectOption("right");
  for (const width of [390, 820, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "responsive plan");
    await page.screenshot({ path: `output/playwright/camera-plan-${width}.png`, fullPage: true });
  }
  await page.getByRole("button", { name: "ยืนยันและบันทึกแผน" }).click();
  await page.waitForURL("**/patient/exercises");
  await page.getByRole("link", { name: "เริ่มฝึก", exact: true }).click();
  await page.getByRole("link", { name: "ไปหน้ากล้อง" }).click();
  check(await page.getByLabel("ข้างที่ฝึก").inputValue() === "right", "side carried through plan");
  check(await page.getByRole("button", { name: "รอบจำลอง", exact: true }).count() === 0, "no simulated repetitions");
  await page.evaluate(() => {
    window.__cameraWorkers = 0; window.__endedWorkers = 0;
    const Original = window.Worker;
    window.Worker = class extends Original {
      constructor(...args) { super(...args); window.__cameraWorkers++; }
      terminate() { window.__endedWorkers++; super.terminate(); }
    };
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", { configurable: true, value: async () => {
      if (window.__denyCamera) throw new DOMException("Test denied", "NotAllowedError");
      const canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 480;
      const draw = canvas.getContext("2d"); let tick = 0;
      const timer = setInterval(() => { draw.fillStyle = tick++ % 2 ? "#31505a" : "#315a50"; draw.fillRect(0, 0, 640, 480); }, 100);
      const stream = canvas.captureStream(10); const track = stream.getVideoTracks()[0]; const stop = track.stop.bind(track);
      track.stop = () => { clearInterval(timer); stop(); }; window.__cameraTrack = track; return stream;
    } });
    window.__denyCamera = true;
  });
  await page.getByRole("button", { name: "เปิดกล้อง", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "ไม่ได้รับสิทธิ์กล้อง" }).waitFor(); checks++;
  await page.evaluate(() => { window.__denyCamera = false; });
  await page.getByRole("button", { name: "เปิดกล้อง", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "ไม่พบร่างกาย" }).waitFor({ timeout: 60000 });
  check(await page.evaluate(() => window.__cameraWorkers === 1 && document.querySelector("video").videoWidth === 640), "actual MediaPipe worker loaded");
  await page.getByRole("button", { name: /^(เริ่ม|ทำต่อ)$/, exact: true }).click();
  await page.getByRole("button", { name: "หยุด", exact: true }).click();
  check(await page.getByText("0 / 5", { exact: true }).count() > 0, "no phantom reps");
  await page.getByRole("button", { name: /^(เริ่ม|ทำต่อ)$/, exact: true }).click();
  await page.getByRole("button", { name: "บันทึกเซต", exact: true }).click();
  await page.getByRole("heading", { name: "บันทึกเซตแล้ว" }).waitFor(); checks++;
  check(await page.getByRole("dialog").getByText(/มุมสูงสุด: -/).count() === 1, "zero rep has no invented angle");
  await page.getByRole("dialog").getByRole("link", { name: "ดูแผนวันนี้" }).click();
  check(await page.getByText("1 / 2 เซตที่บันทึก", { exact: true }).count() > 0, "saved progress");
  await page.goto(origin + "/patient/progress");
  check(await page.getByText(/DEMO นั่งเหยียดขา/).count() > 0, "saved history");
  return { checks, realModelOnBlankVideo: true, humanCameraVerified: false, savedZeroRepSet: true };
}
