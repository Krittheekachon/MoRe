import { createJiti } from "jiti";
import path from "node:path";
import dotenv from "dotenv";
dotenv.config({ quiet: true });
const root = process.cwd();
const jiti = createJiti(import.meta.url, { alias: { "@": path.join(root, "src"), "server-only": path.join(root, "node_modules/next/dist/compiled/server-only/empty.js") } });
const { seedDemo } = await jiti.import(path.join(root, "src/lib/demo-seed.ts"));
try { await seedDemo(); console.log("Synthetic Demo ready. Private credentials: .demo/accounts.json (never commit)."); }
catch (error) { console.error("Demo seed failed safely:", error.code || error.name, "stage:", error.demoStage || "initialization", ". No existing data was overwritten."); process.exitCode = 1; }
