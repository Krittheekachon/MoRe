import { spawn } from "node:child_process";
import dotenv from "dotenv";
dotenv.config({ quiet: true });
const port = Number(process.env.CAMERA_TEST_PORT || 3001);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Invalid CAMERA_TEST_PORT");
const args = ["node_modules/next/dist/bin/next", "dev", "--hostname", "0.0.0.0", "--port", String(port)];
if (process.argv.includes("--https")) {
  args.push("--experimental-https");
  if (process.env.CAMERA_TEST_KEY && process.env.CAMERA_TEST_CERT) args.push("--experimental-https-key", process.env.CAMERA_TEST_KEY, "--experimental-https-cert", process.env.CAMERA_TEST_CERT);
}
const child = spawn(process.execPath, args, { stdio: "inherit", env: { ...process.env, MORE_DEMO_MODE: "1", MORE_CAMERA_TEST_MODE: "1" } });
child.on("exit", code => process.exit(code || 0));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
