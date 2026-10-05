// Playwright CLI loads this file as a function expression, not a Node entry point.
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
async (page) => {
  const origin = new URL(page.url()).origin;
  if (!["localhost", "127.0.0.1"].includes(new URL(origin).hostname)) throw new Error("Run synthetic account tests on a local development server only");
  const browser = page.context().browser();
  const stamp = String(Date.now());
  const credentials = [0, 1].map(i => ({ nationalId: `0${stamp.slice(-11)}${i}`, password: `Synthetic-${stamp}-${i}!`, name: `MoRe Synthetic ${stamp} ${i}` }));
  let checks = 0;
  const check = (condition, label) => { if (!condition) throw new Error(`Account check failed: ${label}`); checks++; };
  const contexts = [];
  const pages = [];
  const api = (context, path, data, method = "POST", requestOrigin = origin) => context.request.fetch(`${origin}${path}`, { method, headers: { Origin: requestOrigin, "Content-Type": "application/json" }, data });
  try {
    for (let i = 0; i < 2; i++) {
      const context = await browser.newContext({ viewport: { width: i ? 820 : 390, height: i ? 1180 : 844 }, locale: "th-TH" });
      contexts.push(context);
      const current = await context.newPage(); pages.push(current);
      const c = credentials[i];
      await current.goto(`${origin}/register`); await current.waitForLoadState("networkidle");
      await current.locator("#register-national-id").fill(c.nationalId);
      await current.getByRole("button", { name: "ถัดไป", exact: true }).click();
      await current.getByRole("button", { name: "เปลี่ยนรหัสผ่าน", exact: true }).click();
      await current.locator("#new-password").fill(c.password);
      await current.locator("#confirm-password").fill(c.password);
      await current.getByRole("button", { name: "ขั้นตอนถัดไป", exact: true }).click();
      await current.waitForURL("**/register/personal"); await current.waitForLoadState("networkidle");
      await current.locator("#profile-full-name").fill(c.name);
      await current.locator("#profile-date-of-birth").fill("1980-01-01");
      await current.locator("#profile-sex").selectOption("unspecified");
      await current.locator("form button[type=submit]").click();
      await current.waitForURL("**/register/medical"); await current.waitForLoadState("networkidle");
      await current.locator("#stroke-type").selectOption("unspecified");
      await current.locator("#stroke-diagnosed-on").fill("2026-01-01");
      await current.locator("form button[type=submit]").click();
      await current.getByRole("link", { name: "ตรวจทานข้อมูล", exact: true }).click();
      await current.waitForURL("**/register/review");
      await current.getByRole("button", { name: "ยืนยันข้อมูล", exact: true }).click();
      await current.waitForURL("**/register/done");
      check(await current.getByRole("heading", { name: "ลงทะเบียนสำเร็จ" }).isVisible(), "signup");
      await current.getByRole("link", { name: "เข้าสู่ระบบ", exact: true }).click(); await current.waitForLoadState("networkidle");
      await current.locator("#national-id").fill(c.nationalId);
      await current.locator("#password").fill(c.password);
      await current.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
      await current.waitForURL("**/patient");
      await current.goto(`${origin}/patient/profile`); await current.waitForLoadState("networkidle");
      check((await current.locator(".data-list").allTextContents()).join(" ").includes(c.name), "own profile");
      await current.reload(); await current.waitForLoadState("networkidle");
      check(new URL(current.url()).pathname === "/patient/profile", "session survives reload");
      const cookies = await context.cookies();
      const session = cookies.find(cookie => cookie.name === "more_account");
      check(session?.httpOnly && session.sameSite === "Lax", "HttpOnly cookie");
      check(!await current.evaluate(() => document.cookie.includes("more_account=")), "session unavailable to JS");
      check(await current.evaluate(() => localStorage.length === 0), "no localStorage auth");
      await current.getByRole("link", { name: "แก้ไขข้อมูล", exact: true }).click();
      await current.getByLabel("ชื่อ - นามสกุล", { exact: true }).fill(`${c.name} Edited`);
      await current.getByLabel("โทรศัพท์", { exact: true }).fill("0000000000");
      await current.getByRole("button", { name: "บันทึกข้อมูล", exact: true }).click();
      await current.getByRole("status").filter({ hasText: "บันทึกข้อมูลเรียบร้อยแล้ว" }).waitFor();
      await current.reload(); await current.waitForLoadState("networkidle");
      check(await current.getByLabel("ชื่อ - นามสกุล", { exact: true }).inputValue() === `${c.name} Edited`, "profile persists");
    }
    const a = contexts[0], b = contexts[1];
    const ownA = (await (await a.request.get(`${origin}/api/patient/profile`)).json()).profile;
    const ownB = (await (await b.request.get(`${origin}/api/patient/profile`)).json()).profile;
    check(ownA.id !== ownB.id && ownA.full_name !== ownB.full_name, "two separate accounts");
    check(!JSON.stringify(ownA).match(/password_hash|national_id_lookup|national_id_encrypted/), "no sensitive profile fields");
    const edit = { full_name: ownA.full_name, date_of_birth: ownA.date_of_birth, sex: ownA.sex, phone: ownA.phone, primary_doctor_name: ownA.primary_doctor_name, other_conditions: ownA.other_conditions };
    check((await api(a, "/api/patient/profile", { ...edit, patient_id: ownB.id }, "PATCH")).status() === 400, "reject cross-account ID injection");
    check((await a.request.get(`${origin}/api/patient/profile?patient_id=${ownB.id}`)).status() === 400, "reject target in URL");
    check((await a.request.get(`${origin}/api/patient/profile/${ownB.id}`)).status() === 404, "no other profile endpoint");
    check((await api(a, "/api/patient/profile", edit, "PATCH", "https://untrusted.example")).status() === 403, "CSRF rejection");
    check((await api(a, "/api/auth/register/start", { nationalId: credentials[0].nationalId, password: credentials[0].password, role: "admin" })).status() === 400, "cannot assign role");
    check((await api(a, "/api/auth/login", { nationalId: credentials[0].nationalId, password: "Incorrect-synthetic-password" })).status() === 401, "wrong password");
    check((await api(a, "/api/auth/login", { nationalId: "0000000000000", password: "Incorrect-synthetic-password" })).status() === 401, "unknown account same error");
    check((await api(a, "/api/auth/register/start", { nationalId: credentials[0].nationalId, password: credentials[0].password })).ok(), "duplicate staging");
    const registration = { full_name: "MoRe Synthetic Duplicate", date_of_birth: "1980-01-01", sex: "unspecified", stroke_type: "unspecified", stroke_diagnosed_on: "2026-01-01", other_conditions: "" };
    check((await api(a, "/api/auth/register", registration)).status() === 409, "duplicate account blocked");
    check((await api(a, "/api/auth/register", { ...registration, role: "admin" })).status() === 400, "final registration role blocked");
    check((await api(a, "/api/auth/register", { ...registration, date_of_birth: "9999-01-01" })).status() === 400, "future date rejected");
    check((await api(a, "/api/auth/register/start", { nationalId: credentials[0].nationalId, useInitial: true })).status() === 400, "unapproved initial password blocked");
    await pages[0].goto(`${origin}/doctor`);
    await pages[0].getByRole("heading", { name: "404", exact: true }).waitFor();
    check(new URL(pages[0].url()).pathname === "/doctor", "patient cannot enter doctor workspace");
    await pages[0].goto(`${origin}/patient/profile`);
    for (const width of [390, 820, 1440]) for (const theme of ["light", "dark"]) for (const size of ["m", "l", "xl"]) {
      await a.addCookies([{ name: "more-theme", value: theme, url: origin }, { name: "more-font-size", value: size, url: origin }]);
      await pages[0].setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await pages[0].reload(); await pages[0].waitForLoadState("networkidle");
      check(await pages[0].evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "responsive profile overflow");
      if (size === "xl" && theme === "dark") await pages[0].screenshot({ path: `test-results/auth-profile-${width}.png`, fullPage: true });
    }
    await pages[0].goto(`${origin}/patient/change-password`);
    await pages[0].locator("input[name=current]").fill(credentials[0].password);
    const nextPassword = `${credentials[0].password}-Changed`;
    await pages[0].locator("input[name=new]").fill(nextPassword);
    await pages[0].locator("input[name=confirm]").fill(nextPassword);
    const oldCookie = (await a.cookies()).find(cookie => cookie.name === "more_account");
    await pages[0].getByRole("button", { name: "บันทึกรหัสผ่าน", exact: true }).click();
    await pages[0].getByRole("status").filter({ hasText: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" }).waitFor();
    check((await api(a, "/api/auth/login", { nationalId: credentials[0].nationalId, password: credentials[0].password })).status() === 401, "old password revoked");
    const stale = await browser.newContext();
    await stale.addCookies([oldCookie]);
    check((await stale.request.get(`${origin}/api/patient/profile`)).status() === 401, "old session revoked on password change");
    await stale.close();
    check((await api(a, "/api/auth/login", { nationalId: credentials[0].nationalId, password: nextPassword })).ok(), "new password accepted");
    for (const current of pages) {
      await current.goto(`${origin}/patient/profile`);
      await current.getByRole("button", { name: "ออกจากระบบ", exact: true }).first().click();
      await current.waitForURL(origin + "/");
      check((await current.context().request.get(`${origin}/api/patient/profile`)).status() === 401, "logout blocks API");
      check((await api(current.context(), "/api/patient/profile", edit, "PATCH")).status() === 401, "logout blocks mutation");
      await current.goto(`${origin}/patient/profile`);
      await current.waitForURL(origin + "/");
      check(new URL(current.url()).pathname === "/", "logout blocks page");
    }
    const unauthenticated = await browser.newContext();
    await unauthenticated.addCookies([{ name: "more_account", value: "tampered", url: origin }]);
    check((await unauthenticated.request.get(`${origin}/api/patient/profile`)).status() === 401, "tampered cookie rejected");
    await unauthenticated.close();
    for (let i = 0; i < 11; i++) {
      const response = await api(b, "/api/auth/login", { nationalId: `0${stamp.slice(-11)}9`, password: "Incorrect-synthetic-password" });
      if (i === 10) check(response.status() === 429, "login throttled");
    }
    return { passed: checks, syntheticAccounts: 2, responsiveCombinations: 18, retainedForDatabaseInspection: true };
  } finally {
    for (const context of contexts) await context.close();
  }
}
