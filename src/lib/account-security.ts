import "server-only";
import { createCipheriv, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { AccountError } from "./account-validation";

const workload = globalThis as unknown as { moreScryptJobs?: number };

function key(name: string) {
  const value = process.env[name];
  if (!value || !/^[a-f0-9]{64}$/i.test(value)) throw new Error(`${name} must be a separate 32-byte hexadecimal key`);
  return Buffer.from(value, "hex");
}

export function nationalIdLookup(id: string) {
  return createHmac("sha256", key("NATIONAL_ID_LOOKUP_KEY")).update(id).digest("hex");
}

export function encryptNationalId(id: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key("NATIONAL_ID_ENCRYPTION_KEY"), iv);
  const ciphertext = Buffer.concat([cipher.update(id, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ciphertext.toString("base64url")].join(":");
}

async function derive(password: string, salt: Buffer) {
  // Bound the memory-heavy work even when requests use different account IDs.
  if ((workload.moreScryptJobs || 0) >= 2) throw new AccountError("ระบบกำลังทำงาน กรุณาลองใหม่ภายหลัง", 503);
  workload.moreScryptJobs = (workload.moreScryptJobs || 0) + 1;
  try {
    return await new Promise<Buffer>((resolve, reject) => {
      scrypt(password, salt, 32, { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }, (error, result) => error ? reject(error) : resolve(result));
    });
  } finally { workload.moreScryptJobs--; }
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const digest = await derive(password, salt);
  return `scrypt$131072$8$1$${salt.toString("base64url")}$${digest.toString("base64url")}`;
}

export async function verifyPassword(password: string, encoded?: string) {
  const parts = encoded?.split("$");
  const valid = parts?.length === 6 && parts.slice(0, 4).join("$") === "scrypt$131072$8$1";
  // Missing accounts perform the same expensive derivation as existing accounts.
  const salt = valid ? Buffer.from(parts[4], "base64url") : Buffer.alloc(16);
  const expected = valid ? Buffer.from(parts[5], "base64url") : Buffer.alloc(32);
  const actual = await derive(password, salt);
  return !!valid && expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function sessionBinding(id: number, hash: string) {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SESSION_SECRET must have at least 32 characters");
  return createHmac("sha256", secret).update(`${id}:${hash}`).digest("hex");
}

export function constantEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
