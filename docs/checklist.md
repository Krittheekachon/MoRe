# MoRe Checklist

- Onboarding/Antigravity docs (2026-10-06): README replaced with first-clone instructions for dependencies/environment/keys/Docker/Prisma/catalog/MediaPipe, Demo vs normal startup and troubleshooting. Added GEMINI.md pointing to shared AGENTS.md rules; linked setup/account/Demo docs to README. Verified UTF-8, Markdown fences/local links, npm/setup-file references, Compose configuration and read-only Prisma migration status (up to date). No runtime/schema change. Fresh-machine installation and live Antigravity rule loading were not executed; documentation compatibility was checked against official Google Rules docs.

- Demo doctor credentials (2026-10-06): existing doctor renamed to `doctor`, requested password hashed and private credentials synchronized; same DB ID/role/manifest preserved. Demo Login browser check passed through `/doctor/login` to `/doctor` on port 3001; Demo identity preserved and wrong password rejected with 401. TypeScript/targeted ESLint passed. No schema/new account or patient-data change.

- Shared MoRe logo (2026-10-06): UI ready for review. Transparent vector movement symbol + theme-aware wordmark in one hero/compact/navigation component, replacing all visible raster-logo uses without changing forms/navigation/logic or adding camera logos/dependencies. Passed 216 browser layout assertions across 9 routes, mobile 390px, iPad portrait 820px/landscape 1180px and desktop 1440px, both themes and all 3 font sizes. Checked transparency, square proportions, wordmark order/theme color, compact hierarchy, heading overlap and page overflow; 0 page errors. Reviewed representative screenshots and Login error-dialog smoke check. TypeScript, full ESLint and production build passed. Emulated browser verification; physical-device review remains with the user.

- Registration redirect (2026-10-06): successful confirmation now routes directly to Login (`/`) and clears the draft. Mocked-response browser checks passed for success redirect and failure remaining on review; TypeScript/targeted ESLint passed. Account smoke script updated for Login destination and new modal label; full account persistence suite not rerun.

- Medical registration modal (2026-10-06): requested button labels, 16px gap and transparent edit outline implemented. Browser assertions passed at 390/820/1440px for labels, spacing, border/transparency, overflow and edit-close behavior. TypeScript/targeted ESLint passed. UI ready for review; no API/DB change.

- TIA option (2026-10-06): commented out in the registration medical form and API allowlist at user request. Existing data/labels retained. TypeScript and targeted ESLint passed; browser/API runtime checks not rerun for this option-only change.

- Initial-password registration fix (2026-10-06): user-authorized last-four-digit registration is enabled in `/api/auth/register/start`. Server derives and hashes the initial password; custom passwords retain the 8-character minimum and registration keeps `password_change_required=false`. Verified real API draft hash (including leading zeroes and ignored client password), invalid-ID rejection, custom short/valid password behavior, and browser initial-password navigation to `/register/personal`. TypeScript and targeted ESLint passed. No account created during these focused checks; final persistence/login was not rerun. Existing account smoke expectation updated to accept initial registration.

- Exercise picker update (2026-10-06): `/register/plan` allows only `seated-leg-raise`, displayed as “นั่งเหยียดขาบนเก้าอี้”. Module 2 remains expandable; other modules and exercises are disabled. TypeScript/targeted ESLint and browser selection/overflow assertions passed at 390, 820 and 1440px. UI-only restriction; authenticated clinician-template APIs and catalog persistence unchanged.

Status labels:

- UI: `Not started`, `In progress`, `Ready for review (รอตรวจ)`, `Passed`
- API/DB: `Not started`, `In progress`, `Passed`

Only mark `Passed` after the user has reviewed or the backend behavior has been verified.

## Current White/Green Review

### Latest Integrated Demo (2026-10-05)

This overrides historical pending/mock-only statements below for connected Demo routes. Code audit and setup/testing instructions are in `demo-ready.md`. No sprint/module stop; no schema change, reset/drop/volume deletion, dependency upgrades, commit or push.

| Feature | UI | API/DB | Current evidence |
| --- | --- | --- | --- |
| Custom-password Register/Login/Profile/Logout | Ready for review | Passed | Existing implementation retained; 58 auth regression checks passed again |
| Patient template selection/daily snapshots/guide | Ready for review | Passed | Real ownership/Thai-day/retry/immutable target behavior retained |
| Synthetic knee camera/counter/pause/continue/save/retry/reset/exit | Ready for review | Passed for Demo | New Demo-only DB-bound criteria; positive partial save/response-loss retry and PostgreSQL readback verified |
| Patient history/calendar/session/set/rep/metric/checkpoint detail | Ready for review | Passed | Replaced connected-route mocks with owned saved-only data; MAX/AVG grouped by metric/side |
| Staff Login/session/role/Logout | Ready for review | Passed | Real hash/session/throttle/CSRF; patient role denied; Demo staff isolated from real patient data |
| Staff patient list/notes/history/detail | Ready for review | Passed | Reads the same saved results; notes persist |
| Staff templates/settings/versions/patient assignment | Ready for review | Passed | Atomic version/retry and unchanged assigned daily snapshots verified |
| Synthetic seed/startup | Ready for review | Passed | One-command setup works; private credentials; 14 policy/logic/idempotency checks |
| Initial four-digit registration/recovery/staff password policy | In progress | In progress | Still requires policy; does not block seeded Demo login |
| Clinically approved 5 exercises/templates/media/real-camera movement | In progress | In progress | Registry empty; Demo authorization is not clinical approval |

- Integrated browser: 373 checks passed, including staff notes/template version/idempotency/assignment, same-result review and both logout guards. 24 viewport/theme/font combinations across 7 connected pages (390, 820, 1180 landscape, 1440px) verify applied preferences and no page overflow; inspected screenshots. UI remains Ready for review, not user-accepted Passed.
- Camera runtime: 10 new Demo checks on actual MediaPipe/synthetic blank video, including permission/model failure, no phantom reps, no active settings, pause/settings and worker/track cleanup. Human movement and physical iPad are NOT tested.
- Final narrow/landscape layout: 76 focused checks passed at 320/1180px × two themes × three font sizes, including HTTP LAN UUID fallback and 48px back controls. MediaPipe 1.0.1 landmark compatibility fixed: visibility is required; absent per-landmark presence is not incorrectly treated as zero confidence. Policy/logic regression covers the installed API shape; no human movement claim.
- Full TypeScript/lint/build and whitespace checks pass. Fixed a real nullable diagnosis-date crash surfaced by integrated tests. Normal five-exercise catalog is unchanged; an explicitly synthetic sixth exercise is isolated by server policy.

- Camera/recording groundwork (2026-10-05): added MediaPipe 1.0.1 with locally prepared model/WASM, a single worker/frame pipeline, configurable completed-cycle counter and transaction-backed session/set/repetition/metric/checkpoint APIs. Reuses real auth/Prisma/daily assignments. Saved-set retries serialize on the daily row; partial saves and MAX/AVG verified. See `camera-recording.md`.
- Camera checks: 11 logic, 26 real PostgreSQL service, 5 real HTTP negative/auth checks and 46 browser checks passed (18 verified viewport/theme/font combinations). Real MediaPipe inference used synthetic blank video only; permission/model failure and worker/stream cleanup verified. Synthetic fixture criteria/accounts/exercise were removed, not seeded or approved. Full lint/TypeScript/build passed. No human-movement or physical-device clinical validation is claimed.
- Clinical gate remains: seated knee extension identity versus `seated-leg-raise`, landmarks/angle definition, start/departure/return/correctness criteria, tracking/stability parameters, camera/side rules and real clinician template need confirmation. Approved registry is empty; actual counting/save is blocked with 422, not populated with guessed correctness. UI/runtime/API groundwork is Ready for review; end-to-end clinical exercise recording remains In progress. Full positive HTTP save and approved-camera pause/save flow are still unverified. Other exercises are unchanged.

- Training integration (2026-10-05): reused the real account session and Prisma singleton. Clinician-template selection copies source/version/side/targets/frequency/weekdays in a patient-locked transaction. Repeated/concurrent selection reuses the current plan. Home, plan selection, today's exercises, guide and camera targets use own-patient database data, with loading/empty/error states. UI: Ready for review; template-selection/daily-generation API/DB: Passed. See `training-plans.md`.
- Training acceptance: 28 service and 123 browser assertions passed using two temporary synthetic patients, including concurrent calls, reload persistence, isolation/injection guards, Thai date boundaries, immutable daily targets, next-day reset without deleting history, saved-set accumulation across sessions, and camera owner/date/completion/closed-day guards. Checked 96 viewport/theme/font/page combinations and inspected screenshots. Active camera has no settings entry; closing display settings while paused preserves pause/counters. Fixtures were removed and existing catalog retained. TypeScript, lint and build passed.
- Remaining training work: no clinician-approved templates or real clinician creator accounts are present, so the picker correctly shows empty. Need confirmed clinical template data; do not derive a prescription from catalog defaults. Clinician template administration, camera AI/result persistence, and full history/progress remain pending. Actual-assignment camera Save is disabled; local example counters do not become saved results. No schema/package/seed/reset/commit/push changes.

- Account integration (2026-10-05): audited main/worktree and both Git commits; no alternate auth implementation exists. Added real custom-password Register/Login/Logout/Profile using the existing Prisma singleton/schema. Patient pages require database-verified sessions; role/owner checks run server-side. Passwords use scrypt, ID uses HMAC/encryption, cookies are HttpOnly. Initial-four-digit registration remains blocked pending policy approval; see `accounts-setup.md`.
- Account acceptance: 58 browser/API assertions passed with two synthetic accounts, including persistent sessions/profile edits, ownership/role injection, duplicate registration, wrong password, CSRF, tampered cookies, password/session rotation, throttling and logout guards. Profile checked in 18 viewport/theme/font combinations; screenshots inspected. PostgreSQL aggregate checks confirm secure storage and catalog unchanged at 2 modules/5 exercises. TypeScript, full lint and build passed. Legacy UI-only auth expectations are historical, not current acceptance results. No schema/reset/commit/push.
- Production cookie check: real built-server response on temporary port 3002 returned 200 with HttpOnly/Secure/SameSite=Lax; no account created, temporary server stopped, existing dev server retained on 3000. Required-password-change rendering does not serialize the patient's real profile or health fields.

- Birth-date calendars (2026-10-04): Added shared Gregorian/Buddhist normalization and age calculation in `src/lib/birth-date.ts`; native date inputs stay Gregorian regardless of displayed calendar, while non-native Buddhist dates require an explicit calendar argument. Registration validates impossible/future birth dates and retains normalized Gregorian draft values; Patient/Doctor sample ages reuse the same calculation with their existing reference date. No schema, migration, dependency, or database write was added.
- Birth-date verification: 12 focused checks passed (4 calculation/date-boundary tests and 8 Chrome/WebKit locale tests at 390/820px); all 29 existing Register checks and the injected-autofill hydration check passed. TypeScript, focused ESLint and `git diff --check` passed. Mobile/iPad screenshots inspected without overflow. Tests await page network-idle before entering form values to avoid input before hydration. Physical OS date-picker presentation remains device review; locale emulation does not reproduce every native picker.
- Remaining regression: the existing concurrent PC/phone/iPad hydration test fails at Register Step 1 national-ID entry before any birth-date interaction, including an isolated rerun (expected initial-password field does not appear; snapshot has the empty-ID warning). It has not been marked passed or changed in this scoped update; the cause remains to be investigated.

- Patient username removal (2026-10-04): Removed the separate username/nickname field, state, ref, and required-field validation from custom-password registration. Patient display names continue to use the required full name from the personal-information step (`patient_profiles.full_name`); the registration review and existing Patient/Doctor views already read this field. Password/national-ID rules and the DBML are unchanged; API/DB remain Not started. TypeScript, focused ESLint, all 31 Register/hydration checks, and the expanded personal-information-to-review name check passed. Responsive checks cover mobile, iPad portrait/landscape, and desktop. UI: Ready for review at `http://localhost:3000/register`; choose custom password, proceed without a username, enter the full name on personal information, then confirm that name in review.

- Display gear update (2026-10-04): Standalone display entries now use a gear-only 48px button with the existing accessible name and a tooltip. Menu items retain their label beside the gear; the panel heading uses the same icon. TypeScript, component ESLint, and the existing shared-panel/keyboard check passed. Browser checks confirmed icon-only content, 48px targets, and panel opening on Login/Home at 390px, 820px, and 1440px. UI: Ready for review; preference/session behavior unchanged.

- Display access update (2026-10-03): Implemented one shared display dialog using the existing root preference provider/cookies. Login/Home have top-right labeled entries; Home/list have contextual hamburger entries; all Register routes share a top-right overflow entry; Profile opens the common panel. Camera preparation uses overflow, active training has no settings entry, pause has an in-panel action, and set summaries have no settings action. Routes without existing contextual menus do not gain settings-only menus. The panel offers light/dark and normal/large/extra-large with a live sample, immediate application, and Done; the previous system default remains supported. Mobile uses a bottom sheet and iPad a centered dialog. Register colors now follow the selected shared theme. UI: Ready for review; API/DB unchanged.
- Display verification: final production build (including TypeScript), standalone `npx tsc --noEmit`, ESLint, and `git diff --check` passed. All 13 focused theme/font/access checks passed, covering both modes and all three sizes at 320x568, 390x844, 820x1180, and 1180x820 (24 combinations), plus desktop preference persistence. Verified 48px panel controls, text sample scaling, no horizontal overflow, all Register entries, form preservation, Tab/Shift+Tab containment, Escape/Done, focus restoration clear of bottom navigation, active camera entry absence, and unchanged paused counters/live synthetic-camera track. Reviewed mobile/iPad screenshots, including dark extra-large panels, Home, registration, active training, and pause. Browser zoom is not restricted by viewport metadata; physical device/zoom review remains pending.
- Regression verification completed in batches: 149 Patient/Doctor/system checks, 13 Login checks, 29 Register checks, 2 Chrome/WebKit hydration checks, and 40 back-navigation checks passed. Auth layout tests now measure page controls rather than the hidden shared dialog, and Register checks reflect the existing helper text and supplied single-column mobile/iPad composition. Playwright screenshots preserve caret styles to avoid test-generated pre-hydration DOM mutations. Browser checks used project Playwright because the Browser skill's Node REPL tool is unavailable in this session.
- Combined review entries: `http://localhost:3000/`, `http://localhost:3000/patient`, `http://localhost:3000/register`, and `http://localhost:3000/patient/exercises/seated-trunk/camera` on the reused dev server. Review checklist: open each contextual entry; select both modes and all three text sizes; reload/navigate to confirm preferences; keep a partially completed form while opening/closing the panel; start camera training and confirm no settings entry; pause and change preferences with Done/Escape, confirm counters/camera remain intact, then explicitly Continue; verify the set summary has no settings entry. Physical phone/iPad and real webcam validation are still user review, not completed device checks.

- Theme default update (2026-10-03): Theme preference now supports `system`, `light`, and `dark`; missing or invalid theme cookies fall back to `system`, which follows the browser/OS color scheme. Profile uses native radio segments instead of a two-state switch. `npx tsc --noEmit`, `npm run lint`, and 8 focused Playwright checks for theme/display settings passed against the reused dev server on port 3000. UI/API data unchanged.

- Register Step 1 dark mobile/iPad update (2026-10-03): `/register` identity verification now follows the supplied dark reference on mobile and iPad/tablet widths, including the back link, large heading, three-bar progress, current-step badge, dark identity card, required national ID label, helper text, and teal primary action. Desktop/web keeps the previous white/green two-column layout. Verified screenshots at 390x844, 820x1180, 1024x768, and 1440x900 on the local dev server; `npx tsc --noEmit` passed. Full ESLint did not complete in this Windows sandbox session after repeated runs and was stopped without reported lint errors.

- Dark mode (2026-10-03): Profile has a keyboard-accessible mode switch using the user's supplied dark palette, applied to shared surfaces, navigation, inputs, dialogs and authentication forms. The theme cookie is independent of font size. Lint and build passed; eight theme/font checks and 34 focused light-mode regression checks passed. Reviewed dark Profile screenshots at 320px, 820px and 1440px plus mobile picker/Login. UI: Ready for review; API/DB unchanged.

- System font-size settings (2026-10-03): Profile now offers normal/large/extra-large text at 16/17.5/19px root sizes. Existing CSS font sizes use equivalent rem values so text scales across Patient, Doctor, Login and Register. A browser cookie retains the preference; no API/DB fields are added. Four focused checks passed for scaling, reload/navigation persistence, keyboard controls, invalid-cookie fallback and overflow across 320px, 820px and 1440px screens.
- Font-size review: lint and production build passed; inspected extra-large Profile screenshots on mobile, tablet and desktop. Browser preference makes the root layout request-rendered, with the saved size present in server markup.
- Final font-size regression: all 237 Playwright checks passed, including existing Login/Register, hydration, back navigation, responsive Patient/Doctor screens, and saved-set workflows.

- Future-module placeholders: Patient/Register pickers display Modules 3-5 as disabled rows for the next phase, using the user's supplied names. Only Modules 1-2 are enabled; no future exercises or database changes are added.
- Placeholder verification: lint passed; picker interaction and five responsive route checks passed on the existing local server.

- UI: Ready for review (รอตรวจ). Latest visual authority is the user-selected HTML archived unchanged at `docs/ui/patient/white-green-reference.html`; older Patient PNG/assistant styling is no longer the current visual target.
- Applied: locally hosted IBM Plex Sans Thai, white/green tokens and controls, white auth form surfaces, Patient identity banner, ring/KPIs, next-exercise plus weekly-history composition, recent saved results, bottom navigation below 1024px and sticky Patient sidebar above. Doctor keeps its header-led layout with shared tokens.
- Preserved: MoRe identity; Login/Register validation and fields; visible final-four-digit initial password; clinician-template permissions; immutable daily targets; saved-only progress; webcam permission/cleanup; pause/reset/partial save; explicit manual sample mode. No schema, API, real authentication, MediaPipe, fictional streak/angles, or raw video storage was added.
- Verification: lint and final production build passed; full existing suite passed 192 checks across auth, registration, hydration and connected responsive routes. After final Home composition/banner refinements, 8 focused checks passed again, including five viewport sizes, bottom/sidebar navigation, partial-save behavior, the local font, and saved-only week history. Browser verification used project Playwright because the in-app Browser execution tool is unavailable in this session.
- Visual comparison: rendered the supplied HTML in Chrome and compared mobile/desktop references with the implementation. Inspected Login, mobile Home, iPad portrait/landscape and desktop Home/screenshots. The final narrow-screen metadata and compact calendar command avoid fragmented text in the reviewed layouts. Physical iPad and actual camera-device review remain pending.
- Plan picker update: `/patient/plan` and `/register/plan` now use the user-provided searchable module accordion visual for selecting exercises, with a selected-count heading, recommendation notice, search field, collapsed module rows, and full-width save action. It remains UI/sample-state only, uses the documented MVP exercise catalog, and does not add new database fields or patient-side target editing.
- Review URLs on the reused dev server: `http://localhost:3000/`, `/register`, `/patient`, `/patient/exercises`, `/patient/progress`, `/patient/profile` and `/doctor`.
- Combined test: Login/Register initial/custom password -> personal/medical/review; Home -> guide/camera -> pause/reset/partial save -> progress/calendar; plan selection; profile/password; Doctor search/notes/plan/history. API/DB and AI remain separate Not started milestones.

## Previous Combined Review

- The user requested correction of the assistant-built system using their work as primary. All implemented Patient/Doctor UI is submitted together; older instructions below to stop after an individual page are historical and no longer active.
- Current correction: supplied Home hierarchy and exercise states, mobile hamburger navigation, inline tablet navigation, header-led Doctor workspace without the assistant sidebar, expandable/native-radio plan selection, tablet profile form pairing, keyboard skip link and menu dismissal. Existing Login/Register and DBML remain unchanged.
- UI status: Ready for review (รอตรวจ). API/DB, real authentication/recovery, MediaPipe and approved clinical media remain Not started.
- Verification: lint and final production build passed. Full suite passed 192 checks, including Login/Register validation, Chrome/WebKit hydration, 28 connected routes at five viewport sizes, saved-only progress and plan behavior. After the final compact Home, graph/detail tabs and Doctor active-navigation refinement, all 148 system checks passed again against the reused dev server on port 3000.
- Visual review: inspected final narrow-mobile Home, mobile graph/camera, iPad Home/profile/plan, and desktop Doctor overview, plus the earlier mobile Doctor and plan screenshots. No unintended page overflow or overlap was observed in the checked layouts; CSS breakpoints select composition without device-dependent markup or new hydration suppression. Physical iPad, actual webcam permissions/device behavior, and user acceptance remain part of combined review.
- Combined review entry points: `http://localhost:3000/`, `/register`, `/patient`, and `/doctor`.
- User review: Register initial/custom password -> personal -> medical -> review; Home -> exercise guide -> camera pause/reset/partial save -> progress/calendar; profile edit/password; Doctor search -> patient -> notes/plan -> history/session; template selection and updates.

## Before Each Task

Use this checklist at the start of each task; these are reusable checks, not completed project milestones.

- [ ] Read `AGENTS.md` and the relevant project `.md` files for current rules, scope, decisions, and progress.
- [ ] Identify applicable skills, read their `SKILL.md` and relevant instructions, and state which skills will be used.
- [ ] For data-related work, read the relevant DBML tables and notes and map the required UI/API data to the existing design.
- [ ] If a database addition or change is needed, record the proposal and affected areas and obtain explicit user approval before implementing that change.

## Project Setup

| Task | UI | API/DB | Notes |
| --- | --- | --- | --- |
| Next.js app boots with `npm run dev` | Passed | Not started | User reported dev server test passed. |
| Root project rules in `AGENTS.md` | Passed | Not started | Created documentation workflow. |
| Scope and stack documentation | Passed | Not started | See `docs/more.md`. |
| Figma route map | Passed | Not started | See `docs/ui-map.md`. |
| Work checklist | Passed | Not started | This file. |
| Prisma setup | No UI change | Passed | Prisma 7.10.0; `prisma7.config.ts`, generated client, server-only singleton; see `database-setup.md`. |
| PostgreSQL connection | No UI change | Passed | Read-only Prisma SELECT 1 against `more` on port 5434; initial migration applied to previously empty DB. |
| MediaPipe Pose Landmarker setup | Not started | Not started | Add client runtime later. |

## Design Reference Preparation

Completed on 2026-10-01; these checks concern reference files, not UI implementation or user acceptance.

- [x] Extract `Gait_Analysis_patient.zip` into `docs/ui/patient/` (20 PNGs).
- [x] Extract `Gait_Analysis_docNtherapist.zip` into `docs/ui/doctor/` (4 PNGs).
- [x] Inspect all 24 images and classify Patient mobile versus Doctor/Therapist desktop.
- [x] Record every exported filename and observed screen/state in `docs/ui-map.md`.
- [x] Correct mobile mappings for exercise guide/list, progress graph/detail, and registration selection/edit states.
- [ ] Obtain iPad references; none was included in these ZIPs.
- [ ] Resolve registration/plan flow and data mismatches before implementing affected screens.

Patient Login has a local mobile reference at `docs/ui/patient/01 — Login.png`. Its original iPad reference is still missing; the implemented tablet/desktop layouts adapt the mobile design. The export-inventory task changed references/documentation only. Patient Login UI was subsequently implemented as recorded below; other screens and all API/DB work remain `Not started`.

## Responsive Review Per Page

Apply these checks to every Patient and Doctor screen before setting UI status to `Ready for review`. Record the actual devices or viewport sizes checked in the page's Notes; set UI to `Passed` only after user approval.

- [ ] Check mobile layout and controls.
- [ ] Check tablet/iPad layout and controls, including portrait and landscape where applicable.
- [ ] Check desktop layout and controls.
- [ ] Check readable content and no unintended overflow or overlap.

Patient screens prioritize mobile and iPad; Doctor screens prioritize desktop. Both must remain usable on the other device sizes listed above. These checks are a reusable review template and do not indicate that any page has been verified yet.

## Patient Screens

| Order | Route | Figma source | UI | API/DB | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | `/` | `01 — Login`, `00-Ipad-login` | Ready for review (รอตรวจ) | Not started | UI-only form, format validation, password visibility, mock notices. Chrome checked at 320x568, 390x844, 768x1024, 1024x768, 1440x900, 844x390; local iPad PNG absent. Await user review. |
| 2 | `/register` | `02 — Register Step 1-*`, `01-Ipad-Register` | Ready for review (รอตรวจ) | Not started | UI-only account/identity step with national ID format validation, initial-password mock state, custom password mock state, password visibility, and local notices. Chrome checked at 320x568, 390x844, 768x1024, 1024x768, 1440x900, 844x390; local iPad PNG absent. Await user review. |
| 3 | `/register/personal` | `03 — Register Step 2`, `02-Ipad-Register 2` | Ready for review (รอตรวจ) | Not started | UI-only personal profile step with full name, birth date, derived age, and sex. Chrome checked at 320x568, 390x844, 768x1024, 1024x768, 820x1180, 1180x820, 1280x720, 1440x900, and 844x390; local iPad PNG absent. Await user review. |
| 4 | `/register/medical` | `04 — Register Step 3`, `03-Ipad-Register 3` | Ready for review (รอตรวจ) | Not started | UI-only medical information step with other conditions, stroke type, diagnosed date, local validation, and mock confirmation. Chrome checked at 320x568, 390x844, 768x1024, 1024x768, 820x1180, 1180x820, 1280x720, 1440x900, and 844x390; local iPad PNG absent. Await user review. |
| 5 | `/register/plan` (candidate) | `04 — Register Step 3-1`, `04 — Register Step 4`, `04 — Register Step 5`, iPad plan frames | Ready for review (รอตรวจ) | Not started | Template selection UI available; optional registration placement pending. See combined review notes. |
| 6 | `/register/review` | `03-Ipad-Register 6` (historical mapping) | Ready for review (รอตรวจ) | Not started | In-memory registration draft review/edit; no local review PNG. |
| 7 | `/register/done` | iPad done variants (historical mapping) | Ready for review (รอตรวจ) | Not started | Sample completion links to Patient Home; no real account creation. |
| 8 | `/patient` | `04 — Home Dashboard`, `04-Ipad-Home Dashboard` | Ready for review (รอตรวจ) | Not started | Daily dashboard. |
| 9 | `/patient/exercises` | `05 — Exercise-Page-1`, `05-Ipad-Exercise` | Ready for review (รอตรวจ) | Not started | Daily exercise list; local mobile PNG available. |
| 10 | `/patient/exercises/[exerciseId]/guide` | `05 — Exercise-Page`, `06-Ipad-Exercise_guide`, `07-Ipad-Exercise_guide2` | Ready for review (รอตรวจ) | Not started | Tutorial before camera start; local mobile PNG available. |
| 11 | `/patient/exercises/[exerciseId]/camera` | `07 — AI Camera Assessment`, `08-Ipad-Exercise_page` | Ready for review (รอตรวจ) | Not started | Live camera preview and sample set controls; MediaPipe assessment remains Not started. |
| 12 | `/patient/exercises/[exerciseId]/result` (candidate) | `07 — AI Camera Assessment-1`, `07 — AI Camera Assessment-2`, iPad finish frames | Ready for review (รอตรวจ) | Not started | Local mobile states are result overlays within the camera flow; standalone route unconfirmed. |
| 13 | `/patient/progress` | `11-Ipad-Progres-page` and mobile progress frames | Ready for review (รอตรวจ) | Not started | Progress overview. |
| 14 | `/patient/progress/calendar` | `12-Ipad-Progress-Calendar` | Ready for review (รอตรวจ) | Not started | Calendar view. |
| 15 | `/patient/progress/calendar/[date]` | `13-Ipad-Progress-Calendar-info` | Ready for review (รอตรวจ) | Not started | Daily progress detail. |
| 16 | `/patient/progress/[exerciseId]` | `04 — Home Dashboard-2`, `14-Ipad-Progress-graph` | Ready for review (รอตรวจ) | Not started | Exercise trend graph; local mobile PNG available. |
| 17 | `/patient/progress/[exerciseId]/detail` | `04 — Home Dashboard-3`, `15-Ipad-Progress-detail` | Ready for review (รอตรวจ) | Not started | Exercise progress detail; local mobile PNG available. |
| 18 | `/patient/profile` | `10 — Profile & Settings`, `16-Patient-info` | Ready for review (รอตรวจ) | Not started | Profile and settings. |
| 19 | `/patient/profile/edit` | `17-Edit-Patient-info` | Ready for review (รอตรวจ) | Not started | Edit patient profile. |
| 20 | `/patient/change-password` | `18-Change-Password` | Ready for review (รอตรวจ) | Not started | Change password. |
| 21 | `/forgot-password` | `19-Forgot-Password` | Ready for review (รอตรวจ) | Not started | Recovery flow. |
| 22 | `/patient/plan` | `04 — Register Step 6` | Ready for review (รอตรวจ) | Not started | Patient selects prepared templates; custom target editing is in Doctor UI. |

## Patient Login Review Notes (2026-10-01)

- Patient Login renders directly at `/` with no redirect; the former `/login` route has been removed. Removed the Next.js starter page/assets and replaced its favicon with the MoRe mark. No dashboard, registration, recovery, or Doctor UI was added.
- Visual reference: `docs/ui/patient/01 — Login.png`; the logo bitmap is extracted from that reference into `public/more-mark.png`. Native iPhone status bar, notch, and home indicator are not duplicated in the web page.
- Thai font is self-hosted through `@fontsource/noto-sans-thai`; icons use `lucide-react`. Tablet/desktop use the same form in a centered, constrained layout without a decorative panel.
- Disabled the bottom-left Next.js development indicator with `devIndicators: false` in `next.config.ts`.
- Fixed LAN development access: Next.js dev origins now include loopback and the workstation's current external IPv4 interface addresses, discovered at config load. Before this change, mobile-touch testing through a LAN IP on port 3000 produced HMR errors and no inline validation; after the change, both required-field warnings appeared. No unrestricted origin wildcard or database change was added.
- Validation checks required national ID, exactly 13 ASCII digits (spaces/hyphens allowed as separators), and a nonblank password. Errors appear beside fields with focus on the first invalid input. This checks format only, not ID checksum, identity, account existence, or password correctness; no registration password policy is imposed on login.
- Valid form submission shows a clearly labeled mock notice, clears the password, and stays on `/`. No authentication, session, database, API request, credential logging, or application storage is implemented.
- Recovery, registration and medical-personnel entry buttons display an unavailable-page notice; their destination pages have not been built.
- Verification: `npm run lint`, `npm run build`, and 9 Playwright checks via `npm run test:ui`, including mobile-device emulation with a touch submission and both empty-field warnings. Checked default/error layouts in all six sizes above, visible local logo, 44px minimum controls, no horizontal overflow, keyboard submit, password visibility, modal close/focus return, and absence of credential mutations/storage. Short screens scroll vertically. The full suite also passed against the Wi-Fi IP on dev port 3000; physical phone/Safari verification remains with the user.
- Review URL: `http://localhost:3001/` (Patient Login directly), served by the verified production build (`npm run start -- --hostname 0.0.0.0 --port 3001`). The development server at port 3000 is also usable via the workstation's Wi-Fi IP after fixing `allowedDevOrigins`; both devices should test the same server/port. Reload after changing the config, and restart dev if network interface addresses change.
- Tests use installed Chrome and default to `http://127.0.0.1:3001`; set `MORE_TEST_URL` to test a different running server. Screenshots are under ignored `test-results/`.
- Concurrent-device hydration investigation: the physical iPad screenshot identified `__gcruniqueid="1"`, injected by Chrome iOS Autofill before hydration. Added scoped `suppressHydrationWarning` to the Login form and its two inputs only; no layout-wide suppression, Autofill disabling, or database change. This suppresses attribute mismatch warnings on those elements, not only that attribute. The regression test injects Chrome's IDs before releasing client scripts and verifies no console errors and both required-field warnings. Lint, build, and all 11 Playwright tests passed against dev port 3000, including concurrent PC/iPhone/iPad emulation and six responsive sizes. Status remains Ready for review (รอตรวจ); reload `http://192.168.1.92:3000/` on the physical iPad to confirm. Added `tests/hydration.spec.ts`; install its browser with `npx playwright install webkit`.
- No commit or push. Stop here until the user approves this page.

## Patient Register Review Notes (2026-10-02)

- Patient Register renders at `/register` with UI-only Step 1 variants from the local mobile references: national ID entry, initial-password display, and custom-password entry. The Patient Login registration action now links to `/register`.
- The form validates national ID format only (13 ASCII digits after removing spaces/hyphens). The custom-password state validates nonblank password, minimum 8 characters, matching confirmation, and nonblank display name. It does not perform identity lookup, account creation, session creation, API calls, database writes, credential logging, or application storage.
- DBML alignment: patient login/account identity remains national-ID based through lookup/encryption fields; patient `username` is not added to the database. The visible “ชื่อผู้ใช้” field is treated as UI-only review text for this screen until backend registration behavior is approved.
- The initial-password behavior is represented as a mock UI state from the reference only. No final-four digits are stored separately, and no real password is generated or persisted.
- Verification: `npm run lint`, `npm run build`, and 19 Playwright checks via `npm run test:ui` passed against `http://127.0.0.1:3001`, including responsive checks for `/register` at 320x568, 390x844, 768x1024, 1024x768, 1440x900, and 844x390. Screenshots are under ignored `test-results/`.
- Review URL: `http://localhost:3001/register`, served by the verified production build. Stop here until the user approves this page.

## Patient Responsive Review (2026-10-02)

- Scope: existing Patient Login (`/`) and all three Register (`/register`) states. Subsequent Register pages, Main/Home, and Exercise/Camera do not yet exist in `src/app`; no new pages or Doctor layouts were built in this update.
- Implementation: `src/app/login.css` retains the existing form design and mobile spacing. The background uses viewport minimum height (`100svh` fallback, `100dvh`), with natural vertical scrolling for short screens. From the existing 600px CSS breakpoint, Register uses a centered content group capped at 440px, a vertically aligned back button/logo, and 40px before initial/custom-password actions instead of the old 220px/180px gaps. Identity-step spacing remains 44px.
- Responsive specification is maintained in `docs/more.md`, under **Patient Responsive Design**, including future Exercise/Camera viewport use, both orientations, CSS breakpoints, and matching server/initial client markup. No device detection, device-dependent rendering, or new hydration suppression was introduced. Existing scoped autofill suppression remains unchanged.
- Verification: lint and production build passed. All 19 Playwright checks passed against the reused development server at `http://127.0.0.1:3000`. Register checks now cover identity, initial-password, custom-password, and inline-validation states across 320x568, 390x844, 768x1024, 1024x768, 1440x900, and 844x390, checking horizontal overflow, centered/max-width bounds, viewport background height, touch-control sizes, action spacing, and console/page errors. Screenshots were inspected for Mobile and iPad portrait/landscape, including Login.
- The expanded hydration checks subsequently passed (2/2), covering concurrent desktop Chrome and WebKit iPhone/iPad Login/Register rendering and interactions, plus the existing injected Chrome autofill regression. This is browser emulation; physical iPad verification is still part of user review.
- Review URLs: `http://localhost:3000/register` and `http://localhost:3000/`. UI remains Ready for review; API/DB status remains Not started.

## Register Identity Layout Adjustment (2026-10-02)

- Adjusted only the national-ID-only Register state at widths of 600px and above: content starts at the top page padding rather than being vertically centered, with a 560px maximum width and 24px heading-to-form gap. Mobile, Login, and Register password states retain their existing layouts. Step styling uses the existing form state through `data-step`, with no device detection or initial-render mismatch.
- Updated the current responsive specification in `docs/more.md`. Lint and production build passed. Register and hydration checks passed (9/9), including Mobile, iPad portrait/landscape, desktop, and concurrent WebKit iPhone/iPad. Inspected screenshots confirm the wider, top-aligned identity form and no horizontal overflow. Review URL: `http://localhost:3000/register`; UI remains Ready for review.

## Patient Viewport Fit Update (2026-10-02)

- Current implementation supersedes the narrower and vertically centered tablet rules in earlier review notes. Login and every Register state now use a horizontally centered, top-aligned container, maximum 420px below 600px and 560px from 600px. Register actions use 40px after the final field/note, with 44px for the identity step (34px on narrow mobile). Removed viewport-proportional mobile gaps and shared vertical centering. Login footer minimum spacing is reduced to 32px.
- Pages retain viewport minimum height and grow naturally with content, validation, and short landscape screens. Controls/text keep their touch-friendly sizes; no fixed-height clipping, responsive device detection, or additional hydration suppression is used. `docs/more.md` records these as the current Patient Responsive Design requirements for future pages too. Home, later registration steps, and Exercise/Camera remain Not started; Doctor UI is outside this change.
- Verification: lint and production build passed. The expanded suite covers 25 checks: Login/hydration passed in the full run; all 10 Register checks passed after correcting the test's top-position measurement to document coordinates when the browser scrolls. Checked 320x568, 390x844, 768x1024, 1024x768, 820x1180, 1180x820, 1280x720, 1440x900, and 844x390. No horizontal overflow or new console/hydration errors were observed. Register screenshots were inspected across Mobile, tablet/iPad orientations, and desktop.
- Review URLs: `http://localhost:3000/` and `http://localhost:3000/register`. Existing Patient UI remains Ready for review; API/DB status is unchanged.

## Patient Register Personal/Medical Review Notes (2026-10-02)

- Added `/register/personal` for the local `03 — Register Step 2` reference. It includes full name, date of birth, derived age, and sex. Age is calculated client-side from date of birth and is not persisted as a separate stored field, matching the DBML note.
- Added `/register/medical` for the local `04 — Register Step 3` reference. It includes other conditions, stroke type, diagnosed date, the explanatory note, and a UI-only completion dialog. No account creation, API request, database write, credential storage, national-ID logging, or application storage is implemented.
- Updated the Step 1 register flow so both initial-password and custom-password paths navigate to `/register/personal`; `/register/personal` then navigates to `/register/medical`.
- Verification: `npm run lint`, `npm run build`, and 44 Playwright checks via `npm run test:ui` passed against the rebuilt production server at `http://127.0.0.1:3001`. The new route checks cover 320x568, 390x844, 768x1024, 1024x768, 820x1180, 1180x820, 1280x720, 1440x900, and 844x390 with no horizontal overflow, 44px minimum controls, validation states, no console/page errors, and no local/session storage mutations.
- Review URLs: `http://localhost:3001/register/personal` and `http://localhost:3001/register/medical`. UI is Ready for review; API/DB status remains Not started.

## Initial Password Display Update (2026-10-02)

- The initial-password field now displays the entered national ID's final four digits, including leading zeros, instead of `XXXX`, as requested. The value is derived in memory.
- Verification: lint and four existing Playwright checks passed against the dev server at `http://localhost:3000`, covering the registration flow and mobile, iPad portrait, and desktop layouts. Review URL: `http://localhost:3000/register`.

## Patient UI Direction and Responsive Audit (2026-10-02)

- Applied the user's updated principle: Figma guides design direction, flow, information architecture, and identity; it is not a pixel-perfect specification. Updated existing `AGENTS.md`, `docs/more.md`, and `docs/ui-map.md`, including per-page adaptation reasons. New guidance supersedes the historical fixed spacing/width notes above.
- Audited every implemented Patient route: `/`, `/register` (identity/initial/custom password), `/register/personal`, and `/register/medical`. Future Patient screens have no implementation to audit yet; no new routes or fields were added.
- Register now shares an accessible three-step progress list, separate task headings, neutral surfaces, restrained dividers/notes, and content-adjacent actions. From 768px, identity/progress and the form use a two-column composition; from 1000px, birth date and derived age share a row. Mobile retains a single-column reading order. Personal back-navigation text now matches its destination.
- Login retains its compact single-task composition. Shared primary teal has improved contrast, password icons have simpler styling, and links gain explicit keyboard focus. Existing validation, field order, password display, UI-only behavior, and API/DB status are preserved. CSS breakpoints handle composition; no device-dependent rendering or additional hydration suppression was added.
- Verification: lint and production build passed. All 44 existing Playwright checks passed on the local dev server, covering nine viewports (320x568, 390x844, 768x1024, 1024x768, 820x1180, 1180x820, 1280x720, 1440x900, 844x390), validation/flow, console errors, and Chrome/WebKit hydration. Three focused Mobile/iPad checks also passed after the final tablet heading-wrap adjustment. Screenshots were visually inspected for Login, mobile Register, iPad account/personal forms, and narrow-mobile medical form. No unintended horizontal overflow or control overlap was found; short screens scroll naturally.
- Review URLs on the reused dev server: `http://localhost:3000/`, `/register`, `/register/personal`, and `/register/medical`. UI remains Ready for review pending user review; API/DB remains Not started.

## Doctor Screens


| Order | Route | Figma source | UI | API/DB | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | `/doctor` | `Doctor Dashboard — Patient Overview` | Ready for review (รอตรวจ) | Not started | Desktop dashboard and patient search. |
| 2 | `/doctor/patients/[patientId]` | `Patient — Personal Information` | Ready for review (รอตรวจ) | Not started | Patient profile and plan. |
| 3 | `/doctor/patients/[patientId]/assessments` | `Patient — Assessment History` | Ready for review (รอตรวจ) | Not started | Assessment/progress history. |
| 4 | `/doctor/patients/[patientId]/sessions/[sessionId]` | `Patient — Session Details` | Ready for review (รอตรวจ) | Not started | Session metrics and details. |

## API / Database

### Training Plan Readiness (2026-10-04)

Historical catalog-only results below are superseded by the 2026-10-05 account/training milestones above. Auth and patient training integration are now present and verified; approved clinical templates and camera result persistence remain pending.

- Workspace inspection for the requested plan integration does not match the reported auth milestone: `patient-login.tsx` still has its UI-only submission, patient pages/Profile use `DemoProvider`, and there is no session verifier/auth API. Record-count inspection of the configured database before seeding found zero users, profiles, modules, exercises, templates, and plans. No account information was read or logged.
- Completed the independent catalog seed in `prisma/seed.mjs`, registered in `prisma7.config.ts`: 2 modules / 5 documented MVP exercises, one transaction, parameterized queries and existing unique keys. First run inserted 2/5, second inserted 0/0. Existing records are not overwritten. The standalone Node seed uses the installed `pg` driver; app access remains through the existing Prisma singleton, whose catalog read was verified successfully.
- No patient/clinician accounts, plans, metrics, checkpoints, camera guidance, or tutorial content were invented. Exercise default targets remain the DBML defaults (3/10), not a patient prescription. Template seeding still needs a real authorized creator and explicitly supplied template targets/schedule; `created_by` cannot be guessed.
- TypeScript, full lint, and production build passed. Authenticated plan selection, two-patient isolation, daily snapshots/progress and camera-entry authorization remain pending the actual existing auth/session code. No UI, schema, migration, auth system, camera save, commit, or push was changed for this partial task. See `docs/training-plans.md` for the blocker and remaining acceptance checks.

### Database Setup Verification (2026-10-04)

- PostgreSQL 17.11 on host port 5434 / database `more` was inspected read-only before migration: no existing tables or migration history. Applied reviewed `20261004095304_init` with `migrate deploy`, without reset/drop or volume deletion.
- DBML comparison passed for all 20 tables and 175 columns (types, sizes, nullability, defaults), all 29 FK targets/NO ACTION rules, and 35 primary/unique keys. PostgreSQL also has 11 SQL CHECK constraints from existing DBML notes; these are not represented by Prisma schema. `_prisma_migrations` is tooling metadata, not an added application entity.
- Passed Prisma format, validate, generate, migrate status, and read-only migrate diff; Prisma-visible schema has no drift. Actual server singleton passed SELECT 1, model count (zero users), and repeated-import identity checks. No application records or sample patients were inserted.
- Passed `npx tsc --noEmit`, `npm run lint`, production `npm run build`, and `git diff --check`. Generated Prisma files are excluded from lint/Git and regenerated locally. Verified `.env`, `docs/.env`, and `.env.local` are ignored while `.env.example` can be shared. Existing `.gitignore` already had the required rules and was preserved.
- Thai teammate instructions: `docs/database-setup.md`. No package version changes, UI modifications, authentication/API integration, commits, or pushes. Cross-table business rules remain for the corresponding future APIs.

| Task | UI | API/DB | Notes |
| --- | --- | --- | --- |
| Translate DBML to Prisma schema | No UI change | Passed | 20 tables / 175 columns; 29 FK, 11 SQL CHECK; migration `20261004095304_init` applied without reset. Feature APIs remain pending. |
| Auth model and password hashing | Ready for review (รอตรวจ) | In progress | Custom-password Register/Login/Logout/session/password change verified; four-digit policy awaits approval. Staff Login/recovery and production shared throttling/revocation remain out of scope. |
| Patient profile persistence | Ready for review (รอตรวจ) | Passed | Own-profile GET/PATCH verified with two synthetic accounts; HMAC/encrypted ID, no browser password hash. |
| Exercise catalog seed data | No UI change | Passed | Idempotent catalog-only seed: 2 modules, 5 MVP exercises; no patient/clinician or prescription data. |
| Rehabilitation plan APIs | Ready for review (รอตรวจ) | Passed | Read clinician templates and transactionally select own patient plan; clinician authoring and approved real templates still pending. |
| Daily exercise generation | Ready for review (รอตรวจ) | Passed | Asia/Bangkok, idempotent immutable snapshots and saved-set progress; history retained. |
| Exercise session and set recording | Not started | Not started | Save per-set results; discard unsaved cancelled sets. |
| Repetition metrics and checkpoint results | Not started | Not started | Store aggregate/result records, not per-frame pose data. |
| Doctor patient search | Not started | Not started | Name, HN, and secure ID lookup as implemented. |

## Back Navigation Verification (2026-10-02)

- Latest user request supersedes floating navigation: restored existing back links to the top-left of content in normal flow across registration, auth entry/recovery, and Patient/Doctor details. Removed floating-only extra bottom padding; destinations and data behavior are unchanged.
- Passed 40 updated browser checks across 10 representative routes at 320, 768, 1024, and 1440px: back precedes the heading, is static, scrolls with content, has at least a 44px touch target, and supports keyboard navigation to its original destination without browser errors.
- Passed all 29 registration checks, including mobile landscape and larger tablets. ESLint and production build passed. These are emulated browser checks, not physical-device validation.
- Exercise-selection form update: the individual exercise selection visual has been applied as a searchable module accordion for the existing MVP catalog. Editable sets/repetitions and any permission/schema changes remain out of this update and still belong to Doctor flows unless explicitly approved later.

## Demo Mock Plan Verification (2026-10-06)

- UI complete: Demo-only “แผนทดลอง — นั่งเหยียดขา” has MOCK badges on its card/details, selected plan, and result history/details. Targets are one existing `demo-knee-extension` exercise, left side, 1 set × 5 repetitions; clear nonclinical descriptions and existing Demo criteria remain in place.
- API/DB complete: additive, idempotent Demo seed reuses version 1 and existing exercise/criteria; no schema changes or automatic patient assignment. Results expose Mock provenance through the existing source-template relationship and copied plan-exercise version. Existing daily snapshots remain unchanged when selecting a different plan.
- Verified: two seed runs preserve existing templates/plans/exercises/sets; actual Login and selection, simulated five-repetition training, pause/resume, save and PostgreSQL readback; result history/reload; 122 browser checks over 18 viewport/theme/font combinations and 14 Demo policy checks. TypeScript, lint and production build pass. Real-person camera movement and physical-device checks remain unverified. Usage and local review details: `docs/demo-ready.md`.

## Decision Points

| Topic | Decision needed |
| --- | --- |
| Patient web vs native mobile | Current repo is Next.js web; Figma includes mobile/iPad web-like screens while report mentions Flutter research. Confirm all MVP patient UI should be implemented in Next.js. |
| Doctor registration | Report says doctor/therapist login account is prepared by developers in this phase, while some scope text mentions signup. Confirm no doctor self-register for MVP. |
| Video storage | Report mentions video in one doctor view sentence, while DBML says no video/per-frame storage. Confirm DBML wins unless video storage is explicitly added. |
| Rehabilitation modules | Report text says 5 modules generally, but MVP list and DBML currently include 2 modules and 5 exercises. Confirm MVP remains 2 modules / 5 exercises. |
| National ID handling | DBML proposes HMAC lookup plus encrypted storage. Confirm key management approach before implementing persistence. |
| Local registration references | Separate patient username input removed by user decision on 2026-10-04; use the personal-information full name. Secure backend identity/account persistence remains pending DBML-based implementation. |
| Patient plan flow | Exported Steps 3-1/4/5 select exercises and Step 6 edits selections from home. Decide registration versus post-registration placement and edit route; Steps 5/6 are not review/completion screens. |
| Local design scope | Export shows Modules 1-5 and a dashboard streak. Resolve against MVP scope and DBML before implementing affected behavior. No iPad PNGs were supplied. |
