import { chromium } from "playwright";
import fs from "node:fs";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const accounts = JSON.parse(fs.readFileSync(".demo/accounts.json", "utf8"));
  const outputDir = "C:/Users/Admin/.gemini/antigravity-ide/brain/94f42e5d-970e-46f5-b664-6f63d4805ca3/audit";
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const patient = accounts.patients[1] || accounts.patients[0];
  const doctor = accounts.doctor;

  const viewports = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 820, height: 1180 },
    { name: "mobile", width: 390, height: 844 },
  ];

  // 1. Audit Patient Routes
  console.log("=== Auditing Patient Pages ===");
  const patientContext = await browser.newContext();
  const patientPage = await patientContext.newPage();
  await patientPage.goto("http://localhost:3001/");
  await patientPage.fill('input[name="national-id"]', patient.nationalId);
  await patientPage.fill('input[name="password"]', patient.password);
  await patientPage.click('button:has-text("เข้าสู่ระบบ")');
  await patientPage.waitForURL("**/patient**");

  const patientRoutes = [
    { path: "/patient", name: "patient_home" },
    { path: "/patient/exercises", name: "patient_exercises" },
    { path: "/patient/plan", name: "patient_plan" },
    { path: "/patient/progress", name: "patient_progress" },
    { path: "/patient/profile", name: "patient_profile" },
    { path: "/patient/profile/edit", name: "patient_profile_edit" },
    { path: "/patient/change-password", name: "patient_change_password" },
  ];

  for (const vp of viewports) {
    await patientPage.setViewportSize({ width: vp.width, height: vp.height });
    for (const r of patientRoutes) {
      await patientPage.goto(`http://localhost:3001${r.path}`);
      await patientPage.waitForLoadState("networkidle");
      await patientPage.waitForTimeout(300);

      const overflow = await patientPage.evaluate(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          hasHOverflow: doc.scrollWidth > doc.clientWidth,
        };
      });

      console.log(`[Patient ${vp.name}] ${r.name}: H-Overflow=${overflow.hasHOverflow} (${overflow.scrollWidth} > ${overflow.clientWidth})`);
      await patientPage.screenshot({ path: `${outputDir}/${r.name}_${vp.name}.png` });
    }
  }
  await patientContext.close();

  // 2. Audit Doctor Routes
  console.log("\n=== Auditing Doctor Pages ===");
  const doctorContext = await browser.newContext();
  const doctorPage = await doctorContext.newPage();
  await doctorPage.goto("http://localhost:3001/doctor/login");
  await doctorPage.fill('input[name="login-name"]', doctor.loginName);
  await doctorPage.fill('input[name="password"]', doctor.password);
  await doctorPage.click('button[type="submit"]');
  await doctorPage.waitForURL(url => url.pathname === "/doctor", { timeout: 10000 });
  await doctorPage.waitForLoadState("networkidle");

  const doctorRoutes = [
    { path: "/doctor", name: "doctor_overview" },
    { path: "/doctor/templates", name: "doctor_templates" },
    { path: "/doctor/patients/10", name: "doctor_patient_detail" },
    { path: "/doctor/patients/10/plan", name: "doctor_patient_plan" },
    { path: "/doctor/patients/10/assessments", name: "doctor_patient_assessments" },
  ];

  for (const vp of viewports) {
    await doctorPage.setViewportSize({ width: vp.width, height: vp.height });
    for (const r of doctorRoutes) {
      await doctorPage.goto(`http://localhost:3001${r.path}`);
      await doctorPage.waitForLoadState("networkidle");
      await doctorPage.waitForTimeout(300);

      const overflow = await doctorPage.evaluate(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          hasHOverflow: doc.scrollWidth > doc.clientWidth,
        };
      });

      console.log(`[Doctor ${vp.name}] ${r.name}: H-Overflow=${overflow.hasHOverflow} (${overflow.scrollWidth} > ${overflow.clientWidth})`);
      await doctorPage.screenshot({ path: `${outputDir}/${r.name}_${vp.name}.png` });
    }
  }
  await doctorContext.close();

  // 3. Register route
  console.log("\n=== Auditing Register Route ===");
  const anonContext = await browser.newContext();
  const anonPage = await anonContext.newPage();
  for (const vp of viewports) {
    await anonPage.setViewportSize({ width: vp.width, height: vp.height });
    await anonPage.goto("http://localhost:3001/register");
    await anonPage.waitForLoadState("networkidle");
    await anonPage.screenshot({ path: `${outputDir}/register_${vp.name}.png` });
  }
  await anonContext.close();

  await browser.close();
  console.log("\nAudit complete! All screenshots saved in audit directory.");
}

main().catch(console.error);
