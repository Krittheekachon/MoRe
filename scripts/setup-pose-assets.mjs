import { mkdir, copyFile, readdir, writeFile, rename, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createHash } from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "public/mediapipe");
const modelUrl = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
await mkdir(path.join(output, "wasm"), { recursive: true });
for (const name of await readdir(path.join(root, "node_modules/@mediapipe/tasks-vision/wasm"))) {
  if (/\.(js|wasm)$/.test(name)) await copyFile(path.join(root, "node_modules/@mediapipe/tasks-vision/wasm", name), path.join(output, "wasm", name));
}
const response = await fetch(modelUrl);
if (!response.ok) throw new Error(`Model download failed (${response.status})`);
const data = Buffer.from(await response.arrayBuffer());
if (data.length < 1000000 || data.length > 30000000) throw new Error("Unexpected model size");
const hash = createHash("sha256").update(data).digest("hex");
if (hash !== "59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a") throw new Error("Model v1 checksum does not match the verified artifact");
const temporary = path.join(output, "pose_landmarker_lite.task.tmp");
try {
  await writeFile(temporary, data);
  await rename(temporary, path.join(output, "pose_landmarker_lite.task"));
} finally { await rm(temporary, { force: true }); }
console.log(`Local MediaPipe assets ready; model v1 SHA256 ${hash}`);
