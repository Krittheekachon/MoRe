import type { Prisma } from "@/generated/prisma/client";

/** Call inside the registration transaction, before inserting the patient.
 * The transaction lock serializes allocations across server processes.
 * ReadCommitted ensures the next waiter sees the previous committed HN.
 */
export async function allocatePatientHn(tx: Prisma.TransactionClient): Promise<string> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(60703052)`;
  const [row] = await tx.$queryRaw<{ highest: string }[]>`
    SELECT COALESCE(MAX(hn::numeric), 0)::text AS highest
    FROM patient_profiles WHERE hn ~ '^[0-9]+$'
  `;
  return nextPatientHn(row.highest);
}

export function nextPatientHn(highest: string): string {
  const hn = (BigInt(highest) + BigInt(1)).toString().padStart(5, "0");
  if (hn.length > 40) throw new Error("Patient HN range exhausted");
  return hn;
}
