import { expect, test } from "@playwright/test";

const routes = ["/patient/profile", "/patient", "/patient/plan", "/patient/progress", "/patient/exercises/seated-trunk/camera", "/doctor", "/register", "/"];

for (const viewport of [
  { width: 320, height: 568 },
  { width: 820, height: 1180 },
  { width: 1440, height: 900 },
]) {
  test(`theme preferences default to system and apply across routes at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ colorScheme: "dark" });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });

    await page.goto("/patient/profile");
    await page.getByRole("button", { name: "การแสดงผล", exact: true }).click();
    await expect(page.locator('input[name="theme"][value="dark"]')).toBeChecked();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "system");
    expect(await page.locator("body").evaluate(element => ({ bg: getComputedStyle(element).backgroundColor, ink: getComputedStyle(element).color }))).toEqual({ bg: "rgb(11, 21, 28)", ink: "rgb(231, 240, 245)" });

    await page.locator('input[name="theme"][value="dark"]').locator("..").click();
    await page.locator('input[name="font-size"][value="xl"]').check();
    await page.reload();
    await page.getByRole("button", { name: "การแสดงผล", exact: true }).click();
    await expect(page.locator('input[name="theme"][value="dark"]')).toBeChecked();
    await expect(page.locator('input[name="font-size"][value="xl"]')).toBeChecked();

    await page.getByRole("button", { name: "เสร็จสิ้น" }).click();
    for (const route of routes) {
      const response = await page.goto(route);
      expect(await response?.text()).toContain('data-theme="dark"');
      expect(await page.locator("body").evaluate(element => ({ bg: getComputedStyle(element).backgroundColor, ink: getComputedStyle(element).color }))).toEqual({ bg: "rgb(11, 21, 28)", ink: "rgb(231, 240, 245)" });
      expect(await page.locator("html").evaluate(element => getComputedStyle(element).fontSize)).toBe("19px");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (route === "/patient") {
        expect(await page.locator(".next-exercise").evaluate(element => getComputedStyle(element).backgroundColor)).toBe("rgb(18, 33, 43)");
        expect(await page.locator(".command.primary").first().evaluate(element => getComputedStyle(element).backgroundColor)).toBe("rgb(60, 184, 174)");
      }
      await page.screenshot({ path: testInfo.outputPath(`${route.replaceAll("/", "_") || "login"}.png`), fullPage: true, caret: "initial" });
    }

    await page.goto("/patient/profile");
    await page.getByRole("button", { name: "การแสดงผล", exact: true }).click();
    await page.locator('input[name="theme"][value="light"]').check();
    await page.reload();
    await page.getByRole("button", { name: "การแสดงผล", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(await page.locator("body").evaluate(element => getComputedStyle(element).backgroundColor)).toBe("rgb(244, 250, 246)");

    await page.context().clearCookies({ name: "more-theme" });
    await page.reload();
    await page.getByRole("button", { name: "การแสดงผล", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "system");
    await expect(page.locator('input[name="theme"][value="dark"]')).toBeChecked();
    await expect(page.locator('input[name="font-size"][value="xl"]')).toBeChecked();
    expect(errors).toEqual([]);
  });
}

test("invalid theme cookie uses the system default", async ({ context, page, baseURL }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await context.addCookies([{ name: "more-theme", value: "invalid", url: baseURL! }]);
  const response = await page.goto("/patient/profile");
    await page.getByRole("button", { name: "การแสดงผล", exact: true }).click();
  expect(await response?.text()).toContain('data-theme="system"');
  await expect(page.locator('input[name="theme"][value="dark"]')).toBeChecked();
  expect(await page.locator("body").evaluate(element => getComputedStyle(element).backgroundColor)).toBe("rgb(11, 21, 28)");
});
