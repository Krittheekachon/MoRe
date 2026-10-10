// Credentials are injected into an ignored temporary file by test-demo.mjs.
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
async (page) => {
  const fixture = null /*DEMO_FIXTURE*/;
  const origin = "http://localhost:3001";
  const browser = page.context().browser();
  const a = await browser.newContext({ viewport: { width: 820, height: 1180 }, locale: "th-TH" });
  const b = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const d = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  let checks = 0;
  const check = (value, label) => { if (!value) throw new Error(`Demo check: ${label}`); checks++; };
  async function api(context, path, method = "GET", data) {
    const response = await context.request.fetch(origin + path, { method, ...(data === undefined ? {} : { data, headers: { Origin: origin, "Content-Type": "application/json" } }) });
    return { status: response.status(), body: await response.json() };
  }
  async function login(context, index) {
    const current = await context.newPage(); await current.goto(origin); await current.waitForLoadState("networkidle");
    await current.locator("#national-id").fill(fixture.accounts.patients[index].nationalId);
    await current.locator("#password").fill(fixture.accounts.patients[index].password);
    await current.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click(); await current.waitForURL("**/patient");
    await current.waitForLoadState("networkidle"); return current;
  }
  try {
    const pa = await login(a, 0); const pb = await login(b, 1);
    check((await a.cookies()).some(cookie => cookie.name === "more_account" && cookie.httpOnly && cookie.sameSite === "Lax"), "HttpOnly session");
    await pa.reload(); await pa.waitForLoadState("networkidle"); check(pa.url().endsWith("/patient"), "session reload");
    const templates = (await api(a, "/api/patient/training/templates")).body.templates;
    check(templates.length >= 2 && templates.every(template => template.code.startsWith("DEMO-")), "isolated Demo templates");
    await pa.goto(origin + "/patient/plan"); await pa.waitForLoadState("networkidle");
    if (!await pa.getByRole("radio").first().isVisible()) await pa.locator(".exercise-picker-module summary").first().click();
    await pa.getByRole("radio").first().check(); await pa.getByRole("button", { name: "บันทึกแผนที่เลือก" }).click();
    await pa.waitForURL("**/patient"); await pa.waitForLoadState("networkidle");
    const planBefore = (await api(a, "/api/patient/training/plan")).body.plan;
    const repeat = await Promise.all([api(a, "/api/patient/training/plan", "POST", { templateId: planBefore.templateId }), api(a, "/api/patient/training/plan", "POST", { templateId: planBefore.templateId })]);
    check(repeat.every(result => result.status === 200 && result.body.reused && result.body.plan.id === planBefore.id), "concurrent plan retries reused");
    await api(b, "/api/patient/training/plan", "POST", { templateId: templates[1].id });
    const today = (await api(a, "/api/patient/training/today")).body;
    const todayB = (await api(b, "/api/patient/training/today")).body;
    const item = today.items[0]; const itemB = todayB.items[0];
    check(item.id !== itemB.id, "distinct own daily items");
    check((await api(b, `/api/patient/training/daily/${item.id}`)).status === 404, "other daily denied");
    const cameraURL = `${origin}/patient/exercises/${item.exercise.code}/camera?daily=${item.id}`;
    await pa.goto(`${origin}/patient/exercises/${item.exercise.code}/guide?daily=${item.id}`); await pa.waitForLoadState("networkidle");
    await pa.getByRole("link", { name: "ไปหน้ากล้อง" }).click(); await pa.waitForLoadState("networkidle");
    await pa.getByRole("radio", { name: "รอบจำลอง (ไม่ใช่ AI)" }).check();
    const captured = [];
    if (!fixture.resume) {
    await pa.getByRole("button", { name: /^(เริ่ม|ทำต่อ)$/, exact: true }).click();
    await pa.getByRole("button", { name: "หยุด", exact: true }).waitFor();
    check(await pa.locator(".app-main .display-trigger, .app-main .display-menu").count() === 0, "no settings while active");
    await pa.getByRole("button", { name: "รอบจำลอง", exact: true }).click();
    await pa.waitForFunction(() => document.querySelector(".camera-summary strong").textContent.startsWith("1 /"));
    await pa.getByRole("button", { name: "หยุด", exact: true }).click();
    await pa.locator(".pause-panel").waitFor();
    await pa.locator(".pause-panel").getByRole("button", { name: "การแสดงผล", exact: true }).click();
    await pa.getByRole("button", { name: "เสร็จสิ้น", exact: true }).click();
    check(await pa.locator(".pause-panel").isVisible(), "display panel keeps paused");
    pa.on("request", request => { if (/\/api\/patient\/training\/sets\/\d+$/.test(request.url()) && request.method() === "POST") captured.push({ url: request.url(), data: request.postDataJSON() }); });
    let abortOnce = true;
    await pa.route("**/api/patient/training/sets/*", async route => {
      if (route.request().method() !== "POST" || !abortOnce) return route.continue();
      abortOnce = false; await route.fetch(); await route.abort("failed");
    });
    await pa.getByRole("button", { name: "บันทึกเซต", exact: true }).click();
    await pa.getByRole("button", { name: "ลองบันทึกอีกครั้ง", exact: true }).waitFor();
    await pa.getByRole("button", { name: "ลองบันทึกอีกครั้ง", exact: true }).click();
    await pa.getByRole("heading", { name: "บันทึกเซตแล้ว" }).waitFor();
    await pa.unroute("**/api/patient/training/sets/*");
    check(captured.length === 2 && JSON.stringify(captured[0].data) === JSON.stringify(captured[1].data), "save retry frozen identical payload");
    } else captured.push({ url: `${origin}/api/patient/training/sets/${fixture.resume.id}`, data: fixture.resume.payload });
    const setId = Number(captured[0].url.split("/").pop());
    const retried = await Promise.all([api(a, `/api/patient/training/sets/${setId}`, "POST", captured[0].data), api(a, `/api/patient/training/sets/${setId}`, "POST", captured[0].data)]);
    check(retried.every(result => result.status === 200 && result.body.reps === 1 && result.body.maxAngle === 150 && result.body.averageAngle === 150), "HTTP saved-set retry remains idempotent");
    check((await api(a, `/api/patient/training/sets/${setId}`, "POST", { ...captured[0].data, elapsedSeconds: captured[0].data.elapsedSeconds + 1 })).status === 409, "changed save retry rejected");
    check((await api(b, `/api/patient/training/sets/${setId}`, "POST", captured[0].data)).status === 404, "other patient save denied");
    const result = (await api(a, "/api/patient/results")).body.sessions;
    const ownSession = result.find(session => session.sets.some(set => set.id === setId));
    check(!!ownSession && ownSession.sets.find(set => set.id === setId).repetitions.length === 1, "saved partial set reads actual result without duplicates");
    check(ownSession.sets.find(set => set.id === setId).repetitions[0].metrics[0].peak === 150, "saved max 150");
    check(!(await api(b, "/api/patient/results")).body.sessions.some(session => session.id === ownSession.id), "history isolated");
    await pb.goto(`${origin}/patient/sessions/${ownSession.id}`); await pb.waitForLoadState("networkidle");
    check(await pb.getByRole("heading", { name: "404", exact: true }).count() === 1, "other patient detail denied");
    if (!fixture.resume) await pa.getByRole("button", { name: "เซตถัดไป", exact: true }).click();
    await pa.getByRole("button", { name: /^(เริ่ม|ทำต่อ)$/, exact: true }).click(); await pa.getByRole("button", { name: "หยุด", exact: true }).waitFor();
    await pa.getByRole("button", { name: "รอบจำลอง", exact: true }).click();
    await pa.waitForFunction(() => document.querySelector(".camera-summary strong").textContent.startsWith("1 /"));
    await pa.getByRole("button", { name: "รอบจำลอง", exact: true }).waitFor({ state: "visible" });
    await pa.waitForTimeout(250);
    await pa.getByRole("button", { name: "รอบจำลอง", exact: true }).click();
    await pa.waitForTimeout(700); await pa.getByRole("button", { name: "หยุด", exact: true }).click();
    await pa.getByRole("button", { name: /^(เริ่ม|ทำต่อ)$/, exact: true }).click(); await pa.waitForTimeout(1100);
    check((await pa.locator(".camera-summary strong").first().innerText()).startsWith("1 /"), "pause interrupts unfinished cycle and preserves completed rep");
    await pa.getByRole("button", { name: "รีเซ็ตเซต", exact: true }).click();
    await pa.getByRole("button", { name: "ยืนยัน", exact: true }).click();
    check((await api(a, "/api/patient/training/today")).body.items[0].savedSets === item.savedSets + (fixture.resume ? 0 : 1), "restart keeps saved sets");
    await pa.getByRole("button", { name: /^(เริ่ม|ทำต่อ)$/, exact: true }).click(); await pa.getByRole("button", { name: "หยุด", exact: true }).waitFor();
    await pa.getByRole("button", { name: "ออก", exact: true }).click(); await pa.getByRole("button", { name: "ยืนยัน", exact: true }).click(); await pa.waitForURL("**/patient/exercises");
    check((await api(a, "/api/patient/training/today")).body.items[0].savedSets === item.savedSets + (fixture.resume ? 0 : 1), "exit keeps saved sets");
    const profile = (await api(a, "/api/patient/profile")).body.profile;
    check((await api(a, "/api/patient/profile", "PATCH", { full_name: profile.full_name, date_of_birth: profile.date_of_birth, sex: profile.sex, phone: "0000000000", primary_doctor_name: "DEMO", other_conditions: profile.other_conditions || "" })).status === 200, "own profile update");
    await pa.goto(origin + "/patient/profile"); await pa.reload(); await pa.waitForLoadState("networkidle");
    await pa.screenshot({ path: "output/playwright/demo-profile-debug.png", fullPage: true });
    check((await api(a, "/api/patient/profile")).body.profile.phone === "0000000000", "profile API persisted");
    await pa.getByText("0000000000", { exact: true }).waitFor(); check(true, "profile reload persisted");
    const pd = await d.newPage(); await pd.goto(origin + "/doctor/login"); await pd.waitForLoadState("networkidle");
    await pd.locator('[name="login-name"]').fill(fixture.accounts.doctor.loginName); await pd.locator('[name="password"]').fill(fixture.accounts.doctor.password);
    await pd.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click(); await pd.waitForURL("**/doctor"); await pd.waitForLoadState("networkidle");
    await pd.getByRole("heading", { name: "ผู้ป่วย", exact: true }).waitFor();
    check(await pd.getByRole("heading", { name: "ผู้ป่วย", exact: true }).count() === 1, "doctor actual login");
    const medical = await api(d, `/api/doctor/patients/${fixture.manifest.patients[0].id}`);
    check(medical.status === 200 && medical.body.sessions.some(session => session.id === ownSession.id), "doctor reads same actual results");
    check((await api(d, `/api/doctor/patients/${fixture.manifest.patients[0].id}`, "PATCH", { medicalNotes: "DEMO browser verification only" })).status === 200, "doctor notes save");
    check((await api(d, `/api/doctor/patients/${fixture.manifest.patients[0].id}`)).body.profile.medical_notes === "DEMO browser verification only", "doctor notes readback");
    check((await api(a, `/api/doctor/patients/${fixture.manifest.patients[0].id}`)).status === 403, "patient cannot use doctor API");
    if (fixture.realPatientId) check((await api(d, `/api/doctor/patients/${fixture.realPatientId}`)).status === 404, "demo doctor cannot access non-demo patient");
    await pd.goto(`${origin}/doctor/patients/${fixture.manifest.patients[0].id}/sessions/${ownSession.id}`); await pd.waitForLoadState("networkidle");
    check((await pd.locator("body").innerText()).includes("150.00"), "doctor per-repetition angles");
    await pd.goto(origin + "/doctor/templates"); await pd.waitForLoadState("networkidle");
    const templateWrites = [];
    pd.on("request", request => { if (request.url().endsWith("/api/doctor/templates") && request.method() === "POST") templateWrites.push(request.postDataJSON()); });
    await pd.getByRole("button", { name: "แผนใหม่", exact: true }).click(); await pd.getByLabel("ชื่อแผน", { exact: true }).fill("ทดลองสร้างจาก browser");
    await pd.locator(".plan-exercise input[type=checkbox]").first().check();
    await pd.getByRole("button", { name: "บันทึกแผน", exact: true }).click();
    await pd.getByRole("status").filter({ hasText: "บันทึกเวอร์ชันแล้ว" }).waitFor(); check(true, "doctor template authoring persists");
    const templateRetry = await api(d, "/api/doctor/templates", "POST", templateWrites[0]);
    check(templateRetry.status === 200 && templateRetry.body.reused, "template request idempotent");
    check((await api(d, "/api/doctor/templates", "POST", { ...templateWrites[0], name: "different" })).status === 409, "changed template retry rejected");
    const revised = await api(d, "/api/doctor/templates", "POST", { ...templateWrites[0], requestId: await pd.evaluate(() => crypto.randomUUID()), baseId: templateRetry.body.id, name: "ทดลองเวอร์ชันใหม่", items: templateWrites[0].items.map(item => ({ ...item, sets: 2 })) });
    check(revised.status === 200, "template version stored transactionally");
    check((await api(a, "/api/patient/training/today")).body.items[0].targetSets === item.targetSets, "template edit leaves patient snapshot unchanged");
    const assignment = await api(d, `/api/doctor/patients/${fixture.manifest.patients[0].id}`, "POST", { templateId: revised.body.id });
    check(assignment.status === 200 && assignment.body.plan.startsAt.slice(0, 10) >= today.date, "doctor assigns next-day plan without deleting history");
    check((await api(a, "/api/patient/training/today")).body.items[0].id === item.id, "doctor assignment retains today's snapshot");
    for (const width of [390, 820, 1180, 1440]) for (const theme of ["light", "dark"]) for (const size of ["m", "l", "xl"]) {
      await a.addCookies([{ name: "more-theme", value: theme, domain: "localhost", path: "/" }, { name: "more-font-size", value: size, domain: "localhost", path: "/" }]);
      await d.addCookies([{ name: "more-theme", value: theme, domain: "localhost", path: "/" }, { name: "more-font-size", value: size, domain: "localhost", path: "/" }]);
      const height = width === 390 ? 844 : width === 1180 ? 820 : 1180;
      await pa.setViewportSize({ width, height }); await pd.setViewportSize({ width, height });
      for (const path of ["/patient/progress", "/patient/progress/calendar", `/patient/sessions/${ownSession.id}`, cameraURL.replace(origin, "")]) {
        await pa.goto(origin + path); await pa.waitForLoadState("networkidle");
        check(await pa.evaluate(({ theme, size }) => document.documentElement.dataset.theme === theme && document.documentElement.dataset.size === size, { theme, size }), `patient applied ${theme}/${size}`);
        check(await pa.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `patient fits ${width}/${theme}/${size}/${path}`);
      }
      for (const path of ["/doctor", "/doctor/templates", `/doctor/patients/${fixture.manifest.patients[0].id}/sessions/${ownSession.id}`]) {
        await pd.goto(origin + path); await pd.waitForLoadState("networkidle");
        check(await pd.evaluate(({ theme, size }) => document.documentElement.dataset.theme === theme && document.documentElement.dataset.size === size, { theme, size }), `doctor applied ${theme}/${size}`);
        check(await pd.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `doctor fits ${width}/${theme}/${size}/${path}`);
      }
      if (theme === "dark" && size === "xl") { await pa.screenshot({ path: `output/playwright/demo-camera-${width}.png`, fullPage: true }); await pd.screenshot({ path: `output/playwright/demo-doctor-${width}.png`, fullPage: true }); }
    }
    await pa.getByRole("button", { name: "ออกจากระบบ", exact: true }).first().click(); await pa.waitForURL(origin + "/");
    check((await api(a, "/api/patient/results")).status === 401, "logout API denied");
    await pa.goto(origin + "/patient/profile"); await pa.waitForURL(origin + "/"); check(pa.url() === origin + "/", "logout protected page redirect");
    await pd.getByRole("button", { name: "ออกจากระบบ", exact: true }).click(); await pd.waitForURL(origin + "/doctor/login");
    check((await api(d, `/api/doctor/patients/${fixture.manifest.patients[0].id}`)).status === 401, "doctor logout API denied");
    await pd.goto(origin + "/doctor"); await pd.waitForURL(origin + "/doctor/login"); check(true, "doctor logout page redirect");
    return { checks, responsiveCombinations: 24, savedSetId: setId, sessionId: ownSession.id, resumedFromExistingResult: !!fixture.resume, realHumanCameraTested: false };
  } finally { await a.close(); await b.close(); await d.close(); }
}
