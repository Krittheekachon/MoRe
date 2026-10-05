import { expect, test } from "@playwright/test";
test.use({ launchOptions: { args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] } });

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 820, height: 1180 }, { width: 1180, height: 820 }]) {
  test(`shared display panel and paused camera at ${viewport.width}px`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto("/");
    await page.getByLabel("รหัสบัตรประชาชน", { exact: true }).fill("1234567890123");
    await page.getByRole("button", { name: "การแสดงผล", exact: true }).click();
    const panel = page.getByRole("dialog", { name: "การแสดงผล", exact: true });
    await expect(panel).toBeVisible();
    await expect(panel.locator('input[name="theme"]')).toHaveCount(2);
    for (const theme of ["light", "dark"]) {
      for (const [size, pixels] of [["m", 16], ["l", 17.5], ["xl", 19]] as const) {
        await panel.locator(`input[name="theme"][value="${theme}"]`).locator("..").click();
        await panel.locator(`input[name="font-size"][value="${size}"]`).check();
        expect(await page.locator(".display-preview").evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBe(pixels);
        const bounds = await panel.boundingBox();
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + 1);
        if (viewport.width < 768) expect(Math.abs(bounds!.y + bounds!.height - viewport.height)).toBeLessThan(2);
        else expect(Math.abs(bounds!.y + bounds!.height / 2 - viewport.height / 2)).toBeLessThan(2);
        for (const label of await panel.locator("label span").all()) {
          const box = await label.boundingBox();
          expect(box!.height).toBeGreaterThanOrEqual(48);
          expect(box!.width).toBeGreaterThanOrEqual(48);
          expect(await label.evaluate(el => el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight)).toBe(true);
        }
        await page.screenshot({ path: testInfo.outputPath(`panel-${theme}-${size}.png`), caret: "initial" });
        await panel.getByRole("button", { name: "เสร็จสิ้น" }).click();
        await expect(page.getByLabel("รหัสบัตรประชาชน", { exact: true })).toHaveValue("1234567890123");
        for (const route of ["/patient", "/patient/exercises", "/register", "/register/personal", "/register/medical", "/register/plan", "/register/review", "/register/done", "/patient/exercises/seated-trunk/guide", "/patient/exercises/seated-trunk/camera", "/patient/progress", "/patient/profile/edit", "/patient/change-password"]) {
          await page.goto(route);
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
          await expect(page.locator("html")).toHaveAttribute("data-size", size);
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          if (route.startsWith("/register")) {
            await page.getByLabel("เมนูเพิ่มเติม", { exact: true }).click();
            await page.getByRole("button", { name: "การแสดงผล", exact: true }).click();
            await expect(panel).toBeVisible();
            await page.keyboard.press("Escape");
          }
          if (route.endsWith("/camera")) {
            await page.getByRole("button", { name: "เริ่ม / ทำต่อ" }).click();
            await expect(page.locator(".app-main .display-menu, .app-main .display-trigger")).toHaveCount(0);
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            await page.screenshot({ path: testInfo.outputPath(`training-${theme}-${size}.png`), fullPage: true, caret: "initial" });
          }
          if (size === "xl" && ["/patient", "/register", "/register/personal"].includes(route)) await page.screenshot({ path: testInfo.outputPath(`${route.replaceAll("/", "_")}-${theme}.png`), fullPage: true, caret: "initial" });
          if (["/patient/exercises/seated-trunk/guide", "/patient/progress", "/patient/profile/edit", "/patient/change-password"].includes(route)) await expect(page.locator(".app-main .display-menu, .app-main .display-trigger")).toHaveCount(0);
        }
        await page.goto("/");
        await page.getByLabel("รหัสบัตรประชาชน", { exact: true }).fill("1234567890123");
        await page.getByRole("button", { name: "การแสดงผล", exact: true }).click();
      }
    }
    await page.keyboard.press("Escape");
    await expect(panel).not.toBeVisible();
    await expect(page.getByRole("button", { name: "การแสดงผล", exact: true })).toBeFocused();

    await page.goto("/register/personal");
    const input = page.locator('input').first();
    await input.fill("ทดสอบข้อมูล");
    await page.getByLabel("เมนูเพิ่มเติม", { exact: true }).click();
    await page.getByRole("button", { name: "การแสดงผล", exact: true }).click();
    await panel.locator('input[name="font-size"][value="l"]').check();
    await page.keyboard.press("Escape");
    await expect(input).toHaveValue("ทดสอบข้อมูล");
    await expect(page.getByLabel("เมนูเพิ่มเติม", { exact: true })).toBeFocused();

    await page.goto("/patient/exercises/seated-trunk/camera");
    await page.getByRole("button", { name: "เปิดกล้อง", exact: true }).click();
    await expect(page.getByRole("button", { name: "ปิดกล้อง", exact: true })).toBeVisible();
    const cameraTrack = await page.locator("video").evaluate(el => ((el as HTMLVideoElement).srcObject as MediaStream).getVideoTracks()[0].id);
    await page.getByLabel("เมนูเพิ่มเติม", { exact: true }).click();
    await page.getByRole("button", { name: "การแสดงผล", exact: true }).click();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "เริ่ม / ทำต่อ" }).click();
    await expect(page.locator(".app-main .display-menu, .app-main .display-trigger")).toHaveCount(0);
    await page.getByRole("button", { name: "เพิ่มครั้งตัวอย่าง" }).click();
    await page.getByRole("button", { name: "หยุดพัก" }).click();
    const counters = await page.locator(".summary-band").innerText();
    await page.getByRole("button", { name: "การแสดงผล", exact: true }).click();
    await panel.locator('input[name="theme"][value="light"]').check();
    await panel.locator('input[name="font-size"][value="xl"]').check();
    await panel.getByRole("button", { name: "เสร็จสิ้น" }).click();
    await expect(page.getByRole("region", { name: "พักการฝึก" })).toBeVisible();
    await expect(page.getByRole("button", { name: "เพิ่มครั้งตัวอย่าง" })).toBeDisabled();
    await expect(page.locator(".summary-band")).toHaveText(counters, { useInnerText: true });
    await expect.poll(() => page.locator("video").evaluate(el => { const track = ((el as HTMLVideoElement).srcObject as MediaStream).getVideoTracks()[0]; return { id: track.id, state: track.readyState }; })).toEqual({ id: cameraTrack, state: "live" });
    await page.getByRole("button", { name: "การแสดงผล", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("region", { name: "พักการฝึก" })).toBeVisible();
    await expect(page.locator(".summary-band")).toHaveText(counters, { useInnerText: true });
    const displayButton = await page.getByRole("button", { name: "การแสดงผล", exact: true }).boundingBox();
    const navigation = await page.locator(".app-navigation").boundingBox();
    if (viewport.width < 1024) expect(displayButton!.y + displayButton!.height).toBeLessThanOrEqual(navigation!.y);
    await page.screenshot({ path: testInfo.outputPath("paused.png"), fullPage: true, caret: "initial" });
    await page.getByRole("button", { name: "เริ่ม / ทำต่อ" }).click();
    await expect(page.locator(".app-main .display-menu, .app-main .display-trigger")).toHaveCount(0);
    await page.getByRole("button", { name: "บันทึกเซตตัวอย่าง" }).click();
    await expect(page.locator(".app-dialog .display-trigger, .app-dialog .display-menu")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test("home and exercise navigation use the shared panel with keyboard focus containment", async ({ page }) => {
  await page.goto("/patient");
  await expect(page.locator(".patient-display-toolbar > .display-trigger")).toBeVisible();
  await page.getByLabel("เมนูผู้ป่วยเพิ่มเติม").click();
  await page.locator(".display-menu-items").getByRole("button", { name: "การแสดงผล" }).click();
  const panel = page.getByRole("dialog", { name: "การแสดงผล" });
  await panel.getByRole("button", { name: "เสร็จสิ้น" }).focus();
  await page.keyboard.press("Tab");
  expect(await panel.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Shift+Tab");
  expect(await panel.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("เมนูผู้ป่วยเพิ่มเติม")).toBeFocused();
  await page.goto("/patient/exercises");
  await expect(page.locator(".app-main .display-trigger")).toHaveCount(0);
  await page.getByLabel("เมนูผู้ป่วยเพิ่มเติม").click();
  await page.locator(".display-menu-items").getByRole("button", { name: "การแสดงผล" }).click();
  await expect(panel).toBeVisible();
  await page.keyboard.press("Escape");
  await page.goto("/patient/plan");
  await expect(page.locator(".app-main .display-trigger, .app-main .display-menu")).toHaveCount(0);
  expect(await page.locator('meta[name="viewport"]').getAttribute("content")).not.toMatch(/user-scalable\s*=\s*no|maximum-scale/);
});
