import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
const file = "output/playwright/plan-hydration-code.js";
const account = JSON.parse(readFileSync(".demo/accounts.json", "utf8")).patients[0];
const session = process.env.HYDRATION_SESSION || "more-hydration";
if (!/^[a-z0-9-]+$/.test(session)) throw new Error("Invalid session name");
mkdirSync("output/playwright", { recursive: true });
writeFileSync(file, readFileSync("scripts/test-plan-hydration-browser.js", "utf8")
  .replace("null /*HYDRATION_ACCOUNT*/", JSON.stringify({ nationalId: account.nationalId, password: account.password }))
  .replace("false /*EXPECT_WARNING*/", String(process.argv.includes("--baseline"))));
try {
  const output = execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", `npx.cmd --yes --package @playwright/cli playwright-cli -s=${session} run-code --filename ${file}`], { encoding: "utf8", timeout: 240000 });
  const result = output.match(/### Result\r?\n([^\r\n]+)/);
  if (!result) throw new Error(output.match(/Plan hydration: [^\r\n]+|TimeoutError[^\r\n]*|SyntaxError[^\r\n]*/)?.[0] || "Browser check failed");
  console.log(result[1]);
} catch (error) {
  const safe = String(error.stdout || error.message).match(/Plan hydration: [^\r\n]+|TimeoutError[^\r\n]*|SyntaxError[^\r\n]*/)?.[0];
  console.error(safe || "Hydration check failed; credentials withheld."); process.exitCode = 1;
} finally { rmSync(file, { force: true }); }
