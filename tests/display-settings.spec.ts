import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 320, height: 568 },
  { width: 820, height: 1180 },
  { width: 1440, height: 900 },
]) {
  test(`font preferences persist and scale across routes at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto("/patient/profile");
    await page.getByRole("button", { name: "การแสดงผล", exact: true }).click();
    const fontSize = () => page.locator("html").evaluate(element => getComputedStyle(element).fontSize);
    await expect(page.locator('input[name="font-size"][value="m"]')).toBeChecked();
    expect(await fontSize()).toBe("16px");
    await page.locator('input[name="font-size"][value="l"]').check();
    expect(await fontSize()).toBe("17.5px");
    await page.locator('input[name="font-size"][value="xl"]').check();
    expect(await fontSize()).toBe("19px");
    expect(await page.locator(".system-app").evaluate(element => getComputedStyle(element).fontSize)).toBe("19px");
    await page.reload();
    await page.getByRole("button", { name: "การแสดงผล", exact: true }).click();
    await expect(page.locator('input[name="font-size"][value="xl"]')).toBeChecked();
    expect(await fontSize()).toBe("19px");
    await page.getByRole("button", { name: "เสร็จสิ้น" }).click();
    for (const route of ["/patient/profile", "/patient", "/patient/plan", "/patient/profile/edit", "/doctor", "/register", "/"]) {
      await page.goto(route);
      expect(await fontSize()).toBe("19px");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`${route.replaceAll("/", "_") || "login"}.png`), fullPage: true, caret: "initial" });
    }
    await page.goto("/patient/profile");
    await page.getByRole("button", { name: "การแสดงผล", exact: true }).click();
    await page.locator('input[name="font-size"][value="xl"]').focus();
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator('input[name="font-size"][value="l"]')).toBeChecked();
    await page.locator('input[name="font-size"][value="m"]').check();
    await page.reload();
    await page.getByRole("button", { name: "การแสดงผล", exact: true }).click();
    expect(await fontSize()).toBe("16px");
    expect(errors).toEqual([]);
  });
}

test("invalid saved font preference falls back to normal before hydration", async ({ context, page, baseURL }) => {
  await context.addCookies([{ name: "more-font-size", value: "invalid", url: baseURL! }]);
  const response = await page.goto("/patient/profile");
    await page.getByRole("button", { name: "การแสดงผล", exact: true }).click();
  expect(await response?.text()).toContain('data-size="m"');
  await expect(page.locator('input[name="font-size"][value="m"]')).toBeChecked();
});
