# UI Map

Figma source: `Gait_Analysis`, file key `ERysbW44MzAOxL4SKjZPkL`, page/node `360:1376`.

Figma access note: `get_design_context` returned `INVALID_ARGUMENT`, so high-fidelity design context/code was not available. Screenshot export and Figma Plugin API inspection worked, and the mappings below use frame names and visual grouping from the Figma canvas.

## Patient Mobile

| Figma frame | Target route | Purpose | UI status | API/DB status |
| --- | --- | --- | --- | --- |
| `01 — Login` | `/login` | Patient login | Not started | Not started |
| `02 — Register Step 1-1` | `/register` | Register start / account information | Not started | Not started |
| `02 — Register Step 1-2` | `/register` | Register variant / validation state | Not started | Not started |
| `02 — Register Step 1-3.1` | `/register` | Register variant / additional patient data | Not started | Not started |
| `03 — Register Step 2` | `/register/personal` | Personal information | Not started | Not started |
| `04 — Register Step 3` | `/register/medical` | Medical information | Not started | Not started |
| `04 — Register Step 4` | `/register/plan` | Rehabilitation plan selection/setup | Not started | Not started |
| `04 — Register Step 5` | `/register/review` | Registration review/confirmation | Not started | Not started |
| `04 — Register Step 6` | `/register/done` | Registration complete | Not started | Not started |
| `04 — Home Dashboard` | `/patient` | Patient home/dashboard | Not started | Not started |
| `05 — Exercise-Page` | `/patient/exercises` | Exercise list/detail entry | Not started | Not started |
| `07 — AI Camera Assessment` | `/patient/exercises/[exerciseId]/camera` | Camera exercise and pose assessment | Not started | Not started |
| `10 — Profile & Settings` | `/patient/profile` | Profile and settings | Not started | Not started |
| `Modal` | Modal under patient flows | Shared modal states | Not started | Not started |

## Patient iPad

| Figma frame | Target route | Purpose | UI status | API/DB status |
| --- | --- | --- | --- | --- |
| `00-Ipad-login` | `/login` | iPad login layout | Not started | Not started |
| `01-Ipad-Register` | `/register` | iPad register step 1 variants | Not started | Not started |
| `02-Ipad-Register 2` | `/register/personal` | iPad personal information | Not started | Not started |
| `03-Ipad-Register 3` | `/register/medical` | iPad medical information | Not started | Not started |
| `03-Ipad-Register 4` | `/register/plan` | iPad plan/module selection | Not started | Not started |
| `03-Ipad-Register 5` | `/register/plan` | iPad expanded plan/module selection | Not started | Not started |
| `03-Ipad-Register 6` | `/register/review` | iPad register review | Not started | Not started |
| `03-Ipad-Register 7` | `/register/done` | iPad register completion variant | Not started | Not started |
| `03-Ipad-Register 8` | `/register/done` | iPad register completion variant | Not started | Not started |
| `04-Ipad-Home Dashboard` | `/patient` | iPad patient home/dashboard | Not started | Not started |
| `05-Ipad-Exercise` | `/patient/exercises` | iPad exercise list | Not started | Not started |
| `06-Ipad-Exercise_guide` | `/patient/exercises/[exerciseId]/guide` | iPad exercise guide | Not started | Not started |
| `07-Ipad-Exercise_guide2` | `/patient/exercises/[exerciseId]/guide` | iPad exercise guide continuation | Not started | Not started |
| `08-Ipad-Exercise_page` | `/patient/exercises/[exerciseId]/camera` | iPad active exercise camera page | Not started | Not started |
| `09-Ipad-Exercise_page_finish_notall` | `/patient/exercises/[exerciseId]/result` | iPad incomplete result state | Not started | Not started |
| `10-Ipad-Exercise_page_finish_all` | `/patient/exercises/[exerciseId]/result` | iPad complete result state | Not started | Not started |
| `11-Ipad-Progres-page` | `/patient/progress` | iPad progress overview | Not started | Not started |
| `12-Ipad-Progress-Calendar` | `/patient/progress/calendar` | iPad progress calendar | Not started | Not started |
| `13-Ipad-Progress-Calendar-info` | `/patient/progress/calendar/[date]` | iPad progress day detail | Not started | Not started |
| `14-Ipad-Progress-graph` | `/patient/progress/[exerciseId]` | iPad progress graph | Not started | Not started |
| `15-Ipad-Progress-detail` | `/patient/progress/[exerciseId]/detail` | iPad progress detail | Not started | Not started |
| `16-Patient-info` | `/patient/profile` | iPad patient information | Not started | Not started |
| `17-Edit-Patient-info` | `/patient/profile/edit` | iPad edit patient information | Not started | Not started |
| `18-Change-Password` | `/patient/change-password` | iPad change password | Not started | Not started |
| `19-Forgot-Password` | `/forgot-password` | iPad forgot password | Not started | Not started |

## Doctor Desktop

| Figma frame | Target route | Purpose | UI status | API/DB status |
| --- | --- | --- | --- | --- |
| `Doctor Dashboard — Patient Overview` | `/doctor` | Patient overview dashboard and patient list | Not started | Not started |
| `Patient — Personal Information` | `/doctor/patients/[patientId]` | Patient profile and current plan | Not started | Not started |
| `Patient — Assessment History` | `/doctor/patients/[patientId]/assessments` | Assessment history and progress review | Not started | Not started |
| `Patient — Session Details` | `/doctor/patients/[patientId]/sessions/[sessionId]` | Exercise session detail and metrics | Not started | Not started |

## Route Conventions

- All mapped routes must be responsive across mobile, tablet (including iPad), and desktop; device headings identify the primary Figma reference, not an exclusive device requirement.
- Patient mobile and iPad layouts should share routes where practical, prioritize those devices, and adapt to other tablets and desktop.
- Doctor routes are desktop first and must also adapt to tablet and mobile.
- Where Figma has no reference for a device size, adapt the existing design consistently and check that content and controls remain usable.
- Use route groups later if needed, for example `src/app/(patient)` and `src/app/(doctor)`, without changing public URLs.
- Start implementation with `/login` using the Patient Login design.
