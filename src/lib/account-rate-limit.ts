import "server-only";
import { AccountError } from "./account-validation";

type Entry = { count: number; expires: number };
const state = globalThis as unknown as { moreAccountLimits?: Map<string, Entry> };
const limits = state.moreAccountLimits ??= new Map();

export function limitAttempts(key: string, max = 10) {
  const now = Date.now();
  for (const [id, entry] of limits) if (entry.expires <= now) limits.delete(id);
  let entry = limits.get(key);
  if (!entry) {
    if (limits.size >= 10000) throw new AccountError("มีคำขอจำนวนมาก กรุณาลองใหม่ภายหลัง", 429);
    entry = { count: 0, expires: now + 15 * 60 * 1000 };
    limits.set(key, entry);
  }
  if (++entry.count > max) throw new AccountError("ลองหลายครั้งเกินไป กรุณารอ 15 นาทีแล้วลองใหม่", 429);
}
