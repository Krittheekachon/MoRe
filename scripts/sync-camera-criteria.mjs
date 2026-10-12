import path from "node:path";
import dotenv from "dotenv";
import { createJiti } from "jiti";
dotenv.config({ quiet: true });
const jiti = createJiti(import.meta.url, { alias: { "@": path.resolve("src"), "server-only": path.resolve("node_modules/next/dist/compiled/server-only/empty.js") } });
const { prisma } = await jiti.import(path.resolve("src/lib/prisma.ts"));
const { cameraKneeExtension: definition } = await jiti.import(path.resolve("src/lib/pose/exercises/camera-knee-extension.ts"));
try {
 const metrics = await prisma.exerciseAngleMetric.findMany({ where: { exercise: { code: definition.exerciseCode }, metric_code: { in: ["demo-left", "demo-right"] }, definition_version: definition.definitionVersion } });
 if (metrics.length !== 2) throw Error("Expected both existing mock metrics; run the normal catalog setup first");
 await prisma.$transaction(async tx => {
  for (const metric of metrics) for (const phase of ["start", "peak", "return"]) {
   const range = phase === "peak" ? definition.correctPeak : phase === "return" ? definition.returned ?? definition.start : definition.start;
   const key = { exercise_id: metric.exercise_id, code: `${metric.metric_code}-${phase}`, criteria_version: definition.criteriaVersion };
   const existing = await tx.exerciseCheckpoint.findUnique({ where: { exercise_id_code_criteria_version: key } });
   if (existing && (Number(existing.min_value) !== range.min || Number(existing.max_value) !== range.max)) throw Error("Existing version differs; refusing to overwrite");
   await tx.exerciseCheckpoint.upsert({ where: { exercise_id_code_criteria_version: key }, update: {}, create: { ...key, metric_id: metric.id, phase, min_value: range.min, max_value: range.max, feedback_code: "demo_only", instruction_th: "Camera mock only; not clinical" } });
  }
 });
 console.log(JSON.stringify({ criteriaVersion: definition.criteriaVersion, correctPeak: definition.correctPeak, torso: definition.preparationBySide.left.torsoThigh, checkpoints: 6, historicalResultsChanged: false }));
} finally { await prisma.$disconnect(); }
