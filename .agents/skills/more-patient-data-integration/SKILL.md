---
name: more-patient-data-integration
description: Maintain MoRe patient-to-doctor data APIs, teammate integration handoff; excludes doctor UI and pose/audio engine changes.
---
# MoRe patient data integration
Read AGENTS.md, current DBML and [integration guide](../../../docs/patient-doctor-integration.md) before edits. The guide is the API contract, file/function routing, migration and teammate handoff reference. Use the installed Prisma 7 config prisma7.config.ts; generate the client and restart the dev server after a schema change to avoid an old singleton.

Keep patient ID users.id/patient_profiles.patient_id as the identity across registration, plans, snapshots and results. Reuse training-service and results-service; no mirrored patient records or independently calculated Routine/angle criteria. Daily targets and Bangkok start-day recording rules remain in docs/daily-routine.md.

New integration APIs use integrationDoctor and existing server session/demo scope. Role doctor is required; patient, developer, admin and therapist cannot use these new routes. The existing /api/doctor/patients/[id] API also uses this doctor-only guard; template APIs and staff UI remain unchanged. Never authorize from query/localStorage, infer permission from a hospital name, or serialize national-ID lookup/encryption, password hashes or session bindings.

Primary-doctor feature removed by user instruction: do not restore directory/assignment/profile doctor fields or endpoints. Migration 20261012010000_remove_primary_doctor drops only that data; keep login doctor accounts and patient training APIs. Read the current guide for remaining DTO contracts.

Scope edits to patient/data/API files. Do not replace or modify teammate doctor UI/layout/page routes. Prefer additive API modules and document any shared file edits; after teammate code arrives, inspect overlapping contracts and conflicts before merging. Report UI integration as pending until the actual teammate screens are tested.

Check with scripts/test-patient-doctor-integration.mjs using temporary local PostgreSQL fixtures and existing auth/register APIs. MORE_INTEGRATION_BROWSER=1 uses Playwright CLI session more-integration for patient responsive/hydration checks. Keep credentials out of tool output and remove only test-created rows. Report physical iPad coverage separately. Update this skill and the guide from confirmed findings, not assumptions.