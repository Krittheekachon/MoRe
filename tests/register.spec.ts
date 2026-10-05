import { expect, test } from "@playwright/test";

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

for (const size of sizes) {
  test(`register fits ${size.name}`, async ({ page }, testInfo) => {
    await page.setViewportSize(size);
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto("/register");
    expect(response?.status()).toBe(200);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole("heading", { name: "ลงทะเบียนผู้ป่วยใหม่", exact: true })).toBeVisible();
    if (size.width >= 1200) await expect(page.getByRole("img", { name: "MoRe" })).toBeVisible();

    const metrics = await page.evaluate(() => {
      const controls = Array.from(document.querySelectorAll("main input, main button, main a, .register-display-toolbar summary"));
      return {
        width: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bounds: controls.map((element) => {
          const rect = element.getBoundingClientRect();
          return { left: rect.left, right: rect.right, height: rect.height };
        }),
      };
    });
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width);
    for (const bounds of metrics.bounds) {
      expect(bounds.left).toBeGreaterThanOrEqual(0);
      expect(bounds.right).toBeLessThanOrEqual(metrics.width);
      expect(bounds.height).toBeGreaterThanOrEqual(44);
    }
    await checkLayout(".register-field-help", ".register-next");
    await page.screenshot({ path: testInfo.outputPath(`${size.name}.png`), fullPage: true, caret: "initial" });

    await page.getByLabel("รหัสบัตรประชาชน", { exact: true }).fill("0000000000000");
    await page.getByRole("button", { name: /ถัดไป/ }).click();
    await expect(page.getByLabel("รหัสผ่านเริ่มต้นของคุณ")).toBeVisible();
    await checkLayout(".register-note", ".register-actions");
    await page.screenshot({ path: testInfo.outputPath(`${size.name}-initial.png`), fullPage: true, caret: "initial" });
    await page.getByRole("button", { name: "เปลี่ยนรหัสผ่าน", exact: true }).click();
    await expect(page.getByLabel("ยืนยันรหัสผ่าน", { exact: true })).toBeVisible();
    await expect(page.getByLabel("ชื่อผู้ใช้", { exact: true })).toHaveCount(0);
    await checkLayout(".form-field:last-of-type", ".register-next");
    await page.screenshot({ path: testInfo.outputPath(`${size.name}-custom.png`), fullPage: true, caret: "initial" });
    await page.getByRole("button", { name: "ขั้นตอนถัดไป", exact: true }).click();
    await expect(page.locator(".field-error")).toHaveCount(2);
    await checkLayout(".form-field:last-of-type", ".register-next");
    expect(errors).toEqual([]);

    async function checkLayout(lastContent: string, action: string) {
      const layout = await page.evaluate(({ lastContent, action }) => {
        const content = document.querySelector(".register-content")!.getBoundingClientRect();
        const last = document.querySelector(lastContent)!.getBoundingClientRect();
        const button = document.querySelector(action)!.getBoundingClientRect();
        const main = document.querySelector("main")!.getBoundingClientRect();
        return {
          width: innerWidth,
          overflow: document.documentElement.scrollWidth > innerWidth,
          gap: button.top - last.bottom,
          contentWidth: content.width,
          contentTop: content.top - document.querySelector(".register-display-toolbar")!.getBoundingClientRect().bottom,
          center: content.left + content.width / 2,
          pageHeight: main.height,
          viewportHeight: innerHeight,
          controls: Array.from(document.querySelectorAll("main input, main button, main a")).map((element) => {
            const rect = element.getBoundingClientRect();
            return { left: rect.left, right: rect.right, height: rect.height };
          }),
        };
      }, { lastContent, action });
      expect(layout.overflow).toBe(false);
      expect(layout.pageHeight).toBeGreaterThanOrEqual(layout.viewportHeight);
      expect(layout.center).toBeCloseTo(layout.width / 2, 0);
      expect(layout.contentWidth).toBeLessThanOrEqual(size.width >= 768 ? 960 : size.width >= 600 ? 560 : 420);
      expect(layout.contentTop).toBeGreaterThanOrEqual(0);
      expect(layout.contentTop).toBeLessThanOrEqual(64);
      expect(layout.gap).toBeGreaterThanOrEqual(32);
      expect(layout.gap).toBeLessThanOrEqual(48);
      const composition = await page.evaluate(() => {
        const intro = document.querySelector(".register-intro")!.getBoundingClientRect();
        const form = document.querySelector(".register-form, .register-initial")!.getBoundingClientRect();
        return { introRight: intro.right, introBottom: intro.bottom, formLeft: form.left, formTop: form.top };
      });
      if (size.width >= 1200) expect(composition.formLeft).toBeGreaterThan(composition.introRight);
      else expect(composition.formTop).toBeGreaterThan(composition.introBottom);
      for (const control of layout.controls) {
        expect(control.left).toBeGreaterThanOrEqual(0);
        expect(control.right).toBeLessThanOrEqual(layout.width);
        expect(control.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
}

test("register flow validates locally without sending credentials", async ({ page }) => {
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method())) mutations.push(request.method());
  });
  await page.goto("/register");
  await page.getByRole("button", { name: /ถัดไป/ }).click();
  await expect(page.getByText("กรุณากรอกรหัสบัตรประชาชน", { exact: true })).toBeVisible();
  await page.getByLabel("รหัสบัตรประชาชน", { exact: true }).fill("abc");
  await page.getByRole("button", { name: /ถัดไป/ }).click();
  await expect(page.getByText("กรุณากรอกเลขบัตรประชาชนเป็นตัวเลข 13 หลัก")).toBeVisible();
  await page.getByLabel("รหัสบัตรประชาชน", { exact: true }).fill("0-0000-00000-01-2");
  await page.getByRole("button", { name: /ถัดไป/ }).click();
  await expect(page.getByLabel("รหัสผ่านเริ่มต้นของคุณ")).toHaveValue("0012");
  await page.getByRole("button", { name: "เปลี่ยนรหัสผ่าน", exact: true }).click();
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill("short");
  await page.getByLabel("ยืนยันรหัสผ่าน", { exact: true }).fill("different");
  await page.getByRole("button", { name: "ขั้นตอนถัดไป", exact: true }).click();
  await expect(page.getByText("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")).toBeVisible();
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill("ui-test-password");
  await page.getByLabel("ยืนยันรหัสผ่าน", { exact: true }).fill("ui-test-password");
  await expect(page.getByLabel("ชื่อผู้ใช้", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "ขั้นตอนถัดไป", exact: true }).click();
  await expect(page).toHaveURL(/\/register\/personal$/);
  expect(mutations).toEqual([]);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
});

const flowRoutes = [
  {
    path: "/register/personal",
    heading: "ลงทะเบียนผู้ป่วยใหม่",
    submit: "ขั้นตอนถัดไป",
    expectedErrors: 3,
  },
  {
    path: "/register/medical",
    heading: "ลงทะเบียนผู้ป่วยใหม่",
    submit: "ยืนยันการลงทะเบียน",
    expectedErrors: 2,
  },
];

for (const route of flowRoutes) {
  for (const size of sizes) {
    test(`${route.path} fits ${size.name}`, async ({ page }, testInfo) => {
      await page.setViewportSize(size);
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));
      const response = await page.goto(route.path);
      expect(response?.status()).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.getByRole("heading", { name: route.heading, exact: true })).toBeVisible();

      const metrics = await page.evaluate(() => {
        const controls = Array.from(document.querySelectorAll("main input, main button, main a, main select, main textarea"));
        return {
          width: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          pageHeight: document.querySelector("main")!.getBoundingClientRect().height,
          viewportHeight: window.innerHeight,
          contentWidth: document.querySelector(".register-content")!.getBoundingClientRect().width,
          bounds: controls.map((element) => {
            const rect = element.getBoundingClientRect();
            return { left: rect.left, right: rect.right, height: rect.height };
          }),
        };
      });
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width);
      expect(metrics.pageHeight).toBeGreaterThanOrEqual(metrics.viewportHeight);
      expect(metrics.contentWidth).toBeLessThanOrEqual(size.width >= 768 ? 960 : size.width >= 600 ? 560 : 420);
      for (const bounds of metrics.bounds) {
        expect(bounds.left).toBeGreaterThanOrEqual(0);
        expect(bounds.right).toBeLessThanOrEqual(metrics.width);
        expect(bounds.height).toBeGreaterThanOrEqual(44);
      }

      await page.screenshot({ path: testInfo.outputPath(`${route.path.replaceAll("/", "-").slice(1)}-${size.name}.png`), fullPage: true, caret: "initial" });
      await page.getByRole("button", { name: route.submit, exact: true }).click();
      await expect(page.locator(".field-error")).toHaveCount(route.expectedErrors);
      expect(errors).toEqual([]);
    });
  }
}

test("register personal and medical steps validate locally without persistence", async ({ page }) => {
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method())) mutations.push(request.method());
  });

  await page.goto("/register/personal");
  await page.getByLabel("ชื่อ - นามสกุล", { exact: true }).fill("นายสมชาย ใจดี");
  await page.getByLabel("วันเดือนปีเกิด", { exact: true }).fill("1965-05-20");
  await expect(page.getByLabel("อายุ", { exact: true })).not.toHaveValue("");
  await page.getByLabel("เพศ", { exact: true }).selectOption("male");
  await page.getByRole("button", { name: "ขั้นตอนถัดไป", exact: true }).click();
  await expect(page).toHaveURL(/\/register\/medical$/);

  await page.getByLabel("โรคประจำตัวอื่นๆ", { exact: true }).fill("ความดันโลหิตสูง");
  await page.getByLabel("ประเภทโรคหลอดเลือดสมอง", { exact: true }).selectOption("ischemic");
  await page.getByLabel("วันที่เป็นโรคหลอดเลือดสมอง", { exact: true }).fill("2026-01-15");
  await page.getByRole("button", { name: "ยืนยันการลงทะเบียน", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "ตรวจข้อมูลการลงทะเบียนสำเร็จ", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "ตรวจทานข้อมูล", exact: true }).click();
  await expect(page).toHaveURL(/\/register\/review$/);
  await expect(page.getByText("นายสมชาย ใจดี", { exact: true })).toBeVisible();
  expect(mutations).toEqual([]);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
});
