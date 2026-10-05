import { spawn } from "node:child_process";
import dotenv from "dotenv";
dotenv.config({ quiet: true });
const port = Number(process.env.DEMO_PORT || 3001);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Invalid DEMO_PORT");
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--port", String(port)], { stdio: "inherit", env: { ...process.env, MORE_DEMO_MODE: "1" } });
child.on("exit", code => process.exit(code || 0));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
