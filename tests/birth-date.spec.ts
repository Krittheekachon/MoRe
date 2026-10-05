import { chromium, expect, test, webkit } from "@playwright/test";
import { calculateAge, dateInThailand, normalizeBirthDate } from "../src/lib/birth-date";

test("Gregorian and Buddhist birth dates give the same age", () => {
  expect(normalizeBirthDate("2533-05-20", "buddhist")).toBe("1990-05-20");
  expect(calculateAge("1990-05-20", "2026-10-04")).toBe(36);
  expect(calculateAge("2533-05-20", "2026-10-04", { birth: "buddhist" })).toBe(36);
  expect(calculateAge("2533-05-20", "2569-10-04", { birth: "buddhist", reference: "buddhist" })).toBe(36);
  expect(calculateAge("1990-05-20", "2569-10-04", { reference: "buddhist" })).toBe(36);
});

test("birthday boundaries, leap dates and newborns", () => {
  expect(calculateAge("1990-05-20", "2026-05-19")).toBe(35);
  expect(calculateAge("1990-05-20", "2026-05-20")).toBe(36);
  expect(calculateAge("2026-10-04", "2026-10-04")).toBe(0);
  expect(normalizeBirthDate("2543-02-29", "buddhist")).toBe("2000-02-29");
  expect(calculateAge("2543-02-29", "2025-02-28", { birth: "buddhist" })).toBe(24);
  expect(calculateAge("2543-02-29", "2025-03-01", { birth: "buddhist" })).toBe(25);
});

test("reject invalid or future dates without guessing a calendar", () => {
  for (const date of ["", "2026-02-29", "2000-02-30", "2000-13-01", "0000-01-01", "20/05/1990"]) {
    expect(normalizeBirthDate(date)).toBeNull();
    expect(calculateAge(date, "2026-10-04")).toBeNull();
  }
  expect(normalizeBirthDate("2566-02-29", "buddhist")).toBeNull();
  expect(calculateAge("2026-10-05", "2026-10-04")).toBeNull();
  expect(calculateAge("2533-05-20", "2026-10-04")).toBeNull();
  expect(calculateAge("1990-05-20", "invalid")).toBeNull();
  expect(normalizeBirthDate("1990-05-20")).toBe("1990-05-20");
});

test("Thai current date is Gregorian and independent of the host timezone", () => {
  expect(dateInThailand(new Date("2026-10-03T17:00:00Z"))).toBe("2026-10-04");
  expect(dateInThailand(new Date("2026-10-03T16:59:59Z"))).toBe("2026-10-03");
});

for (const browserName of ["chromium", "webkit"] as const) {
  for (const locale of ["en-US-u-ca-gregory", "th-TH-u-ca-buddhist"]) {
    test.describe(`${browserName} ${locale} birth-date input`, () => {
      for (const width of [390, 820]) {
        test(`native date calculates age and blocks future birth at ${width}px`, async ({}, testInfo) => {
          const browser = await (browserName === "chromium" ? chromium : webkit).launch(
            { channel: browserName === "chromium" ? "chrome" : "" },
          );
          try {
            const page = await browser.newPage({ locale, baseURL: testInfo.project.use.baseURL, viewport: { width, height: 1180 } });
            await page.clock.install({ time: new Date("2026-10-04T05:00:00Z") });
            const errors: string[] = [];
            page.on("pageerror", error => errors.push(error.message));
            await page.goto("/register/personal");
            await page.waitForLoadState("networkidle");
            await page.getByLabel("ชื่อ - นามสกุล", { exact: true }).fill("ผู้ป่วยทดสอบ");
            const birth = page.getByLabel("วันเดือนปีเกิด", { exact: true });
            await birth.fill("1965-05-20");
            await expect(birth).toHaveValue("1965-05-20");
            await expect(page.getByLabel("อายุ", { exact: true })).toHaveValue("61 ปี");
            await page.screenshot({ path: testInfo.outputPath("birth-date.png"), caret: "initial" });
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            await birth.fill("2026-10-05");
            await expect(page.getByLabel("อายุ", { exact: true })).toHaveValue("");
            await page.getByLabel("เพศ", { exact: true }).selectOption("male");
            await page.getByRole("button", { name: "ขั้นตอนถัดไป", exact: true }).click();
            await expect(page.getByText("กรุณาเลือกวันเกิดที่ถูกต้องและไม่อยู่ในอนาคต", { exact: true })).toBeVisible();
            await expect(page).toHaveURL(/\/register\/personal$/);
            await birth.fill("1965-05-20");
            await page.getByRole("button", { name: "ขั้นตอนถัดไป", exact: true }).click();
            await expect(page).toHaveURL(/\/register\/medical$/);
            expect(errors).toEqual([]);
          } finally {
            await browser.close();
          }
        });
      }
    });
  }
}
