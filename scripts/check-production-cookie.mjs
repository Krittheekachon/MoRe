import { randomBytes } from "node:crypto";

const origin = "http://localhost:3002";
try {
  const response = await fetch(`${origin}/api/auth/register/start`, {
    method: "POST", headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ nationalId: `0${String(Date.now()).slice(-12)}`, password: randomBytes(16).toString("hex") }),
  });
  const cookie = response.headers.get("set-cookie") || "";
  const result = { status: response.status, httpOnly: /httponly/i.test(cookie), secure: /; secure/i.test(cookie), sameSiteLax: /samesite=lax/i.test(cookie) };
  console.log(JSON.stringify(result));
  if (!response.ok || !result.httpOnly || !result.secure || !result.sameSiteLax) process.exitCode = 1;
} catch {
  console.error("Production cookie check failed; no credential or cookie value is logged.");
  process.exitCode = 1;
}
