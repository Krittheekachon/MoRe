import { expect, test } from "@playwright/test";

test("doctor session detail view displays angle graph with avg/max filters", async ({ page }) => {
  // 1. Doctor login
  await page.goto("/doctor/login");
  await page.fill('input[name="login-name"]', "more-demo-doctor");
  await page.fill('input[name="password"]', "TRsWODlaXVSFW15dAiTx6ikq");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/doctor", { timeout: 10000 });
  await page.waitForLoadState("networkidle");

  // 2. Navigate to session detail page from screenshot
  await page.goto("/doctor/patients/10/sessions/272");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("text=กายภาพครั้งที่").first()).toBeVisible();

  // 3. Verify angle chart exists
  const chart = page.locator(".doctor-session-angle-chart").first();
  await expect(chart).toBeVisible();
  await expect(chart.locator("text=กราฟวิเคราะห์มุมการเคลื่อนไหว (องศา)")).toBeVisible();
  await expect(chart.locator("text=องศาเฉลี่ยทั้งรอบ")).toBeVisible();
  await expect(chart.locator("text=องศาสูงสุดของรอบ")).toBeVisible();

  // Verify default view shows both avg and max lines
  await expect(chart.locator(".line-avg")).toHaveCount(1);
  await expect(chart.locator(".line-max")).toHaveCount(1);
  await page.screenshot({ path: "test-results/doctor_session_chart_default.png" });

  // 4. Test filter by Avg only
  await chart.getByRole("button", { name: "องศาเฉลี่ย (Avg)" }).click();
  await expect(chart.locator(".line-avg")).toHaveCount(1);
  await expect(chart.locator(".line-max")).toHaveCount(0);
  await page.screenshot({ path: "test-results/doctor_session_chart_avg.png" });

  // 5. Test filter by Max only
  await chart.getByRole("button", { name: "องศาสูงสุด (Max)" }).click();
  await expect(chart.locator(".line-max")).toHaveCount(1);
  await expect(chart.locator(".line-avg")).toHaveCount(0);
  await page.screenshot({ path: "test-results/doctor_session_chart_max.png" });

  // 6. Test switch to Reps mode
  await chart.getByRole("button", { name: /รายครั้ง/ }).click();
  await expect(chart.locator(".line-max")).toHaveCount(1);
  await page.screenshot({ path: "test-results/doctor_session_chart_reps.png" });

  // 7. Test switch back to all
  await chart.getByRole("button", { name: /ทั้งหมด/ }).click();
  await expect(chart.locator(".line-avg")).toHaveCount(1);
  await expect(chart.locator(".line-max")).toHaveCount(1);
  await page.screenshot({ path: "test-results/doctor_session_chart_reps_all.png" });
});
