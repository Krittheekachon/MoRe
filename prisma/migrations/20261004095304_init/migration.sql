BEGIN;

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "login_name" VARCHAR(30),
    "password_hash" VARCHAR(128) NOT NULL,
    "password_change_required" BOOLEAN NOT NULL DEFAULT false,
    "display_name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_profiles" (
    "patient_id" INTEGER NOT NULL,
    "hn" VARCHAR(40),
    "national_id_lookup" VARCHAR(64) NOT NULL,
    "national_id_encrypted" TEXT NOT NULL,
    "full_name" VARCHAR(200) NOT NULL,
    "date_of_birth" DATE,
    "phone" VARCHAR(20),
    "sex" VARCHAR(20),
    "primary_doctor_name" VARCHAR(150),
    "stroke_type" VARCHAR(100),
    "stroke_diagnosed_on" DATE,
    "other_conditions" TEXT,
    "medical_notes" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "patient_profiles_pkey" PRIMARY KEY ("patient_id")
);

-- CreateTable
CREATE TABLE "exercise_modules" (
    "id" SERIAL NOT NULL,
    "module_number" SMALLINT NOT NULL,
    "name_th" VARCHAR(150) NOT NULL,
    "sort_order" SMALLINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "exercise_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" SERIAL NOT NULL,
    "module_id" INTEGER NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "name_th" VARCHAR(150) NOT NULL,
    "name_en" VARCHAR(150),
    "description" TEXT,
    "tutorial_steps" TEXT,
    "tutorial_media_key" TEXT,
    "camera_view" VARCHAR(30),
    "supports_side_selection" BOOLEAN NOT NULL DEFAULT false,
    "default_sets" SMALLINT NOT NULL DEFAULT 3,
    "default_reps_per_set" SMALLINT NOT NULL DEFAULT 10,
    "sort_order" SMALLINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_angle_metrics" (
    "id" SERIAL NOT NULL,
    "exercise_id" INTEGER NOT NULL,
    "metric_code" VARCHAR(60) NOT NULL,
    "label_th" VARCHAR(50) NOT NULL,
    "landmark_a" VARCHAR(32) NOT NULL,
    "landmark_b" VARCHAR(32) NOT NULL,
    "landmark_c" VARCHAR(32),
    "reference_axis" VARCHAR(20),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "definition_version" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "exercise_angle_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_checkpoints" (
    "id" SERIAL NOT NULL,
    "exercise_id" INTEGER NOT NULL,
    "metric_id" INTEGER,
    "code" VARCHAR(60) NOT NULL,
    "phase" VARCHAR(30) NOT NULL,
    "min_value" DECIMAL(8,3),
    "max_value" DECIMAL(8,3),
    "feedback_code" VARCHAR(60),
    "instruction_th" VARCHAR(255),
    "weight" DECIMAL(6,3) NOT NULL DEFAULT 1,
    "criteria_version" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "exercise_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rehabilitation_templates" (
    "id" SERIAL NOT NULL,
    "template_code" VARCHAR(40) NOT NULL,
    "name_th" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "created_by" INTEGER NOT NULL,
    "version_number" SMALLINT NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rehabilitation_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_exercises" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "exercise_id" INTEGER NOT NULL,
    "selected_side" VARCHAR(20),
    "target_sets" SMALLINT NOT NULL,
    "target_reps_per_set" SMALLINT NOT NULL,
    "sessions_per_day" SMALLINT NOT NULL DEFAULT 1,
    "schedule_type" VARCHAR(20) NOT NULL DEFAULT 'daily',
    "sort_order" SMALLINT NOT NULL,
    "instructions" TEXT,

    CONSTRAINT "template_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_exercise_weekdays" (
    "template_exercise_id" INTEGER NOT NULL,
    "weekday" SMALLINT NOT NULL,

    CONSTRAINT "template_exercise_weekdays_pkey" PRIMARY KEY ("template_exercise_id","weekday")
);

-- CreateTable
CREATE TABLE "rehabilitation_plans" (
    "id" SERIAL NOT NULL,
    "source_template_id" INTEGER,
    "plan_code" VARCHAR(40) NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "created_by" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rehabilitation_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_exercises" (
    "id" SERIAL NOT NULL,
    "source_template_exercise_id" INTEGER,
    "plan_id" INTEGER NOT NULL,
    "exercise_id" INTEGER NOT NULL,
    "selected_side" VARCHAR(20),
    "target_sets" SMALLINT NOT NULL,
    "target_reps_per_set" SMALLINT NOT NULL,
    "sessions_per_day" SMALLINT NOT NULL DEFAULT 1,
    "schedule_type" VARCHAR(20) NOT NULL DEFAULT 'daily',
    "effective_from" TIMESTAMPTZ(6) NOT NULL,
    "effective_to" TIMESTAMPTZ(6),
    "version_number" SMALLINT NOT NULL,
    "configured_by" INTEGER NOT NULL,
    "instruction_override" TEXT,

    CONSTRAINT "plan_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_exercise_weekdays" (
    "plan_exercise_id" INTEGER NOT NULL,
    "weekday" SMALLINT NOT NULL,

    CONSTRAINT "plan_exercise_weekdays_pkey" PRIMARY KEY ("plan_exercise_id","weekday")
);

-- CreateTable
CREATE TABLE "rehabilitation_days" (
    "id" SERIAL NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "local_date" DATE NOT NULL,
    "started_at" TIMESTAMPTZ(6),
    "last_activity_at" TIMESTAMPTZ(6),
    "is_closed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "rehabilitation_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_exercises" (
    "id" SERIAL NOT NULL,
    "rehabilitation_day_id" INTEGER NOT NULL,
    "plan_exercise_id" INTEGER NOT NULL,
    "exercise_id" INTEGER NOT NULL,
    "selected_side" VARCHAR(20),
    "target_sets" SMALLINT NOT NULL,
    "target_reps_per_set" SMALLINT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'not_started',
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "daily_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_sessions" (
    "id" SERIAL NOT NULL,
    "daily_exercise_id" INTEGER NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "ended_at" TIMESTAMPTZ(6),
    "status" VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    "score" DECIMAL(6,2),
    "scoring_version" SMALLINT,

    CONSTRAINT "exercise_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "camera_checks" (
    "id" SERIAL NOT NULL,
    "exercise_session_id" INTEGER NOT NULL,
    "checked_at" TIMESTAMPTZ(6) NOT NULL,
    "view_detected" VARCHAR(30),
    "selected_side" VARCHAR(20),
    "is_ready" BOOLEAN NOT NULL,
    "feedback_code" VARCHAR(60),
    "confidence" DECIMAL(4,3),

    CONSTRAINT "camera_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_sets" (
    "id" SERIAL NOT NULL,
    "exercise_session_id" INTEGER NOT NULL,
    "set_number" SMALLINT NOT NULL,
    "target_reps" SMALLINT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "started_at" TIMESTAMPTZ(6),
    "saved_at" TIMESTAMPTZ(6),
    "last_activity_at" TIMESTAMPTZ(6),
    "elapsed_seconds" INTEGER,
    "score" DECIMAL(6,2),
    "scoring_version" SMALLINT,

    CONSTRAINT "exercise_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repetitions" (
    "id" SERIAL NOT NULL,
    "set_id" INTEGER NOT NULL,
    "rep_number" SMALLINT NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "completed_at" TIMESTAMPTZ(6) NOT NULL,
    "selected_side" VARCHAR(20),
    "is_correct" BOOLEAN NOT NULL,
    "feedback_code" VARCHAR(60),
    "quality_score" DECIMAL(6,2),
    "criteria_version" SMALLINT NOT NULL,
    "confidence" DECIMAL(4,3),

    CONSTRAINT "repetitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repetition_metrics" (
    "id" SERIAL NOT NULL,
    "repetition_id" INTEGER NOT NULL,
    "metric_id" INTEGER NOT NULL,
    "start_angle_deg" DECIMAL(7,2),
    "peak_angle_deg" DECIMAL(7,2) NOT NULL,
    "end_angle_deg" DECIMAL(7,2),
    "angular_excursion_deg" DECIMAL(7,2),
    "duration_ms" INTEGER,
    "selected_side" VARCHAR(20),

    CONSTRAINT "repetition_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repetition_checkpoint_results" (
    "repetition_id" INTEGER NOT NULL,
    "checkpoint_id" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "observed_value" DECIMAL(8,3),
    "feedback_code" VARCHAR(60),

    CONSTRAINT "repetition_checkpoint_results_pkey" PRIMARY KEY ("repetition_id","checkpoint_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_login_name_key" ON "users"("login_name");

-- CreateIndex
CREATE UNIQUE INDEX "patient_profiles_hn_key" ON "patient_profiles"("hn");

-- CreateIndex
CREATE UNIQUE INDEX "patient_profiles_national_id_lookup_key" ON "patient_profiles"("national_id_lookup");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_modules_module_number_key" ON "exercise_modules"("module_number");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_code_key" ON "exercises"("code");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_angle_metrics_exercise_id_metric_code_definition_v_key" ON "exercise_angle_metrics"("exercise_id", "metric_code", "definition_version");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_checkpoints_exercise_id_code_criteria_version_key" ON "exercise_checkpoints"("exercise_id", "code", "criteria_version");

-- CreateIndex
CREATE UNIQUE INDEX "rehabilitation_templates_template_code_key" ON "rehabilitation_templates"("template_code");

-- CreateIndex
CREATE UNIQUE INDEX "rehabilitation_plans_plan_code_key" ON "rehabilitation_plans"("plan_code");

-- CreateIndex
CREATE UNIQUE INDEX "plan_exercises_plan_id_exercise_id_version_number_key" ON "plan_exercises"("plan_id", "exercise_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "rehabilitation_days_patient_id_local_date_key" ON "rehabilitation_days"("patient_id", "local_date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_exercises_rehabilitation_day_id_plan_exercise_id_key" ON "daily_exercises"("rehabilitation_day_id", "plan_exercise_id");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_sets_exercise_session_id_set_number_key" ON "exercise_sets"("exercise_session_id", "set_number");

-- CreateIndex
CREATE UNIQUE INDEX "repetitions_set_id_rep_number_key" ON "repetitions"("set_id", "rep_number");

-- CreateIndex
CREATE UNIQUE INDEX "repetition_metrics_repetition_id_metric_id_key" ON "repetition_metrics"("repetition_id", "metric_id");

-- AddForeignKey
ALTER TABLE "patient_profiles" ADD CONSTRAINT "patient_profiles_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "exercise_modules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exercise_angle_metrics" ADD CONSTRAINT "exercise_angle_metrics_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exercise_checkpoints" ADD CONSTRAINT "exercise_checkpoints_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exercise_checkpoints" ADD CONSTRAINT "exercise_checkpoints_metric_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "exercise_angle_metrics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rehabilitation_templates" ADD CONSTRAINT "rehabilitation_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "template_exercises" ADD CONSTRAINT "template_exercises_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "rehabilitation_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "template_exercises" ADD CONSTRAINT "template_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "template_exercise_weekdays" ADD CONSTRAINT "template_exercise_weekdays_template_exercise_id_fkey" FOREIGN KEY ("template_exercise_id") REFERENCES "template_exercises"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rehabilitation_plans" ADD CONSTRAINT "rehabilitation_plans_source_template_id_fkey" FOREIGN KEY ("source_template_id") REFERENCES "rehabilitation_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rehabilitation_plans" ADD CONSTRAINT "rehabilitation_plans_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient_profiles"("patient_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rehabilitation_plans" ADD CONSTRAINT "rehabilitation_plans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "plan_exercises" ADD CONSTRAINT "plan_exercises_source_template_exercise_id_fkey" FOREIGN KEY ("source_template_exercise_id") REFERENCES "template_exercises"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "plan_exercises" ADD CONSTRAINT "plan_exercises_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "rehabilitation_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "plan_exercises" ADD CONSTRAINT "plan_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "plan_exercises" ADD CONSTRAINT "plan_exercises_configured_by_fkey" FOREIGN KEY ("configured_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "plan_exercise_weekdays" ADD CONSTRAINT "plan_exercise_weekdays_plan_exercise_id_fkey" FOREIGN KEY ("plan_exercise_id") REFERENCES "plan_exercises"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rehabilitation_days" ADD CONSTRAINT "rehabilitation_days_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient_profiles"("patient_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "daily_exercises" ADD CONSTRAINT "daily_exercises_rehabilitation_day_id_fkey" FOREIGN KEY ("rehabilitation_day_id") REFERENCES "rehabilitation_days"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "daily_exercises" ADD CONSTRAINT "daily_exercises_plan_exercise_id_fkey" FOREIGN KEY ("plan_exercise_id") REFERENCES "plan_exercises"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "daily_exercises" ADD CONSTRAINT "daily_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exercise_sessions" ADD CONSTRAINT "exercise_sessions_daily_exercise_id_fkey" FOREIGN KEY ("daily_exercise_id") REFERENCES "daily_exercises"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "camera_checks" ADD CONSTRAINT "camera_checks_exercise_session_id_fkey" FOREIGN KEY ("exercise_session_id") REFERENCES "exercise_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exercise_sets" ADD CONSTRAINT "exercise_sets_exercise_session_id_fkey" FOREIGN KEY ("exercise_session_id") REFERENCES "exercise_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "repetitions" ADD CONSTRAINT "repetitions_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "exercise_sets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "repetition_metrics" ADD CONSTRAINT "repetition_metrics_repetition_id_fkey" FOREIGN KEY ("repetition_id") REFERENCES "repetitions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "repetition_metrics" ADD CONSTRAINT "repetition_metrics_metric_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "exercise_angle_metrics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "repetition_checkpoint_results" ADD CONSTRAINT "repetition_checkpoint_results_repetition_id_fkey" FOREIGN KEY ("repetition_id") REFERENCES "repetitions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "repetition_checkpoint_results" ADD CONSTRAINT "repetition_checkpoint_results_checkpoint_id_fkey" FOREIGN KEY ("checkpoint_id") REFERENCES "exercise_checkpoints"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- DBML notes: row-local rules that Prisma schema cannot represent as CHECKs.
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_positive_targets_check"
    CHECK ("default_sets" > 0 AND "default_reps_per_set" > 0);
ALTER TABLE "template_exercises" ADD CONSTRAINT "template_exercises_positive_targets_check"
    CHECK ("target_sets" > 0 AND "target_reps_per_set" > 0 AND "sessions_per_day" > 0);
ALTER TABLE "plan_exercises" ADD CONSTRAINT "plan_exercises_positive_targets_check"
    CHECK ("target_sets" > 0 AND "target_reps_per_set" > 0 AND "sessions_per_day" > 0);
ALTER TABLE "plan_exercises" ADD CONSTRAINT "plan_exercises_effective_period_check"
    CHECK ("effective_to" IS NULL OR "effective_to" > "effective_from");
ALTER TABLE "daily_exercises" ADD CONSTRAINT "daily_exercises_positive_targets_check"
    CHECK ("target_sets" > 0 AND "target_reps_per_set" > 0);
ALTER TABLE "exercise_sets" ADD CONSTRAINT "exercise_sets_positive_counts_check"
    CHECK ("set_number" > 0 AND "target_reps" > 0);
ALTER TABLE "repetitions" ADD CONSTRAINT "repetitions_positive_rep_number_check"
    CHECK ("rep_number" > 0);
ALTER TABLE "template_exercise_weekdays" ADD CONSTRAINT "template_exercise_weekdays_range_check"
    CHECK ("weekday" BETWEEN 1 AND 7);
ALTER TABLE "plan_exercise_weekdays" ADD CONSTRAINT "plan_exercise_weekdays_range_check"
    CHECK ("weekday" BETWEEN 1 AND 7);
ALTER TABLE "camera_checks" ADD CONSTRAINT "camera_checks_confidence_range_check"
    CHECK ("confidence" IS NULL OR "confidence" BETWEEN 0 AND 1);
ALTER TABLE "repetitions" ADD CONSTRAINT "repetitions_confidence_range_check"
    CHECK ("confidence" IS NULL OR "confidence" BETWEEN 0 AND 1);

COMMIT;
