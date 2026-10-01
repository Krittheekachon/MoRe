# MoRe Checklist

Status labels:

- UI: `Not started`, `In progress`, `Ready for review`, `Passed`
- API/DB: `Not started`, `In progress`, `Passed`

Only mark `Passed` after the user has reviewed or the backend behavior has been verified.

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
| Prisma setup | Not started | Not started | Install/configure Prisma later. |
| PostgreSQL connection | Not started | Not started | Add environment variables and schema later. |
| MediaPipe Pose Landmarker setup | Not started | Not started | Add client runtime later. |

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
| 1 | `/login` | `01 — Login`, `00-Ipad-login` | Not started | Not started | First page to implement. |
| 2 | `/register` | `02 — Register Step 1-*`, `01-Ipad-Register` | Not started | Not started | Account and identity entry. |
| 3 | `/register/personal` | `03 — Register Step 2`, `02-Ipad-Register 2` | Not started | Not started | Personal profile fields. |
| 4 | `/register/medical` | `04 — Register Step 3`, `03-Ipad-Register 3` | Not started | Not started | Stroke and health information. |
| 5 | `/register/plan` | `04 — Register Step 4`, `04 — Register Step 5`, iPad plan frames | Not started | Not started | Plan/module selection, if patient-selectable in this phase. |
| 6 | `/register/review` | `04 — Register Step 5`, `03-Ipad-Register 6` | Not started | Not started | Review before completion. |
| 7 | `/register/done` | `04 — Register Step 6`, iPad done variants | Not started | Not started | Completion state. |
| 8 | `/patient` | `04 — Home Dashboard`, `04-Ipad-Home Dashboard` | Not started | Not started | Daily dashboard. |
| 9 | `/patient/exercises` | `05 — Exercise-Page`, `05-Ipad-Exercise` | Not started | Not started | Daily exercises and exercise list. |
| 10 | `/patient/exercises/[exerciseId]/guide` | `06-Ipad-Exercise_guide`, `07-Ipad-Exercise_guide2` | Not started | Not started | Tutorial before camera start. |
| 11 | `/patient/exercises/[exerciseId]/camera` | `07 — AI Camera Assessment`, `08-Ipad-Exercise_page` | Not started | Not started | MediaPipe camera assessment. |
| 12 | `/patient/exercises/[exerciseId]/result` | finish all/not all frames | Not started | Not started | Save set result, completed/incomplete states. |
| 13 | `/patient/progress` | `11-Ipad-Progres-page` and mobile progress frames | Not started | Not started | Progress overview. |
| 14 | `/patient/progress/calendar` | `12-Ipad-Progress-Calendar` | Not started | Not started | Calendar view. |
| 15 | `/patient/progress/calendar/[date]` | `13-Ipad-Progress-Calendar-info` | Not started | Not started | Daily progress detail. |
| 16 | `/patient/progress/[exerciseId]` | `14-Ipad-Progress-graph` | Not started | Not started | Exercise trend graph. |
| 17 | `/patient/progress/[exerciseId]/detail` | `15-Ipad-Progress-detail` | Not started | Not started | Exercise progress detail. |
| 18 | `/patient/profile` | `10 — Profile & Settings`, `16-Patient-info` | Not started | Not started | Profile and settings. |
| 19 | `/patient/profile/edit` | `17-Edit-Patient-info` | Not started | Not started | Edit patient profile. |
| 20 | `/patient/change-password` | `18-Change-Password` | Not started | Not started | Change password. |
| 21 | `/forgot-password` | `19-Forgot-Password` | Not started | Not started | Recovery flow. |

## Doctor Screens

| Order | Route | Figma source | UI | API/DB | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | `/doctor` | `Doctor Dashboard — Patient Overview` | Not started | Not started | Desktop dashboard and patient search. |
| 2 | `/doctor/patients/[patientId]` | `Patient — Personal Information` | Not started | Not started | Patient profile and plan. |
| 3 | `/doctor/patients/[patientId]/assessments` | `Patient — Assessment History` | Not started | Not started | Assessment/progress history. |
| 4 | `/doctor/patients/[patientId]/sessions/[sessionId]` | `Patient — Session Details` | Not started | Not started | Session metrics and details. |

## API / Database

| Task | UI | API/DB | Notes |
| --- | --- | --- | --- |
| Translate DBML to Prisma schema | Not started | Not started | Base on `docs/MoRe_Database_scope_1_3 (1).dbml`. |
| Auth model and password hashing | Not started | Not started | Store password hashes only. |
| Patient profile persistence | Not started | Not started | Use national ID lookup hash and encrypted national ID. |
| Exercise catalog seed data | Not started | Not started | 2 modules, 5 MVP exercises. |
| Rehabilitation plan APIs | Not started | Not started | Templates and patient-specific plans. |
| Daily exercise generation | Not started | Not started | Based on active plan and local Thai date. |
| Exercise session and set recording | Not started | Not started | Save per-set results; discard unsaved cancelled sets. |
| Repetition metrics and checkpoint results | Not started | Not started | Store aggregate/result records, not per-frame pose data. |
| Doctor patient search | Not started | Not started | Name, HN, and secure ID lookup as implemented. |

## Decision Points

| Topic | Decision needed |
| --- | --- |
| Patient web vs native mobile | Current repo is Next.js web; Figma includes mobile/iPad web-like screens while report mentions Flutter research. Confirm all MVP patient UI should be implemented in Next.js. |
| Doctor registration | Report says doctor/therapist login account is prepared by developers in this phase, while some scope text mentions signup. Confirm no doctor self-register for MVP. |
| Video storage | Report mentions video in one doctor view sentence, while DBML says no video/per-frame storage. Confirm DBML wins unless video storage is explicitly added. |
| Rehabilitation modules | Report text says 5 modules generally, but MVP list and DBML currently include 2 modules and 5 exercises. Confirm MVP remains 2 modules / 5 exercises. |
| National ID handling | DBML proposes HMAC lookup plus encrypted storage. Confirm key management approach before implementing persistence. |
