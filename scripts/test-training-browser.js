// Playwright CLI evaluates this file as a function expression; the runner injects synthetic fixtures.
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
async (page) => {
  const fixture = null /*TRAINING_FIXTURE*/;
  const origin = new URL(page.url()).origin;
  if (!["localhost", "127.0.0.1"].includes(new URL(origin).hostname) || !fixture) throw new Error("Training browser tests require local synthetic fixtures");
  const browser = page.context().browser(); const contexts = []; const pages = []; let checks = 0;
  function check(condition, label) { if (!condition) throw new Error(`Training check failed: ${label}`); checks++; }
  const api = (context, path, data) => context.request.post(`${origin}${path}`, { headers: { Origin: origin }, data });
  try {
    for (let index = 0; index < 2; index++) {
      const context = await browser.newContext({ viewport: { width: index ? 820 : 390, height: index ? 1180 : 844 }, locale: "th-TH" }); contexts.push(context);
      const current = await context.newPage(); pages.push(current);
      await current.goto(origin); await current.waitForLoadState("networkidle");
      await current.locator("#national-id").fill(fixture.accounts[index].nationalId);
      await current.locator("#password").fill(fixture.accounts[index].password);
      await current.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
      await current.waitForURL("**/patient"); await current.waitForLoadState("networkidle");
      check(await current.getByRole("meter").getAttribute("aria-valuenow") === "0", "initial progress zero");
      const empty = await (await context.request.get(`${origin}/api/patient/training/today`)).json();
      check(empty.items.length === 0 && empty.dayId === null && empty.totalSets === 0, "no plan does not freeze a day");
    }
    const a = contexts[0], b = contexts[1];
    await pages[0].goto(`${origin}/patient/plan`); await pages[0].waitForLoadState("networkidle");
    await pages[0].locator("details").filter({ has: pages[0].locator(`input[value='${fixture.templateA}']`) }).locator("summary").click();
    await pages[0].locator(`input[name=training-template][value='${fixture.templateA}']`).check();
    await pages[0].getByRole("button", { name: "บันทึกแผนที่เลือก", exact: true }).click();
    await pages[0].waitForURL("**/patient"); await pages[0].waitForLoadState("networkidle");
    const planA = (await (await a.request.get(`${origin}/api/patient/training/plan`)).json()).plan;
    check(planA.templateId === fixture.templateA && planA.items.length === 2, "UI selection persisted");
    await pages[0].reload(); await pages[0].waitForLoadState("networkidle");
    check((await (await a.request.get(`${origin}/api/patient/training/plan`)).json()).plan.id === planA.id, "reload retains plan");
    const repeated = await Promise.all(Array.from({ length: 5 }, () => api(a, "/api/patient/training/plan", { templateId: fixture.templateA })));
    const repeatedResults = await Promise.all(repeated.map(response => response.json()));
    check(repeatedResults.every(result => result.plan.id === planA.id && result.reused), "repeat selection idempotent");
    const concurrent = await Promise.all(Array.from({ length: 5 }, () => api(b, "/api/patient/training/plan", { templateId: fixture.templateA })));
    const results = await Promise.all(concurrent.map(response => response.json()));
    check(results.every(result => result.plan.id === results[0].plan.id) && results.filter(result => !result.reused).length === 1, "first concurrent selection creates one plan");
    const todayA = await (await a.request.get(`${origin}/api/patient/training/today`)).json();
    const todayB = await (await b.request.get(`${origin}/api/patient/training/today`)).json();
    check(todayA.items.length === 2 && todayA.totalSets === 9 && todayA.savedSets === 0 && todayA.percent === 0, "daily frequency and initial progress");
    check(todayA.dayId !== todayB.dayId && todayA.items.every(item => todayB.items.every(other => item.id !== other.id)), "daily assignment isolation");
    const repeatedDays = await Promise.all(Array.from({ length: 5 }, () => a.request.get(`${origin}/api/patient/training/today`)));
    const days = await Promise.all(repeatedDays.map(response => response.json()));
    check(days.every(day => day.dayId === todayA.dayId && day.items.map(item => item.id).join() === todayA.items.map(item => item.id).join()), "daily idempotency");
    check((await api(a, "/api/patient/training/plan", { templateId: fixture.templateB, patientId: fixture.accounts[1].id })).status() === 400, "patient injection rejected");
    check((await api(a, "/api/patient/training/plan", { templateId: fixture.templateB, targetSets: 99 })).status() === 400, "patient cannot override clinician targets");
    check((await api(a, "/api/patient/training/plan", { templateId: fixture.invalidTemplate })).status() === 422, "patient-authored template rejected");
    check((await a.request.get(`${origin}/api/patient/training/today?date=9999-01-01`)).status() === 400, "browser cannot choose day");
    const item = todayA.items.find(item => item.exercise.code === "seated-trunk");
    const guide = `${origin}/patient/exercises/${item.exercise.code}/guide?daily=${item.id}`;
    const camera = `${origin}/patient/exercises/${item.exercise.code}/camera?daily=${item.id}`;
    check((await b.request.get(`${origin}/api/patient/training/daily/${item.id}`)).status() === 404, "cannot read other daily exercise");
    await pages[1].goto(camera); await pages[1].waitForLoadState("networkidle");
    await pages[1].screenshot({ path: "test-results/training-denied.png" });
    check(await pages[1].getByRole("heading", { name: "404", exact: true }).isVisible(), "other patient's camera blocked");
    await pages[0].goto(`${origin}/patient/exercises/bridging/camera?daily=${item.id}`); await pages[0].waitForLoadState("networkidle");
    check(await pages[0].getByRole("heading", { name: "404", exact: true }).isVisible(), "exercise code mismatch blocked");
    await pages[0].goto(guide); await pages[0].getByRole("link", { name: "ไปหน้ากล้อง", exact: true }).click();
    await pages[0].waitForLoadState("networkidle");
    check(pages[0].url() === camera && (await pages[0].locator(".summary-band strong").first().textContent()).includes("10"), "camera receives actual target");
    check(await pages[0].getByRole("button", { name: "ยังไม่เปิดบันทึกผล", exact: true }).isDisabled(), "camera cannot save mock results to real progress");
    await pages[0].getByRole("button", { name: "เริ่ม / ทำต่อ", exact: true }).click();
    await pages[0].getByRole("button", { name: "หยุดพัก", exact: true }).waitFor();
    check(await pages[0].getByRole("button", { name: "การแสดงผล", exact: true }).count() === 0, "active camera has no settings entry");
    await pages[0].getByRole("button", { name: "เพิ่มครั้งตัวอย่าง", exact: true }).click();
    await pages[0].getByRole("button", { name: "หยุดพัก", exact: true }).click();
    await pages[0].getByRole("button", { name: "การแสดงผล", exact: true }).click();
    await pages[0].getByRole("button", { name: "เสร็จสิ้น", exact: true }).click();
    check(await pages[0].getByRole("region", { name: "พักการฝึก" }).isVisible() && (await pages[0].locator(".summary-band strong").first().textContent()).includes("1 / 10"), "settings keep paused counters");
    check((await (await a.request.get(`${origin}/api/patient/training/today`)).json()).savedSets === 0, "sample camera does not count progress");
    for (const width of [390, 820, 1180, 1440]) for (const theme of ["light", "dark"]) for (const size of ["m", "l", "xl"]) {
      await a.addCookies([{ name: "more-theme", value: theme, url: origin }, { name: "more-font-size", value: size, url: origin }]);
      await pages[0].setViewportSize({ width, height: width === 390 ? 844 : width === 1180 ? 820 : 1000 });
      for (const path of ["/patient", "/patient/plan", "/patient/exercises", camera.slice(origin.length)]) {
        await pages[0].goto(origin + path); await pages[0].waitForLoadState("networkidle");
        check(await pages[0].evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "responsive training overflow");
        if (theme === "dark" && size === "xl" && [390, 820, 1440].includes(width)) {
          const name = path.includes("camera") ? "camera" : path === "/patient" ? "home" : path.endsWith("plan") ? "plan" : "today";
          await pages[0].screenshot({ path: `test-results/training-${name}-${width}.png`, fullPage: true });
        }
      }
    }
    const anonymous = await browser.newContext();
    for (const path of ["templates", "plan", "today", `daily/${item.id}`]) check((await anonymous.request.get(`${origin}/api/patient/training/${path}`)).status() === 401, "anonymous API blocked");
    await anonymous.close();
    return { browserChecks: checks, responsiveCombinations: 96, dayA: todayA.dayId, dayB: todayB.dayId, itemA: item.id, itemB: todayB.items.find(item => item.exercise.code === "seated-trunk").id };
  } finally { for (const context of contexts) await context.close(); }
}
