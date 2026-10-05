// eslint-disable-next-line @typescript-eslint/no-unused-expressions
async (page) => {
  const fixture = null /*DEMO_FIXTURE*/;
  const origin = "http://localhost:3001";
  const patient = await page.context().browser().newContext(); const doctor = await page.context().browser().newContext();
  let checks = 0;
  function check(value, label) { if (!value) throw new Error(`Demo check: ${label}`); checks++; }
  try {
    const account = fixture.accounts.patients[0];
    check((await patient.request.post(origin + "/api/auth/login", { headers: { Origin: origin }, data: { nationalId: account.nationalId, password: account.password } })).ok(), "layout login");
    check((await doctor.request.post(origin + "/api/auth/doctor/login", { headers: { Origin: origin }, data: fixture.accounts.doctor })).ok(), "layout doctor login");
    const today = await (await patient.request.get(origin + "/api/patient/training/today")).json();
    const current = await patient.newPage(); const staff = await doctor.newPage();
    await staff.addInitScript(() => { Object.defineProperty(window.crypto, "randomUUID", { value: undefined }); });
    for (const width of [320, 1180]) for (const theme of ["light", "dark"]) for (const size of ["m", "l", "xl"]) {
      for (const context of [patient, doctor]) await context.addCookies([{ name: "more-theme", value: theme, domain: "localhost", path: "/" }, { name: "more-font-size", value: size, domain: "localhost", path: "/" }]);
      for (const browserPage of [current, staff]) await browserPage.setViewportSize({ width, height: width === 320 ? 844 : 820 });
      for (const path of ["/patient/profile", "/patient/plan", "/patient/progress/calendar", `/patient/exercises/${today.items[0].exercise.code}/camera?daily=${today.items[0].id}`]) {
        await current.goto(origin + path); await current.waitForLoadState("networkidle");
        check(await current.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `compact patient fits ${width}/${theme}/${size}`);
      }
      for (const path of ["/doctor", "/doctor/templates"]) {
        await staff.goto(origin + path); await staff.waitForLoadState("networkidle");
        check(await staff.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `compact doctor fits ${width}/${theme}/${size}`);
      }
      if (theme === "dark" && size === "xl") { await current.screenshot({ path: `output/playwright/demo-compact-camera-${width}.png`, fullPage: true }); await staff.screenshot({ path: `output/playwright/demo-compact-editor-${width}.png`, fullPage: true }); }
    }
    await staff.getByRole("button", { name: "แผนใหม่", exact: true }).click();
    check(await staff.getByLabel("ชื่อแผน", { exact: true }).isVisible(), "HTTP LAN randomUUID fallback works");
    check(await current.locator(".back-command").first().evaluate(element => element.getBoundingClientRect().height >= 48), "back target at least 48px");
    return { focusedLayoutChecks: checks, combinations: 12, extraSmallMobileAndIPadLandscape: true };
  } finally { await patient.close(); await doctor.close(); }
}
