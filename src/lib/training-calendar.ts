import { dateInThailand } from "./birth-date";

export function trainingDay(now = new Date()) {
  const date = dateInThailand(now);
  const storedDate = new Date(`${date}T00:00:00Z`);
  const start = new Date(`${date}T00:00:00+07:00`);
  const next = new Date(start.getTime() + 86400000);
  const weekday = storedDate.getUTCDay() || 7;
  return { date, storedDate, start, next, weekday };
}
