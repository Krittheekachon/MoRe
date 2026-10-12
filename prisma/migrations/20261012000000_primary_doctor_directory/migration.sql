-- Additive migration; preserve every patient and the legacy free-text name.
CREATE TABLE "primary_doctors" (
  "id" SERIAL NOT NULL,
  "first_name" VARCHAR(100) NOT NULL,
  "last_name" VARCHAR(100) NOT NULL,
  "phone" VARCHAR(20),
  "specialty" VARCHAR(150),
  "hospital" VARCHAR(200),
  "created_at" TIMESTAMPTZ(6) NOT NULL,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "primary_doctors_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "patient_profiles" ADD COLUMN "primary_doctor_id" INTEGER;
CREATE INDEX "patient_profiles_primary_doctor_id_idx" ON "patient_profiles"("primary_doctor_id");
ALTER TABLE "patient_profiles" ADD CONSTRAINT "patient_profiles_primary_doctor_id_fkey"
  FOREIGN KEY ("primary_doctor_id") REFERENCES "primary_doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
