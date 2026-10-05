import { devices, expect, test, webkit } from "@playwright/test";

test("Chrome iOS Autofill IDs present before hydration do not warn or break validation", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  let releaseScripts!: () => void;
  const scriptsReady = new Promise<void>((resolve) => { releaseScripts = resolve; });
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() === "script") await scriptsReady;
    await route.continue();
  });
  try {
    await page.goto("/", { waitUntil: "commit" });
    await page.locator(".login-form input").last().waitFor({ state: "attached" });
    await page.evaluate(() => {
      document.querySelectorAll(".login-form, .login-form input").forEach((element, index) => {
        element.setAttribute("__gCrUniqueID", String(index + 1));
      });
    });
  } finally {
    releaseScripts();
  }
  await page.waitForLoadState("networkidle");
  await page.locator('button[type="submit"]').click();
  await expect(page.locator(".field-error")).toHaveCount(2);
  await expect(page.locator("#national-id")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#password")).toHaveAttribute("aria-invalid", "true");
  expect(errors).toEqual([]);
});

test("PC, phone and iPad can hydrate Login and Register concurrently without errors", async ({ browser, baseURL }) => {
  const appleBrowser = await webkit.launch({ channel: "" });
  try {
    const scenarios = [
      { browser, options: { viewport: { width: 1440, height: 900 } } },
      { browser: appleBrowser, options: devices["iPhone 13"] },
      { browser: appleBrowser, options: devices["iPad (gen 7)"] },
    ];
    await Promise.all(scenarios.map(async (scenario) => {
      const context = await scenario.browser.newContext({ ...scenario.options, baseURL });
      try {
        const page = await context.newPage();
        const errors: string[] = [];
        page.on("console", (message) => {
          if (message.type() === "error") errors.push(message.text());
        });
        page.on("pageerror", (error) => errors.push(error.message));
        for (let attempt = 0; attempt < 3; attempt++) {
          await page.goto("/", { waitUntil: "networkidle" });
          const submit = page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true });
          if ("hasTouch" in scenario.options && scenario.options.hasTouch) await submit.tap();
          else await submit.click();
          await expect(page.getByText("กรุณากรอกรหัสบัตรประชาชน", { exact: true })).toBeVisible();
          await expect(page.getByText("กรุณากรอกรหัสผ่าน", { exact: true })).toBeVisible();
        }
        await page.goto("/register", { waitUntil: "networkidle" });
        await page.getByLabel("รหัสบัตรประชาชน", { exact: true }).fill("0000000000000");
        const next = page.getByRole("button", { name: /ถัดไป/ });
        if ("hasTouch" in scenario.options && scenario.options.hasTouch) await next.tap();
        else await next.click();
        await expect(page.getByLabel("รหัสผ่านเริ่มต้นของคุณ")).toBeVisible();
        await page.getByRole("button", { name: "เปลี่ยนรหัสผ่าน", exact: true }).click();
        await expect(page.getByLabel("ยืนยันรหัสผ่าน", { exact: true })).toBeVisible();
        await expect(page.getByLabel("ชื่อผู้ใช้", { exact: true })).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(errors).toEqual([]);
      } finally {
        await context.close();
      }
    }));
  } finally {
    await appleBrowser.close();
  }
});
