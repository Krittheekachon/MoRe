import { expect, test } from "@playwright/test";

test("doctor settings modal does not show audio settings", async ({ page }) => {
  // 1. Check /doctor/login
  await page.goto("/doctor/login");
  await page.getByRole("button", { name: "การแสดงผล" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("text=เสียงระหว่างฝึก")).toHaveCount(0);
  await expect(page.locator("text=ขนาดตัวอักษร")).toBeVisible();
  await expect(page.locator("text=โหมดสี")).toBeVisible();
  await page.screenshot({ path: "test-results/doctor_settings_modal.png" });
  await page.getByRole("button", { name: "เสร็จสิ้น" }).click();

  // 2. Doctor Login
  await page.fill('input[name="login-name"]', "more-demo-doctor");
  await page.fill('input[name="password"]', "TRsWODlaXVSFW15dAiTx6ikq");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/doctor/);

  // 3. Inside Doctor dashboard
  await page.locator('header.app-topbar button[aria-label="การแสดงผล"]').click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("text=เสียงระหว่างฝึก")).toHaveCount(0);
  await expect(page.locator("text=ขนาดตัวอักษร")).toBeVisible();
  await expect(page.locator("text=โหมดสี")).toBeVisible();
  await page.screenshot({ path: "test-results/doctor_dashboard_settings_modal.png" });
  await page.getByRole("button", { name: "เสร็จสิ้น" }).click();
});

test("patient settings modal still shows audio settings", async ({ page }) => {
  // 1. Check patient login page
  await page.goto("/");
  await page.getByRole("button", { name: "การแสดงผล" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("text=เสียงระหว่างฝึก")).toBeVisible();
  await expect(page.locator("text=เปิดเสียง")).toBeVisible();
  await expect(page.locator("text=เสียงชาย")).toBeVisible();
  await expect(page.locator("text=เสียงหญิง")).toBeVisible();
  await page.screenshot({ path: "test-results/patient_settings_modal.png" });
  await page.getByRole("button", { name: "เสร็จสิ้น" }).click();

  // 2. Patient Login
  await page.fill('input[name="national-id"]', "1100500123451");
  await page.fill('input[name="password"]', "PatientPass123!");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/patient/);

  // 3. Inside Patient dashboard
  await page.getByRole("button", { name: "การแสดงผล" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("text=เสียงระหว่างฝึก")).toBeVisible();
});
