import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createJiti } from "jiti";
import dotenv from "dotenv";
dotenv.config({ quiet: true }); process.env.MORE_DEMO_MODE = "1";
const root = process.cwd();
const jiti = createJiti(import.meta.url, { alias: { "@": path.join(root, "src"), "server-only": path.join(root, "node_modules/next/dist/compiled/server-only/empty.js") } });
const { prisma } = await jiti.import(path.join(root, "src/lib/prisma.ts"));
const generated = path.join(root, "output/playwright/demo-code.js");
const cameraOnly = process.argv.includes("--camera");
const accountsOnly = process.argv.includes("--accounts");
const layoutOnly = process.argv.includes("--layout");
try {
  const accounts = JSON.parse(readFileSync(".demo/accounts.json", "utf8"));
  const manifest = JSON.parse(readFileSync(".demo/manifest.json", "utf8"));
  const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const used = await Promise.all(manifest.patients.map(patient => prisma.exerciseSet.count({ where: { status: "saved", session: { dailyExercise: { day: { patient_id: patient.id, local_date: new Date(localDate) } } } } })));
  if (used[1] < used[0]) { accounts.patients.reverse(); manifest.patients.reverse(); }
  const saved = await prisma.exerciseSet.findFirst({ where: { status: "saved", session: { dailyExercise: { day: { patient_id: manifest.patients[0].id, local_date: new Date(localDate) } } } }, orderBy: { id: "desc" }, include: { repetitions: { orderBy: { rep_number: "asc" }, include: { metrics: { include: { metric: true } } } } } });
  const resume = saved && { id: saved.id, payload: { side: saved.repetitions[0]?.selected_side, metricId: saved.repetitions[0]?.metrics[0]?.metric_id, definitionVersion: 1, criteriaVersion: 1, elapsedSeconds: saved.elapsed_seconds, repetitions: saved.repetitions.map(rep => ({ startedAt: rep.started_at.getTime(), completedAt: rep.completed_at.getTime(), startAngle: Number(rep.metrics[0].start_angle_deg), peakAngle: Number(rep.metrics[0].peak_angle_deg), endAngle: Number(rep.metrics[0].end_angle_deg), confidence: Number(rep.confidence) })) } };
  const other = await prisma.patientProfile.findFirst({ where: { patient_id: { notIn: manifest.patients.map(patient => patient.id) } }, select: { patient_id: true } });
  mkdirSync(path.dirname(generated), { recursive: true });
  writeFileSync(generated, readFileSync(layoutOnly ? "scripts/test-demo-layout-browser.js" : accountsOnly ? "scripts/test-accounts.js" : cameraOnly ? "scripts/test-demo-camera-browser.js" : "scripts/test-demo-browser.js", "utf8").replace("null /*DEMO_FIXTURE*/", JSON.stringify({ accounts, manifest, realPatientId: other?.patient_id, resume })));
  const output = execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npx.cmd --yes --package @playwright/cli playwright-cli -s=more-demo run-code --filename output/playwright/demo-code.js"], { encoding: "utf8", timeout: 600000, maxBuffer: 2 * 1024 * 1024 });
  const result = output.match(/### Result\r?\n([^\r\n]+)/);
  if (!result) { const safe = output.match(/Demo check: [^\r\n]+|TimeoutError[^\r\n]*|Error: [^\r\n]*/); console.error("Browser verification failed:", safe?.[0] || "inspect browser locally"); process.exitCode = 1; }
  else {
    const data = JSON.parse(result[1]);
    if (!cameraOnly && !accountsOnly && !layoutOnly) {
      const set = await prisma.exerciseSet.findUnique({ where: { id: data.savedSetId }, include: { repetitions: { include: { metrics: true } } } });
      if (set?.status !== "saved" || set.repetitions.length !== 1 || Number(set.repetitions[0].metrics[0].peak_angle_deg) !== 150) throw new Error("Database readback failed");
    }
    console.log(JSON.stringify({ ...data, postgresReadback: !cameraOnly && !accountsOnly && !layoutOnly }));
  }
} catch (error) {
  const output = String(error.stdout || "");
  const safe = output.match(/Demo check: [^\r\n]+|TimeoutError[^\r\n]*|TypeError: [^\r\n]*/);
  console.error("Demo verification failed:", safe?.[0] || error.code || error.name, "; no credentials printed."); process.exitCode = 1;
}
finally { rmSync(generated, { force: true }); await prisma.$disconnect(); }
