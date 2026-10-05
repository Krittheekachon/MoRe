import { devices, expect, test } from "@playwright/test";

const sizes = [
  { name: "small-mobile", width: 320, height: 568 },
  { name: "mobile", width: 390, height: 844 },
  { name: "ipad-portrait", width: 768, height: 1024 },
  { name: "ipad-landscape", width: 1024, height: 768 },
  { name: "large-tablet-portrait", width: 820, height: 1180 },
  { name: "large-tablet-landscape", width: 1180, height: 820 },
  { name: "short-desktop", width: 1280, height: 720 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile-landscape", width: 844, height: 390 },
];

test("empty login shows both field errors after a mobile touch", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ ...devices["Pixel 7"], baseURL });
  try {
    const page = await context.newPage();
    await page.goto("/");
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).tap();
    await expect(page.getByText("กรุณากรอกรหัสบัตรประชาชน", { exact: true })).toBeVisible();
    await expect(page.getByText("กรุณากรอกรหัสผ่าน", { exact: true })).toBeVisible();
  } finally {
    await context.close();
  }
});

for (const size of sizes) {
  test(`login fits ${size.name}`, async ({ page }, testInfo) => {
    await page.setViewportSize(size);
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/$/);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole("heading", { name: "เข้าสู่ระบบ", exact: true })).toBeVisible();
    await expect(page.getByRole("img", { name: "MoRe" })).toBeVisible();
    expect(await page.getByRole("img", { name: "MoRe" }).evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);

    const checkLayout = async () => {
      const metrics = await page.evaluate(() => {
        const controls = Array.from(document.querySelectorAll("main input, .login-content button, .login-footer button"));
        return {
          width: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          pageHeight: document.querySelector("main")!.getBoundingClientRect().height,
          viewportHeight: innerHeight,
          contentWidth: document.querySelector(".login-content")!.getBoundingClientRect().width,
          bounds: controls.map((element) => {
            const rect = element.getBoundingClientRect();
            return { left: rect.left, right: rect.right, height: rect.height };
          }),
        };
      });
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width);
      expect(metrics.pageHeight).toBeGreaterThanOrEqual(metrics.viewportHeight);
      expect(metrics.contentWidth).toBeLessThanOrEqual(size.width >= 600 ? 560 : 420);
      for (const bounds of metrics.bounds) {
        expect(bounds.left).toBeGreaterThanOrEqual(0);
        expect(bounds.right).toBeLessThanOrEqual(metrics.width);
        expect(bounds.height).toBeGreaterThanOrEqual(44);
      }
    };

    await checkLayout();
    await page.screenshot({ path: testInfo.outputPath(`${size.name}.png`), fullPage: true, caret: "initial" });
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
    await expect(page.getByText("กรุณากรอกรหัสบัตรประชาชน", { exact: true })).toBeVisible();
    await expect(page.getByLabel("รหัสบัตรประชาชน", { exact: true })).toBeFocused();
    await checkLayout();
    await page.screenshot({ path: testInfo.outputPath(`${size.name}-errors.png`), fullPage: true, caret: "initial" });
  });
}

test("format validation and mock submit never authenticate or send credentials", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method())) mutations.push(request.method());
  });
  await page.goto("/");
  const identity = page.getByLabel("รหัสบัตรประชาชน", { exact: true });
  const password = page.getByLabel("รหัสผ่าน", { exact: true });
  const submit = page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true });
  await identity.fill("abc");
  await password.fill(" ");
  await submit.click();
  await expect(page.getByText("กรุณากรอกเลขบัตรประชาชนเป็นตัวเลข 13 หลัก")).toBeVisible();
  await identity.fill("000000000000");
  await submit.click();
  await expect(identity).toHaveAttribute("aria-invalid", "true");
  await identity.fill("00000000000000");
  await submit.click();
  await expect(identity).toHaveAttribute("aria-invalid", "true");
  // Synthetic format-only fixture; this is not a real patient identity.
  await identity.fill("0-0000-00000-00-0");
  await submit.click();
  await expect(password).toBeFocused();
  await expect(page.getByText("กรุณากรอกรหัสผ่าน", { exact: true })).toBeVisible();
  await password.fill("ui-test");
  await page.getByRole("button", { name: "แสดงรหัสผ่าน" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "ซ่อนรหัสผ่าน" }).click();
  await expect(password).toHaveAttribute("type", "password");
  await password.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "ทดสอบแบบฟอร์มสำเร็จ" })).toBeVisible();
  await expect(password).toHaveValue("");
  expect(mutations).toEqual([]);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test("registration link opens the patient register page", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await page.getByRole("link", { name: "ลงทะเบียนผู้ป่วยใหม่", exact: true }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByRole("heading", { name: "ลงทะเบียนผู้ป่วยใหม่", exact: true })).toBeVisible();
});

test("unimplemented actions show a closable notice rather than a missing page", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  for (const name of ["ลืมรหัสผ่าน?", "ระบบฟื้นฟูผู้ป่วยทางการแพทย์"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    await page.getByRole("button", { name: "กลับไปหน้าเข้าสู่ระบบ", exact: true }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByRole("button", { name, exact: true })).toBeFocused();
    await expect(page).toHaveURL(/\/$/);
  }
});
