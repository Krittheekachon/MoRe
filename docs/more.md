# MoRe Scope and Stack

MoRe is a web-based stroke rehabilitation platform for patients and doctors/therapists. It supports home rehabilitation, camera-based movement assessment, rehabilitation plan assignment, and progress tracking. The system supports rehabilitation work; it does not replace clinical diagnosis or professional assessment.

## Product Scope

### Patient

- Register and log in.
- Fill in personal information and medical information.
- View assigned daily rehabilitation exercises with target sets and repetitions.
- Read exercise tutorials before starting.
- Perform rehabilitation through the camera.
- Receive pose feedback, repetition counting, countdown/audio cues, and camera setup guidance.
- Save exercise results per set, even when the target is not fully completed.
- Cancel an exercise set before saving so it is not counted.
- View daily progress and longer-term progress trends.
- Edit profile information and change password.

### Doctor / Therapist

- Log in with an account prepared by the development team for the current phase.
- Search patients by name, national ID lookup, or HN depending on the implemented phase.
- View patient information, rehabilitation history, assessment history, and movement metrics.
- Create and adjust rehabilitation plans by selecting module, exercise, sets, repetitions, and schedule.
- Track patient progress and review clinical movement indicators.
- Add clinical or rehabilitation notes when that feature is implemented.

### System

- Use MediaPipe Pose Landmarker to detect body landmarks.
- Calculate joint angles and exercise-specific movement metrics.
- Check camera position before exercise.
- Count repetitions and evaluate movement checkpoints.
- Calculate daily progress from saved sets versus assigned sets.
- Store saved results only; cancelled unsaved sets must not affect progress.

## Device and Responsive Scope

- All Patient and Doctor/Therapist pages support responsive layouts across mobile, tablet (including iPad), and desktop.
- Patient primary devices are mobile and iPad. Other tablets and desktop must remain usable.
- Doctor/Therapist primary devices are desktop. Tablet and mobile must remain usable.
- Adapt layouts to available screen width, including portrait and landscape where applicable. Keep content readable and controls accessible without unintended overflow or overlap.
- Verify each page on mobile, tablet/iPad, and desktop before submitting it for UI review.

## Rehabilitation Scope

MVP exercise scope currently covers 2 modules and 5 exercises:

- Module 1: Diminished Trunk Control and Loss of Leg Functions
  - Seated Trunk Exercise
  - Ankle Pumping Exercise
- Module 2: Trunk Control and Beginning of Leg Functions
  - Seated Leg Raise
  - Sit to Stand
  - Bridging Exercise

Exercises outside this list are out of MVP scope unless explicitly added.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma
- MediaPipe Pose Landmarker

Current repository state:

- Next.js `16.3.8`
- React `19.2.8`
- Tailwind CSS `^4`
- Prisma, PostgreSQL integration, and MediaPipe packages are planned by scope but are not installed in `package.json` yet.

## Data Scope

Source: `docs/MoRe_Database_scope_1_3 (1).dbml`.

The existing DBML is the source of truth for data-related UI, forms, mock data, validation, API contracts, Prisma models, and persistence. Use its tables, fields, relationships, constraints, and notes when implementing data behavior. Any addition or change to the database design requires explaining the proposal and obtaining explicit user approval before implementation. Record mismatches with Figma or the report as decision points; after approval, update the DBML and affected documentation with the implementation.

Main data areas:

- Users and roles: patient, doctor, therapist, admin.
- Patient profiles with HN, encrypted national ID, national ID lookup hash, personal data, and medical notes.
- Exercise modules, exercises, angle metrics, and movement checkpoints.
- Rehabilitation templates and patient-specific rehabilitation plans.
- Daily exercise assignments.
- Exercise sessions, camera checks, saved sets, repetitions, repetition metrics, and checkpoint results.

Important persistence rules:

- Store password hashes only.
- Do not log raw national ID.
- Use national ID lookup hash for exact lookup and encrypted national ID for protected storage.
- Count reports from saved exercise sets.
- Do not persist raw video or per-frame pose data in the current DBML scope.

## Known Document Notes

- The user mentioned a PDF report, but the repository currently contains `docs/Term1 Final Project Report (1).docx`.
- The report mentions Flutter/Firebase/IMU in research and broader project context, while this repository scope is Next.js web with PostgreSQL/Prisma and MediaPipe Pose Landmarker.
- If report details, DBML, and Figma conflict, pause implementation for the affected area and list decision points.
