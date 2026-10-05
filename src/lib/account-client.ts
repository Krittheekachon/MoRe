export async function accountRequest(path: string, data: unknown, method = "POST") {
  const response = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "ระบบไม่พร้อมใช้งาน กรุณาลองใหม่");
  return result;
}
