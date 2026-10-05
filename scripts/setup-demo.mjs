import { spawnSync } from "node:child_process";
import dotenv from "dotenv";
dotenv.config({ quiet: true });
for (const key of ["DATABASE_URL", "AUTH_SESSION_SECRET", "NATIONAL_ID_LOOKUP_KEY", "NATIONAL_ID_ENCRYPTION_KEY"]) {
  if (!process.env[key] || process.env[key].startsWith("replace_")) throw new Error(`Configure ${key} in your private root .env first`);
}
function run(command) {
  const result = spawnSync(process.platform === "win32" ? "cmd.exe" : "sh", process.platform === "win32" ? ["/d", "/s", "/c", command] : ["-c", command], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}
run("docker compose up -d db");
run("npx --no-install prisma migrate deploy --config prisma7.config.ts");
run("npx --no-install prisma generate --config prisma7.config.ts");
run("npx --no-install prisma db seed --config prisma7.config.ts");
run("node scripts/seed-demo.mjs");
run("node scripts/setup-pose-assets.mjs");
