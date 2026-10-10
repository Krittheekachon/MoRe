import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
const file = "output/playwright/camera-flow.js";
mkdirSync("output/playwright", { recursive: true });
const account = JSON.parse(readFileSync(".demo/accounts.json", "utf8")).patients.find(p => p.hn === "MORE-DEMO-CAMERA");
if (!account) throw new Error("Run demo:seed first");
writeFileSync(file, readFileSync("scripts/test-camera-flow-browser.js", "utf8").replace("null /*ACCOUNT*/", JSON.stringify(account)));
try {
  const result = execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npx.cmd --yes --package @playwright/cli playwright-cli -s=more-camera run-code --filename output/playwright/camera-flow.js"], { encoding: "utf8", timeout: 240000 });
  const summary = result.match(/### Result\r?\n([^\r\n]+)/);
  if (!summary) throw new Error(result.match(/Camera flow: [^\r\n]+|TimeoutError[^\r\n]*|SyntaxError[^\r\n]*|TypeError[^\r\n]*/)?.[0] || "Browser verification failed");
  console.log(summary[1]);
} catch (error) { console.error(String(error.stdout || error.message).replaceAll(account.password, "[redacted]").replaceAll(account.nationalId, "[redacted]")); process.exitCode = 1; }
finally { rmSync(file, { force: true }); }
