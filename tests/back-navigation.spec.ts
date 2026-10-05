import { expect, test } from "@playwright/test";

const routes = [
  "/register", "/register/personal", "/register/medical", "/forgot-password", "/doctor/login",
  "/patient/profile/edit", "/patient/exercises/seated-trunk/guide", "/patient/exercises/seated-trunk/camera",
  "/patient/progress/seated-trunk/detail", "/doctor/patients/1/plan",
];

for (const size of [
  { width: 320, height: 568 }, { width: 768, height: 1024 },
  { width: 1024, height: 768 }, { width: 1440, height: 900 },
]) {
  for (const route of routes) {
    test(`top-left back ${route} at ${size.width}`, async ({ page }, testInfo) => {
      await page.setViewportSize(size);
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
      await page.goto(route);
      const back = page.locator(".back-command, .back-link");
      await expect(back).toHaveCount(1);
      const destination = await back.getAttribute("href");
      expect(destination).toBeTruthy();
      const initial = await back.boundingBox();
      expect(initial).not.toBeNull();
      const placement = await back.evaluate(element => {
        const rect = element.getBoundingClientRect();
        const main = element.closest("main")!.getBoundingClientRect();
        const heading = document.querySelector("h1")!.getBoundingClientRect();
        return { position: getComputedStyle(element).position, left: rect.left, mainLeft: main.left, top: rect.top, headingTop: heading.top, height: rect.height };
      });
      expect(placement.position).toBe("static");
      expect(placement.left).toBeGreaterThanOrEqual(placement.mainLeft);
      expect(placement.top).toBeLessThan(placement.headingTop);
      expect(placement.height).toBeGreaterThanOrEqual(44);
      for (const fraction of [0.5, 1]) {
        await page.evaluate(value => window.scrollTo(0, document.documentElement.scrollHeight * value), fraction);
        const scroll = await page.evaluate(() => window.scrollY);
        const current = await back.boundingBox();
        expect(current!.y + scroll).toBeCloseTo(initial!.y, 0);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(back).toBeInViewport({ ratio: 1 });
      await back.focus();
      await expect(back).toBeFocused();
      await page.screenshot({ path: testInfo.outputPath("top-left-back.png"), caret: "initial" });
      await back.press("Enter");
      await expect(page).toHaveURL(new RegExp(`${destination!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
      expect(errors).toEqual([]);
    });
  }
}
