import { requireDeveloper } from "@/lib/developer-session";
import { cameraTestCriteria } from "@/lib/pose/camera-test-adapter";
import { AccountError } from "@/lib/account-validation";
import { json } from "@/lib/account-http";
export async function GET(request: Request) {
  try {
    await requireDeveloper();
    const side = new URL(request.url).searchParams.get("side");
    if (side !== "left" && side !== "right") throw new AccountError("เลือกข้างที่ตรวจจับ");
    return json({ criteria: cameraTestCriteria("demo-knee-extension", side, 0, { start: 0, peak: 0, returned: 0 }) });
  } catch (error) { return json({ error: error instanceof AccountError ? error.message : "ไม่พร้อมใช้งาน" }, error instanceof AccountError ? error.status : 503); }
}