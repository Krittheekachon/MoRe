import { expect, test } from "@playwright/test";

test("white-green Home uses saved-only history and the selected local font", async ({ page }) => {
  await page.goto("/patient");
  await expect(page.getByRole("meter", { name: "ความก้าวหน้ารายวัน" })).toHaveAttribute("aria-valuenow", "0");
  await expect(page.locator(".patient-banner")).toContainText("62 ปี");
  await expect(page.locator(".patient-banner")).not.toContainText("ปี ปี");
  expect(await page.locator(".system-app").evaluate(e => getComputedStyle(e).fontFamily)).toContain("IBM Plex Sans Thai");
  expect(await page.locator(".system-app").evaluate(e => getComputedStyle(e).backgroundColor)).toBe("rgb(244, 250, 246)");
  await expect(page.locator(".week-days .has-results")).toHaveCount(1);
  await expect(page.locator(".week-days .has-results")).toHaveAttribute("href", "/patient/progress/calendar/2026-10-01");
  await expect(page.getByRole("heading", { name: "ผลการฝึกล่าสุด", exact: true })).toBeVisible();
  await page.locator(".week-days .has-results").click();
  await expect(page.locator(".data-table tbody tr")).toHaveCount(2);
});

test("patient bottom navigation follows the selected HTML reference and stays usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/patient");
  const navigation = page.getByRole("navigation", { name: "เมนูผู้ป่วย" });
  await expect(navigation).toBeVisible();
  await expect(page.getByRole("button", { name: "เปิดเมนู", exact: true })).toHaveCount(0);
  await expect(navigation.getByRole("link", { name: "หน้าหลัก", exact: true })).toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "ท่าฝึก", exact: true }).focus();
  await expect(page.getByRole("link", { name: "ท่าฝึก", exact: true })).toBeFocused();
  await page.getByRole("link", { name: "ท่าฝึก", exact: true }).click();
  await expect(page).toHaveURL(/\/patient\/exercises$/);
  await expect(navigation.getByRole("link", { name: "ท่าฝึก", exact: true })).toHaveAttribute("aria-current", "page");
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator(".sidebar-brand")).toBeVisible();
  expect(await navigation.evaluate(e => getComputedStyle(e).position)).toBe("static");
});

test("patient exercise picker supports search, disclosure and native multi selection", async ({ page }) => {
  await page.goto("/patient/plan");
  await expect(page.getByRole("heading", { name: "เลือกท่าการทำกายภาพบำบัด", exact: true })).toBeVisible();
  await expect(page.getByText("เลือกอยู่ 0 ท่า", { exact: true })).toBeVisible();
  const save = page.getByRole("button", { name: "บันทึกท่าที่เลือก", exact: true });
  await expect(save).toBeDisabled();
  await page.getByText("Module 1", { exact: false }).click();
  const choices = page.getByRole("checkbox");
  await expect(choices).toHaveCount(2);
  await choices.first().check();
  await expect(page.getByText("เลือกอยู่ 1 ท่า", { exact: true })).toBeVisible();
  await expect(save).toBeEnabled();
  await page.getByPlaceholder("ค้นหาชื่อท่าหรือส่วนของร่างกาย").fill("Bridging");
  await expect(page.getByText("Module 2", { exact: false })).toBeVisible();
  await page.getByPlaceholder("ค้นหาชื่อท่าหรือส่วนของร่างกาย").fill("ไม่พบท่าทดสอบ");
  await expect(page.getByText("ไม่พบท่าที่ตรงกับคำค้น", { exact: true })).toBeVisible();
  await page.getByPlaceholder("ค้นหาชื่อท่าหรือส่วนของร่างกาย").fill("");
  await save.click();
  await expect(page).toHaveURL(/\/patient$/);
  await expect(page.getByRole("meter", { name: "ความก้าวหน้ารายวัน" })).toHaveAttribute("aria-valuenow", "0");
});

const routes = [
  "/patient", "/patient/exercises", "/patient/plan", "/patient/progress", "/patient/progress/calendar", "/patient/progress/calendar/2026-10-01",
  "/patient/progress/seated-trunk", "/patient/progress/seated-trunk/detail", "/patient/profile", "/patient/profile/edit", "/patient/change-password",
  "/patient/exercises/seated-trunk/guide", "/patient/exercises/seated-trunk/camera", "/patient/exercises/seated-trunk/result",
  "/patient/exercises/ankle-pump/guide", "/patient/exercises/ankle-pump/camera", "/patient/exercises/bridging/guide",
  "/register/review", "/register/done", "/register/plan", "/forgot-password", "/doctor/login",
  "/doctor", "/doctor/templates", "/doctor/patients/1", "/doctor/patients/1/plan", "/doctor/patients/1/assessments", "/doctor/patients/1/sessions/fixture-session-1",
];
for (const size of [{ name: "small-mobile", width: 320, height: 568 }, { name: "mobile", width: 390, height: 844 }, { name: "ipad", width: 768, height: 1024 }, { name: "ipad-landscape", width: 1024, height: 768 }, { name: "desktop", width: 1440, height: 900 }]) {
  for (const route of routes) {
    test(`${route} renders at ${size.name}`, async ({ page }, testInfo) => {
      await page.setViewportSize(size); const errors: string[] = [];
      page.on("pageerror", e => errors.push(e.message)); page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
      const response = await page.goto(route); expect(response?.status()).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("h1")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const bounds = await page.locator("main input:not([type=checkbox]):not([type=radio]), main select, main button, .app-navigation a").evaluateAll(elements => elements.filter(e => e.getClientRects().length && !e.closest("dialog:not([open])") && !e.closest(".table-scroll")).map(e => { const r = e.getBoundingClientRect(); return { left: r.left, right: r.right, height: r.height }; }));
      for (const bound of bounds) { expect(bound.left).toBeGreaterThanOrEqual(0); expect(bound.right).toBeLessThanOrEqual(size.width); expect(bound.height).toBeGreaterThanOrEqual(44); }
      await page.screenshot({ path: testInfo.outputPath("screen.png"), fullPage: true, caret: "initial" }); expect(errors).toEqual([]);
    });
  }
}

test("partial saves count once, pause does not save, and leaving discards only the draft", async ({ page }) => {
  await page.goto("/patient/exercises/seated-trunk/camera");
  await page.getByRole("button", { name: "เริ่ม / ทำต่อ", exact: true }).click();
  await page.getByRole("button", { name: "เพิ่มครั้งตัวอย่าง" }).click();
  await page.getByRole("button", { name: "หยุดพัก", exact: true }).click();
  await expect(page.getByRole("button", { name: "เพิ่มครั้งตัวอย่าง" })).toBeDisabled();
  await expect(page.getByText("0 / 3 เซตที่บันทึก", { exact: false }).first()).toBeVisible();
  await page.getByRole("button", { name: "บันทึกเซตตัวอย่าง" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByText("1 / 10 ครั้ง", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "ปิด", exact: true }).click();
  await expect(page.getByRole("button", { name: "บันทึกเซตตัวอย่าง" })).toBeDisabled();
  await page.getByRole("link", { name: "หน้าหลัก", exact: true }).click();
  await expect(page.getByText("17%", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "ท่าฝึก", exact: true }).click();
  await page.getByRole("link", { name: "เริ่มฝึก", exact: false }).first().click();
  await page.getByRole("link", { name: "ไปหน้ากล้อง", exact: false }).click();
  await page.getByRole("button", { name: "เริ่ม / ทำต่อ", exact: true }).click();
  await page.getByRole("button", { name: "เพิ่มครั้งตัวอย่าง" }).click();
  await page.getByRole("link", { name: "หน้าหลัก", exact: true }).click();
  await expect(page.getByText("17%", { exact: true })).toBeVisible();
});

test("doctor search, notes and plan changes work across client navigation without rewriting daily targets", async ({ page }) => {
  await page.goto("/doctor"); await page.getByPlaceholder("ชื่อ - นามสกุล หรือ HN").fill("DEMO-001");
  await expect(page.locator(".patient-row")).toHaveCount(1); await page.getByRole("link", { name: "ตรวจสอบ", exact: false }).click();
  await page.getByLabel("บันทึกทางการแพทย์", { exact: true }).fill("หมายเหตุตัวอย่างสำหรับรีวิว");
  await page.getByRole("button", { name: "บันทึกหมายเหตุ", exact: false }).click();
  await expect(page.getByRole("status")).toContainText("ปรับบันทึกตัวอย่างแล้ว");
  await page.getByRole("link", { name: "แผนฝึก", exact: true }).click();
  await page.locator('input[type="number"]').first().fill("1");
  await page.getByRole("button", { name: "บันทึกแผนตัวอย่าง", exact: false }).click();
  await expect(page.getByRole("status")).toContainText("เป้าหมายประจำวันคงเดิม");
  await page.getByRole("link", { name: "ข้อมูลผู้ป่วย", exact: true }).click();
  await expect(page.getByLabel("บันทึกทางการแพทย์", { exact: true })).toHaveValue("หมายเหตุตัวอย่างสำหรับรีวิว");
});

test("registration retains personal and health drafts for review", async ({ page }) => {
  await page.goto("/register/personal");
  await page.getByLabel("ชื่อ - นามสกุล", { exact: true }).fill("ผู้ป่วยตัวอย่าง");
  await page.getByLabel("วันเดือนปีเกิด", { exact: true }).fill("1964-03-15");
  await page.getByLabel("เพศ", { exact: true }).selectOption("male");
  await page.getByRole("button", { name: "ขั้นตอนถัดไป", exact: false }).click();
  await page.getByLabel("ประเภทโรคหลอดเลือดสมอง", { exact: true }).selectOption("ischemic");
  await page.getByLabel("วันที่เป็นโรคหลอดเลือดสมอง", { exact: true }).fill("2026-06-15");
  await page.getByRole("button", { name: "ยืนยันการลงทะเบียน", exact: true }).click();
  await page.getByRole("link", { name: "ตรวจทานข้อมูล", exact: true }).click();
  await expect(page.getByText("ผู้ป่วยตัวอย่าง", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "แก้ไขข้อมูลส่วนตัว", exact: true }).click();
  await expect(page.getByLabel("ชื่อ - นามสกุล", { exact: true })).toHaveValue("ผู้ป่วยตัวอย่าง");
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
});

test("unknown exercises, patients and invalid dates return 404", async ({ page }) => {
  for (const route of ["/patient/exercises/unknown/guide", "/doctor/patients/999", "/patient/progress/calendar/2026-02-31"]) expect((await page.goto(route))?.status()).toBe(404);
});

test("template edits create an available version without changing assigned patient copies", async ({ page }) => {
  await page.goto("/doctor/templates");
  await page.getByLabel("ชื่อแผน", { exact: true }).fill("แผนตัวอย่างรุ่นใหม่");
  await page.locator('input[type="number"]').first().fill("2");
  await page.getByRole("button", { name: "บันทึกแผนกลางตัวอย่าง", exact: false }).click();
  await expect(page.getByRole("status")).toContainText("สร้างรุ่นแผนกลางตัวอย่างใหม่แล้ว");
  await page.getByRole("link", { name: "ผู้ป่วย", exact: true }).click();
  await page.getByRole("link", { name: "ตรวจสอบ", exact: false }).first().click();
  await expect(page.getByText("3 เซต × 10 ครั้ง", { exact: true })).toHaveCount(2);
});

test("camera failure gives usable feedback and does not block the explicit sample mode", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: async () => { throw new DOMException("denied", "NotAllowedError"); } } });
  });
  await page.goto("/patient/exercises/seated-trunk/camera");
  await page.getByRole("button", { name: "เปิดกล้อง", exact: false }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("เปิดกล้องไม่ได้");
  await page.getByRole("button", { name: "เริ่ม / ทำต่อ", exact: true }).click();
  await expect(page.getByRole("button", { name: "เพิ่มครั้งตัวอย่าง", exact: false })).toBeEnabled();
});
