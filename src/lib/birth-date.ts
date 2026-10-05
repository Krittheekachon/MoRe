export type YearCalendar = "gregory" | "buddhist";

// Native date inputs already return Gregorian dates, regardless of picker locale.
// Explicit Buddhist dates from other sources must identify their calendar.
export function normalizeBirthDate(value: string, calendar: YearCalendar = "gregory"): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]) - (calendar === "buddhist" ? 543 : 0);
  if (year < 1 || year > 9999) return null;
  const normalized = `${String(year).padStart(4, "0")}-${match[2]}-${match[3]}`;
  const date = new Date(`${normalized}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== normalized) return null;
  return normalized;
}

export function dateInThailand(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    calendar: "gregory", numberingSystem: "latn", timeZone: "Asia/Bangkok",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)!.value;
  return `${get("year").padStart(4, "0")}-${get("month")}-${get("day")}`;
}

export function calculateAge(
  birthDate: string,
  referenceDate = dateInThailand(),
  calendars: { birth?: YearCalendar; reference?: YearCalendar } = {},
): number | null {
  const birth = normalizeBirthDate(birthDate, calendars.birth);
  const reference = normalizeBirthDate(referenceDate, calendars.reference);
  if (!birth || !reference || birth > reference) return null;
  const [birthYear, birthMonth, birthDay] = birth.split("-").map(Number);
  const [year, month, day] = reference.split("-").map(Number);
  const birthdayPending = month < birthMonth || (month === birthMonth && day < birthDay);
  return year - birthYear - Number(birthdayPending);
}
