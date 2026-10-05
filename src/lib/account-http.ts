import "server-only";
import { AccountError, object } from "./account-validation";

export function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
}

export async function mutation(request: Request, run: (data: Record<string, unknown>) => Promise<unknown>) {
  try {
    const url = new URL(request.url);
    const expected = process.env.AUTH_ORIGIN || `${url.protocol}//${request.headers.get("host") || url.host}`;
    if (request.headers.get("origin") !== expected || request.headers.get("sec-fetch-site") === "cross-site") throw new AccountError("ไม่อนุญาตคำขอนี้", 403);
    if (!request.headers.get("content-type")?.startsWith("application/json")) throw new AccountError("ข้อมูลไม่ถูกต้อง", 415);
    const body = await request.text();
    if (Buffer.byteLength(body) > 20000) throw new AccountError("ข้อมูลมีขนาดใหญ่เกินไป", 413);
    let input;
    try { input = JSON.parse(body); } catch { throw new AccountError("ข้อมูลไม่ถูกต้อง"); }
    return json(await run(object(input)));
  } catch (error) {
    if (error instanceof AccountError) return json({ error: error.message }, error.status);
    // Never serialize Prisma errors: they can contain lookup values or credentials.
    return json({ error: "ระบบไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง" }, 503);
  }
}
