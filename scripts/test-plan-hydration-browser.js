// CLI function: the runner injects one existing synthetic account privately.
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
async (sessionPage) => {
  const fixture = null /*HYDRATION_ACCOUNT*/;
  const expectInjectedWarning = false /*EXPECT_WARNING*/;
  const origin = new URL(sessionPage.url()).origin;
  let checks = 0;
  const evidence = [];
  const check = (value, label) => { if (!value) throw new Error(`Plan hydration: ${label}`); checks++; };
  // Authenticate once, then reuse that session across isolated preference cases.
  // Repeated hydration cases must not consume the account's login rate limit.
  const auth = await sessionPage.context().browser().newContext();
  const login = await auth.request.post(origin + "/api/auth/login", { headers: { Origin: origin }, data: fixture });
  check(login.ok(), "synthetic login");
  const state = await auth.storageState();
  await auth.close();
  const scenarios = [
    { name: "clean-light", theme: "light", size: "m", colorScheme: "light" },
    { name: "clean-dark", theme: "dark", size: "xl", colorScheme: "dark" },
    { name: "clean-system", theme: "system", size: "l", colorScheme: "dark" },
    { name: "chrome-ios-attributes", theme: "dark", size: "xl", colorScheme: "dark", frame: "__gCrRemoteFrameToken" },
    { name: "reported-frame-spelling", theme: "light", size: "m", colorScheme: "light", frame: "__gcremoteframetoken" },
    { name: "unsuppressed-child-control", theme: "light", size: "m", colorScheme: "light", child: true },
  ];
  for (const scenario of scenarios) {
    const context = await sessionPage.context().browser().newContext({ storageState: state, viewport: { width: 820, height: 1180 }, locale: "th-TH", colorScheme: scenario.colorScheme });
    let release;
    try {
      await context.addCookies([{ name: "more-theme", value: scenario.theme, url: origin }, { name: "more-font-size", value: scenario.size, url: origin }]);
      const page = await context.newPage();
      const errors = [];
      page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
      page.on("pageerror", error => errors.push(error.message));
      const gate = new Promise(resolve => { release = resolve; });
      await page.route("**/*", async route => {
        if (route.request().resourceType() === "script") await gate;
        await route.continue();
      });
      const response = await page.goto(origin + "/patient/plan", { waitUntil: "commit" });
      await page.locator('.training-picker input[type="search"]').waitFor({ state: "attached" });
      const html = await response.text();
      check(!/__gcr(?:uniqueid|r?emoteframetoken)/i.test(html), "server sends no Chrome attributes");
      const before = await page.evaluate(serverHTML => {
        const parsed = new DOMParser().parseFromString(serverHTML, "text/html");
        const attrs = element => Object.fromEntries([...element.attributes].map(a => [a.name, a.value]).sort(([a], [b]) => a.localeCompare(b)));
        return { serverRoot: attrs(parsed.documentElement), domRoot: attrs(document.documentElement), serverInput: attrs(parsed.querySelector('.training-picker input[type="search"]')), domInput: attrs(document.querySelector('.training-picker input[type="search"]')) };
      }, html);
      check(JSON.stringify(before.serverRoot) === JSON.stringify(before.domRoot), "html attributes match before hydration");
      check(JSON.stringify(before.serverInput) === JSON.stringify(before.domInput), "search attributes match before hydration");
      check(before.domRoot["data-theme"] === scenario.theme && before.domRoot["data-size"] === scenario.size && before.domInput.value === "", "initial theme/font/query deterministic");
      if (scenario.frame || scenario.child) await page.evaluate(value => {
        if (value.frame) {
          document.documentElement.setAttribute(value.frame, "software-test-token");
          document.querySelector('.training-picker input[type="search"]').setAttribute("__gCrUniqueID", "1");
        }
        if (value.child) document.querySelector(".exercise-picker-search").setAttribute("data-hydration-negative-control", "1");
      }, { frame: scenario.frame, child: scenario.child });
      release();
      await page.waitForLoadState("networkidle");
      const hydrationErrors = errors.filter(error => /hydrated|hydration|didn't match|server rendered HTML/i.test(error));
      const shouldWarn = !!scenario.child || (!!scenario.frame && expectInjectedWarning);
      check(shouldWarn ? hydrationErrors.length > 0 : errors.length === 0, "expected warning scope");
      evidence.push({ scenario: scenario.name, serverAndPreHydrationDOMMatch: true, hydrationWarnings: hydrationErrors.length, warnsOnRoot: hydrationErrors.some(e => /__gcrr?emoteframetoken/i.test(e)), warnsOnSearch: hydrationErrors.some(e => /__gcruniqueid/i.test(e)) });
      if (scenario.child) continue;
      const search = page.getByRole("searchbox");
      await search.fill("zzzz-no-plan-match");
      check(await page.getByText("ไม่พบแผนที่ตรงกับคำค้น", { exact: true }).isVisible(), "search works after hydration");
      await search.fill("");
      check(await page.locator('input[name="training-template"]').count() > 0, "search reset restores choices");
      await page.reload({ waitUntil: "networkidle" });
      check(await page.getByRole("searchbox").inputValue() === "", "reload works");
      await page.getByRole("link", { name: "กลับสู่แผนการฝึก" }).click();
      await page.waitForURL("**/patient");
      await page.getByRole("link", { name: "ท่าฝึก", exact: true }).click();
      await page.getByRole("link", { name: "จัดการแผน", exact: true }).click();
      await page.getByRole("searchbox").waitFor();
      const active = (await (await context.request.get(origin + "/api/patient/training/plan")).json()).plan;
      check(!!active, "existing Demo plan required for non-replacing save test");
      const choice = page.locator(`input[name="training-template"][value="${active.templateId}"]`);
      await choice.check();
      await page.getByRole("button", { name: "บันทึกแผนที่เลือก", exact: true }).click();
      await page.waitForURL("**/patient");
      const after = (await (await context.request.get(origin + "/api/patient/training/plan")).json()).plan;
      check(after.id === active.id, "save reuses current plan");
      await page.getByRole("button", { name: "การแสดงผล", exact: true }).click();
      await page.getByRole("radio", { name: "มืด", exact: true }).click();
      await page.getByRole("radio", { name: "ใหญ่มาก", exact: true }).check();
      await page.getByRole("button", { name: "เสร็จสิ้น", exact: true }).click();
      await page.reload({ waitUntil: "networkidle" });
      check(await page.evaluate(() => document.documentElement.dataset.theme === "dark" && document.documentElement.dataset.size === "xl"), "theme/font changes persist");
      check(errors.filter(e => /hydrated|hydration|didn't match|server rendered HTML/i.test(e)).length === hydrationErrors.length, "reload and navigation add no hydration mismatch");
    } finally { release?.(); await context.close(); }
  }
  return { checks, evidence, physicalIPadTested: false };
}
