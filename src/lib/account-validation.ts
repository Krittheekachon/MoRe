import { dateInThailand, normalizeBirthDate } from "./birth-date";

export class AccountError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new AccountError("ข้อมูลไม่ถูกต้อง");
  return value as Record<string, unknown>;
}

export function onlyFields(data: Record<string, unknown>, fields: string[]) {
  if (Object.keys(data).some(key => !fields.includes(key))) throw new AccountError("ข้อมูลไม่ถูกต้อง");
}

export function text(data: Record<string, unknown>, field: string, max: number, required = false) {
  const raw = data[field];
  if (raw !== undefined && typeof raw !== "string") throw new AccountError("ข้อมูลไม่ถูกต้อง");
  const value = ((raw as string) || "").trim();
  if ((required && !value) || Array.from(value).length > max) throw new AccountError("กรุณาตรวจสอบข้อมูลที่กรอก");
  return value;
}

export function nationalId(data: Record<string, unknown>) {
  const id = text(data, "nationalId", 40, true).replace(/[\s-]/g, "");
  if (!/^[0-9]{13}$/.test(id)) throw new AccountError("กรุณากรอกเลขบัตรประชาชน 13 หลัก");
  return id;
}

export function password(data: Record<string, unknown>, field: string, min = 8) {
  const value = data[field];
  if (typeof value !== "string" || value.length < min || value.length > 128 || !value.trim()) throw new AccountError(`รหัสผ่านต้องมี ${min}–128 ตัวอักษร`);
  return value;
}

export function date(data: Record<string, unknown>, field: string, required = true) {
  const raw = text(data, field, 10, required);
  if (!raw && !required) return null;
  const normalized = normalizeBirthDate(raw);
  if (!normalized || normalized > dateInThailand()) throw new AccountError("กรุณาเลือกวันที่ถูกต้องและไม่อยู่ในอนาคต");
  return new Date(`${normalized}T00:00:00Z`);
}

export function choice(data: Record<string, unknown>, field: string, values: string[]) {
  const value = text(data, field, 100, true);
  if (!values.includes(value)) throw new AccountError("กรุณาเลือกข้อมูลที่ถูกต้อง");
  return value;
}

export function personalFields(data: Record<string, unknown>) {
  return { full_name: text(data, "full_name", 200, true), date_of_birth: date(data, "date_of_birth"), sex: choice(data, "sex", ["male", "female", "other", "unspecified"]), other_conditions: text(data, "other_conditions", 10000) || null };
}
