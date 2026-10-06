# MoRe Scope and Stack

Agent/onboarding documentation (2026-10-06): root `GEMINI.md` directs Antigravity/Gemini to the shared `AGENTS.md` rules and latest project docs. Root `README.md` now documents first clone, supported Node versions, independent environment keys, Docker/PostgreSQL, Prisma 7 migrations/client, catalog/model setup, Demo vs normal startup, local credentials and troubleshooting. Runtime and database behavior are unchanged by this documentation update.

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

## Patient Responsive Design

- Mobile: compact single-column layout.
- Tablet/iPad: responsive tablet layout, supporting portrait and landscape.
- Form pages use constrained content widths. Login stays a compact single-task form, capped at 420px below 600px and 440px above, with a white form surface matching the selected HTML. Register uses a maximum 420px below 600px and 440px from 600px to 767px; from 768px it keeps a responsive two-column composition capped at 960px, with a 240px identity/progress column and flexible white form surface. From 1000px, birth date and derived age share a row.
- All implemented Patient pages fill at least the viewport height (`100svh` fallback and `100dvh`) and grow with their content. Do not force a fixed viewport height, hide overflow, or shrink text/controls to fit a short screen; allow natural vertical scrolling when needed, including validation messages and short landscape viewports.
- Login and Register start near the top. Tablet top padding is 64px, reduced to 24px on short landscape screens. Register places back navigation in a separate top row, then identity/progress and form content. Mobile stacks the same content in reading order.
- Register actions follow their fields or contextual note by 32px, including personal and medical steps. Do not push actions to the bottom of a tall viewport just to match a Figma frame. Login footer retains a 32px minimum gap and may use remaining space.
- Inputs and primary buttons retain a minimum height of 52px, icon controls 44px, and input text 16px for touch use.
- Exercise/Camera pages use more viewport space than form pages. Home, exercises, guide, camera/results, progress/calendar, profile, registration review, and Doctor screens now have connected UI implementations. Camera provides browser preview and an explicitly labeled sample session mode; MediaPipe assessment is still pending.
- Responsive layout uses CSS breakpoints as the primary mechanism. Avoid client-side device detection (`window.innerWidth`, `navigator.userAgent`, or device-dependent initial rendering) to prevent SSR hydration mismatch. Server and initial client markup must match.
- Do not add `suppressHydrationWarning` to conceal responsive rendering issues. The existing scoped Login/Register autofill workaround predates this responsive update and is unrelated to layout selection; no suppression or device detection is added by this update.

## UI Implementation Guideline

### Baseline Ownership (2026-10-02)

Current visual choice: the user selected `Gait Analysis – UI ผู้ป่วย (ขาว-เขียว) (1).html` instead of the older Patient presentation. An unchanged reference copy is archived at `docs/ui/patient/white-green-reference.html` and is not served as the app. This choice supersedes the older teal welcome band/hamburger Patient guidance; it does not authorize executing the prototype's data/auth logic in production.

- Use the white/green background, white surfaces, green primary/neutral status treatments, blue information accents, and locally hosted IBM Plex Sans Thai. The primary green is slightly darker than the HTML (#137c4b versus #178a55) for readable white button text. No external font request is needed by the app.
- Patient Home uses patient identity, a progress ring with saved-set KPIs, next exercise, seven-day saved-set history, and recent saved results. At tablet/desktop widths, progress and the next-exercise/history column share a row; narrow mobile stacks them.
- Patient navigation is fixed at the bottom below 1024px and a 260px sticky sidebar from 1024px. Reserve bottom safe-area space for content; keep one navigation instance and use CSS only for the switch. Doctor retains its header-led navigation and inherits only the shared tokens/typeface.
- Login/Register share the selected form language while retaining fields, validation, visible last-four-digit initial password, and the personal/medical/review flow. Do not restore the prototype's XXXX placeholder, six-character password rule, fictional user data, or implied real login.
- The prototype's hardcoded streak, angles, automatic repetitions, animation/tutorial claims, and editable patient targets are not adopted by this visual update. Existing saved-set data, clinician-template permissions, missing-media feedback, real webcam preview, and explicitly labeled manual sample controls remain authoritative. No new stored fields or backend behavior are introduced.
- Display preferences use one root provider and one shared native dialog. Mobile below 768px uses a bottom sheet; iPad/desktop uses a centered dialog. The panel offers light/dark and normal/large/extra-large text (16/17.5/19px), a live text sample, and a Done button. Existing `system` defaults and saved preferences remain supported; the panel marks the effective OS color until the user explicitly picks light or dark. Dark mode retains the supplied background #0B151C, surface #12212B, text #E7F0F5 and primary #3CB8AE.
- Existing independent one-year theme/font cookies remain the only persistence mechanism. The root layout reads them for matching server/client markup; browser-only color-scheme observation runs after hydration. Selection applies immediately without navigation, form reset, camera restart, or session changes. No localStorage, dependency, API, or database addition is needed.
- Display access is contextual rather than floating: Login has a top-right gear-only button with an accessible label and tooltip; Home has the same button and a hamburger disclosure; the exercise list has the hamburger only; all Register routes share one top-right overflow disclosure; Profile opens the same panel. Menu items keep their display label beside the gear icon. Pages with no existing contextual menu (Patient exercise selection, guide, progress, edit profile, password) do not gain a settings-only menu. Camera preparation has an overflow disclosure, active training has no settings entry, and paused training has a gear-only display action in its pause panel. Closing settings never resumes training; only Start/Continue does. Set summaries have no settings action.
- Register retains the supplied mobile/iPad progress-bar and form composition and existing desktop composition. Colors now follow the shared selected theme instead of forcing a dark background, so both display modes apply to registration too. Browser zoom remains enabled; layouts scroll naturally instead of clipping controls.
- Patient registration no longer collects a separate username/nickname. The required full name entered on the personal-information step (`patient_profiles.full_name`) is the primary patient display name. Account entry still uses national ID and password; removing the UI-only nickname does not change the database design or introduce authentication/persistence.

The user's work is the primary UI baseline: current user-edited code, supplied Patient/Doctor exports, and explicit flow decisions take precedence over assistant-invented presentation. Extend that work across the connected system; do not replace it with a generic dashboard template or promote an assistant-created page to a design authority.

- Preserve the existing Login/Register fields, validation, initial-password display, and navigation order. Changes to those must address a concrete user request or verified usability problem.
- Use the currently selected HTML's white patient banner, daily progress ring/KPIs, next exercise and neutral/active/completed exercise states. Use its mobile/tablet bottom navigation and desktop sidebar composition.
- Doctor pages retain the supplied header-led workspace, searchable patient rows, contextual patient navigation, and history/detail hierarchy. The assistant-added permanent sidebar is not the baseline.
- Screens without a supplied reference reuse the MoRe logo, selected Thai typography, green commands, quiet surfaces, separators, and form controls. Document these as adaptations, not newly approved designs.
- Responsive accessibility adaptations remain allowed. Do not reproduce mobile dimensions on iPad, add decorative gradients, change data permissions, or fabricate clinical results to resemble a reference.
- Deliver all implemented UI together for one review. Historical notes asking for page-by-page approval are superseded. UI readiness does not mean backend, authentication, clinical media, or MediaPipe readiness.

Figma provides design direction, UX flow, information architecture, and visual identity. It is not a pixel-perfect specification: use it as the structure and direction rather than copying every position and dimension 1:1. This guideline supersedes historical pixel/spacing targets in review notes.

- Preserve brand color families, typography direction, logo, information order, user flow, core component patterns, and the system's minimal, clean, medical-friendly mood.
- Adapt spacing, padding, margins, content widths, component sizes, visual hierarchy, alignment, containers, navigation placement, whitespace, and responsive composition when there is a concrete web UX reason. Validation, helper text, success/error feedback, focus, hover, and interaction states may be improved for clarity and accessibility.
- Mobile and tablet need not share identical composition. Recompose tablet/iPad content for available space; do not simply scale the mobile reference. Reuse design tokens, component language, and reading order across devices.
- Avoid gradients, decorative filler, excessive cards, and generic template styling. Keep improvements scoped; a reference adaptation is not authorization to redesign the entire system or change fields, data requirements, or flow without a UX reason and DBML alignment.
- Prioritize readable type, adequate contrast, touch targets, visible keyboard focus, label/field associations, error feedback, and natural scrolling over matching screenshots. Use CSS breakpoints, not device-dependent initial rendering.
- Review every implemented Patient page and its interaction states on mobile, tablet/iPad in both orientations, desktop, and short screens. Verify overflow, overlap, keyboard navigation, validation, and hydration. Record each departure from Figma and its UX rationale in `docs/ui-map.md`, and actual verification/status in `docs/checklist.md`.

## Rehabilitation Scope

Camera milestone (2026-10-05): official MediaPipe 1.0.1 runs locally in a single worker with resource cleanup. Added configurable cycle counting and transactional session/set/repetition/metric persistence with own-patient guards, partial saves and idempotent retries. Production approval registry is intentionally empty: the clinician must confirm seated knee extension identity against catalog `seated-leg-raise` and its angle/landmark/count/correctness/camera criteria first. No unsupported catalog row or clinical threshold is added. Real model inference on synthetic blank video, logic and database fixtures passed, but real-human camera accuracy and positive approved HTTP/UI recording remain unverified. See `docs/camera-recording.md`; older sample-only runtime notes are historical.

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
- Prisma CLI, Client, and PostgreSQL adapter are installed and verified at `7.10.0`, with `pg` and `dotenv`. MediaPipe runtime remains pending.

## Data Scope

### Birth Date Calendars (2026-10-04)

- Birth dates are normalized Gregorian `YYYY-MM-DD` values for the existing PostgreSQL `date_of_birth DATE`. Native HTML date pickers may localize their presentation, but their DOM values are Gregorian; never subtract 543 from a native picker value based on browser locale.
- Shared `src/lib/birth-date.ts` accepts explicitly identified `gregory` or `buddhist` year calendars and normalizes Buddhist years by subtracting 543 before validation/calculation. It does not guess a calendar from year magnitude. Future imports/non-native pickers must provide their actual calendar explicitly.
- Registration and Patient/Doctor age displays share the same calculation. Age remains derived, with invalid/future dates rejected and current registration date evaluated in Asia/Bangkok. Sample pages retain their existing fixed reference date. No schema change or new age/calendar column is introduced.
- Native date semantics: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#dates

### Local Database Environment (2026-10-04)

- The root `.env` configures `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and `POSTGRES_PORT` for the root `compose.yml`, plus a matching host-side `DATABASE_URL`. Credentials are local-development only; `.env` remains ignored by Git.
- Run `docker compose up -d db` from the repository root to start PostgreSQL. Next.js loads environment files from the root, not `docs/` or `src/app/`. Restart the app after changing environment settings.
- Prisma schema and initial migration now implement the 20 tables from `docs/MoRe_Database_scope_1_3 (1).dbml`; PostgreSQL on host port 5434 has been verified through the server-only Prisma singleton. See `docs/database-setup.md` for setup, SQL CHECK limitations, and teammate migration commands using `--config prisma7.config.ts`.
- Authentication, feature APIs, seed data, and UI persistence remain pending. PostgreSQL initialization variables apply only when its data volume is first initialized; changing `.env` does not change credentials in an existing database.

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

## Combined UI Review Workflow (2026-10-02)

### Integrated Synthetic Demo (2026-10-05)

The latest user request prioritizes one continuously implemented, integrated Demo rather than sprints or module handoffs. The runtime now connects patient and staff auth, clinician templates/versioned settings, patient plans/daily snapshots, synthetic knee counting/saving, saved-only history/calendar/per-repetition results and clinician review through the existing schema/session/Prisma singleton. See `docs/demo-ready.md` for startup, code-audited inventory, tests and limits; historical mock-only statements below no longer describe these connected routes.

Temporary engineering criteria are explicitly authorized only for this Demo. `MORE_DEMO_MODE=1` and a private DB-bound `.demo/manifest.json` restrict the extra `demo-knee-extension` exercise to seeded synthetic patients; the approved clinical registry remains empty. Demo staff cannot read real patient data or prescribe real catalog exercises, and normal staff/patients do not see Demo templates. The original two modules/five catalog exercises are unchanged. No schema/migration/package upgrades were introduced. Actual human movement, physical devices, clinically approved plans/criteria/media, four-digit initial-password policy and production recovery remain separate unverified requirements.

### Account Milestone Update (2026-10-05)

The following update supersedes historical UI-only account statements below. Register (custom password), Login, Logout, Profile and password change now persist through the existing PostgreSQL/Prisma schema. Patient login follows the DBML's HMAC national-ID lookup, with `login_name=NULL`; patient role is server-assigned. Encrypted HttpOnly sessions are verified against active database accounts on every protected request. Patient pages are no longer public sample entry points; patient sessions cannot enter the Doctor workspace. Profile and Home/sidebar identity use the signed-in patient's own data. Training plans/results remain explicitly labeled sample UI, not connected persistence.

The initial four-digit password remains visible per the existing UI but real-account submission is blocked pending the requested policy decision, because the earlier approved scope was mock-only. Custom registration retains the personal/medical/review order; final confirmation creates the account and profile transactionally, then directs to Login. No clinical fields, auth tables or schema changes were added. `docs/accounts-setup.md` documents environment keys, tests, session/throttling limits, and the pending decision. Historical acceptance notes below are not claims that old mock-only tests pass against real auth.

Training milestone (2026-10-05): patient Home/template selection/daily list/guide/camera targets now use PostgreSQL and the existing real session. Template copying and daily creation serialize per patient in transactions. Immutable Asia/Bangkok daily snapshots include sessions_per_day, preserve previous history, and derive progress only from saved sets across all sessions. Switching a plan after today's snapshot takes effect the next Thai day. Server ownership/date/remaining-target checks guard camera entry and Start/Continue. Camera AI/save and full history/progress remain unconnected; actual-assignment Save is disabled. No clinician-approved templates are available yet, so production data shows empty states, not invented prescriptions. Catalog seed and schema are unchanged. Two-patient/concurrency/date/progress browser and service checks passed; see `docs/training-plans.md` for commands, results and remaining data requirements.

- Latest back-navigation decision: existing links belong at the top-left of page content, in normal document flow. They scroll with the page, not as fixed/sticky controls. Preserve explicit destination URLs (not browser history), visible keyboard focus, touch targets, and original labels; do not duplicate back links. This supersedes the earlier floating bottom-right request.

- The user authorized building the connected UI across the whole system and reviewing it in one pass. This supersedes the previous page-by-page approval workflow; do not stop between individual pages.
- The current delivery scope is UI and browser interactions. API/DB, real authentication/password recovery, and MediaPipe assessment remain separate implementation milestones. Sample pages are marked as sample data; do not present sample repetitions as AI or clinical results.
- Client state is shared through the root `DemoProvider` for navigation tests and resets on reload. It never persists national IDs, passwords, or health data in browser storage. Registration review retains personal/medical drafts in memory; no account is created. Patient and Doctor entry links open sample screens without pretending to authenticate.
- UI models map to existing DBML entities: profile fields, exercise catalog (2 modules / 5 exercises), template and patient-plan items, daily target snapshots, saved set summaries, and session summaries. Set/repetition totals and age are derived display values, not new database columns. HN fixtures are synthetic and no national-ID fixtures are stored.
- Daily targets are isolated from plan edits. Changing a patient plan/template does not rewrite the current sample day's assignments or saved result targets. Template changes create a new available version while assigned patient copies retain their earlier values.
- Patient plan selection offers clinician-prepared templates. Arbitrary exercise/target/schedule editing belongs to the Doctor UI, matching the DBML's template permissions. The Figma exercise picker does not override those permissions.
- `/patient/plan` and an optional `/register/plan` entry both exist for review. The latter is not made a mandatory registration step while its placement decision is pending. Medical confirmation currently offers review, then sample completion and Home.
- Tutorial media and clinician-approved exercise-specific instructions/criteria are still required. The guide shows the missing-media state and general preparation; it does not fabricate a tutorial video, angle thresholds, quality score, or movement assessment.
- Verification must cover responsive layouts, keyboard/touch usability, connected navigation, registration draft review, saved-only progress, partial save/pause/discard behavior, immutable daily targets, template versions, empty/error states, and unknown-route handling. Real webcam behavior and physical-device review are recorded separately from emulated tests.
