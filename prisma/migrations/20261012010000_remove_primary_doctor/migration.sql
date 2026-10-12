-- User requested removal of primary-doctor data only. Login users and training records remain.
ALTER TABLE "patient_profiles" DROP CONSTRAINT IF EXISTS "patient_profiles_primary_doctor_id_fkey";
DROP INDEX IF EXISTS "patient_profiles_primary_doctor_id_idx";
ALTER TABLE "patient_profiles" DROP COLUMN IF EXISTS "primary_doctor_id", DROP COLUMN IF EXISTS "primary_doctor_name";
DROP TABLE IF EXISTS "primary_doctors";
