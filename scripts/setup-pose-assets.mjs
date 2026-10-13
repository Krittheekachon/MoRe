import { mkdir, copyFile, readdir, writeFile, rename, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createHash } from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "public/mediapipe");
const model = process.argv.includes("--heavy") ? "heavy" : "full";
const modelUrl = `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_${model}/float16/1/pose_landmarker_${model}.task`;
await mkdir(path.join(output, "wasm"), { recursive: true });
for (const name of await readdir(path.join(root, "node_modules/@mediapipe/tasks-vision/wasm"))) {
  if (/\.(js|wasm)$/.test(name)) await copyFile(path.join(root, "node_modules/@mediapipe/tasks-vision/wasm", name), path.join(output, "wasm", name));
}
const response = await fetch(modelUrl);
if (!response.ok) throw new Error(`Model download failed (${response.status})`);
const data = Buffer.from(await response.arrayBuffer());
if (data.length < 1000000 || data.length > 60000000) throw new Error("Unexpected model size");
const hash = createHash("sha256").update(data).digest("hex");
if (model === "full" && hash !== "5134a3aad27a58b93da0088d431f366da362b44e3ccfbe3462b3827a839011b1") throw new Error("Full model v1 checksum does not match the verified artifact");
if (model === "heavy" && hash !== "64437af838a65d18e5ba7a0d39b465540069bc8aae8308de3e318aad31fcbc7b") throw new Error("Heavy model v1 checksum does not match the verified artifact");
const temporary = path.join(output, `pose_landmarker_${model}.task.tmp`);
try {
  await writeFile(temporary, data);
  await rename(temporary, path.join(output, `pose_landmarker_${model}.task`));
} finally { await rm(temporary, { force: true }); }
console.log(`Local MediaPipe assets ready; ${model} model v1 SHA256 ${hash}`);
