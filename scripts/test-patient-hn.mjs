import "dotenv/config";
import assert from "node:assert/strict";
import https from "node:https";
import { randomInt, randomUUID } from "node:crypto";
import { createJiti } from "jiti";
const jiti = createJiti(import.meta.url, { alias: { "server-only": process.cwd() + "/node_modules/next/dist/compiled/server-only/empty.js" } });
const { nextPatientHn } = await jiti.import("../src/lib/patient-hn.ts");
const { PrismaClient } = await jiti.import("../src/generated/prisma/client.ts");
const { PrismaPg } = await import("@prisma/adapter-pg");
const { nationalIdLookup } = await jiti.import("../src/lib/account-security.ts");
assert.ok(["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL).hostname));
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const origin = "https://localhost:3000";
const tag = randomUUID();
const fixtures = Array.from({length: 3}, () => {
  const digits = "1" + Array.from({length: 11}, () => randomInt(10)).join("");
  const sum = [...digits].reduce((total, digit, i) => total + Number(digit) * (13 - i), 0);
  const nationalId = digits + ((11 - sum % 11) % 10);
  return { nationalId, lookup: nationalIdLookup(nationalId), cookie: "" };
});
function post(path, data, fixture) {
  return new Promise((resolve, reject) => {
    const request = https.request(origin + path, { method: "POST", rejectUnauthorized: false,
      headers: { Origin: origin, "Content-Type": "application/json", Cookie: fixture.cookie } }, response => {
      const cookie = response.headers["set-cookie"]?.[0];
      if (cookie) fixture.cookie = cookie.split(";")[0];
      response.resume(); response.on("end", () => resolve(response.statusCode));
    });
    request.on("error", reject); request.end(JSON.stringify(data));
  });
}
let stage = "format";
try {
  assert.equal(nextPatientHn("0"), "00001");
  assert.equal(nextPatientHn("1"), "00002");
  assert.equal(nextPatientHn("9"), "00010");
  assert.equal(nextPatientHn("99999"), "100000");
  const old = await prisma.patientProfile.findMany({ select: { patient_id: true, hn: true } });
  stage = "registration-start";
  for (const fixture of fixtures) {
    const status = await post("/api/auth/register/start", { nationalId: fixture.nationalId, password: "TestPassword!2026", useInitial: false }, fixture);
    console.log(JSON.stringify({ registrationStartStatus: status }));
    assert.equal(status, 200);
  }
  const body = { full_name: `HN regression ${tag}`, date_of_birth: "1960-01-01", sex: "male", stroke_type: "ischemic", stroke_diagnosed_on: "2026-01-01", other_conditions: "" };
  stage = "registration-complete";
  const statuses = await Promise.all(fixtures.map(fixture => post("/api/auth/register", body, fixture)));
  console.log(JSON.stringify({ registrationStatuses: statuses }));
  assert.deepEqual(statuses, [200,200,200]);
  stage = "sequence";
  const rows = await prisma.patientProfile.findMany({ where: { national_id_lookup: { in: fixtures.map(f=>f.lookup) } }, select: { hn: true } });
  assert.equal(rows.length, 3);
  assert.ok(rows.every(row => /^\d{5,}$/.test(row.hn)));
  const numbers = rows.map(row=>BigInt(row.hn)).sort((a,b)=>a<b?-1:1);
  assert.equal(numbers[1], numbers[0] + 1n); assert.equal(numbers[2], numbers[1] + 1n);
  const numericOld = old.map(row=>row.hn).filter(hn=>hn && /^\d+$/.test(hn)).map(BigInt);
  const highest = numericOld.reduce((max,n)=>n>max?n:max,0n);
  assert.equal(numbers[0], highest + 1n);
  const unchanged = await prisma.patientProfile.findMany({ where: { patient_id: { in: old.map(row=>row.patient_id) } }, select: { patient_id: true, hn: true } });
  assert.deepEqual(unchanged.sort((a,b)=>a.patient_id-b.patient_id), old.sort((a,b)=>a.patient_id-b.patient_id));
  // The consumed registration session cannot allocate a second HN.
  stage = "replay";
  assert.equal(await post("/api/auth/register", body, fixtures[0]), 401);
  stage = "duplicate";
  assert.equal(await post("/api/auth/register/start", { nationalId: fixtures[0].nationalId, password: "TestPassword!2026", useInitial: false }, fixtures[0]), 200);
  assert.equal(await post("/api/auth/register", body, fixtures[0]), 409);
  assert.equal(await prisma.patientProfile.count({ where: { national_id_lookup: { in: fixtures.map(f=>f.lookup) } } }), 3);
  console.log(JSON.stringify({ formattingChecks: 4, concurrentRegistrations: 3, sequentialUnique: true, existingHnPreserved: true, replayDenied: true, duplicateRolledBack: true }));
} catch {
  console.error(`HN regression failed at ${stage}; credentials and patient identifiers are not logged.`);
  process.exitCode = 1;
} finally {
  const rows = await prisma.patientProfile.findMany({ where: { national_id_lookup: { in: fixtures.map(f=>f.lookup) }, full_name: `HN regression ${tag}` }, select: { patient_id: true } });
  const ids = rows.map(row=>row.patient_id);
  await prisma.$transaction(async tx => {
    await tx.patientProfile.deleteMany({ where: { patient_id: { in: ids } } });
    await tx.user.deleteMany({ where: { id: { in: ids } } });
  });
  await prisma.$disconnect();
}
