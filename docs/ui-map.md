# UI Map

Figma source: `Gait_Analysis`, file key `ERysbW44MzAOxL4SKjZPkL`, page/node `360:1376`.

Figma is a reference for design direction, UX flow, information architecture, and visual identity, not a pixel-perfect specification. Route mappings preserve the intended flow; dimensions and composition may adapt for web accessibility/usability. The current implementation guideline is in `docs/more.md`.

## Selected White/Green HTML (2026-10-02)

Camera groundwork (2026-10-05): retain the original split camera/counter layout for `seated-leg-raise`, existing display-preparation/pause placement, and Stop/Continue/Save/Reset/Exit controls. Replace manual sample increment in this candidate route with MediaPipe landmarks and configurable cycle logic, gated off pending identity/clinical criteria. Unapproved Start/Save stay disabled with an explicit pending-criteria notice, not fictional assessment. Partial-save summary reads real server aggregates and has no settings entry; other exercise cameras are unchanged. Preview/model failure/cleanup and 18 mobile/iPad/desktop theme/font combinations verified with synthetic video; approved counting/paused-settings/save UI is not yet a real-camera acceptance claim. See `camera-recording.md`.

Account update (2026-10-05): existing Login/Register/Profile compositions are retained but now connect to real patient-account APIs. Login has no unauthenticated patient sample bypass. Review confirmation creates the account/profile and completion returns to Login. Patient header/sidebar/Home name and Profile use the authenticated patient's data; Logout clears the session. Four-digit initial-password submission awaits policy approval and is blocked server-side meanwhile. See `accounts-setup.md` for verification and limitations; historical UI-only descriptions below predate this milestone.

Training update (2026-10-05): `/patient`, `/patient/plan`, `/patient/exercises` and exercise guide/camera targets now use authenticated own-patient database data. Preserve existing dashboard/list/accordion composition; adapt the picker to clinician-authored template radios with read-only exercise goals/frequency/side/weekdays, because patients cannot prescribe arbitrary exercises or targets. Guide/camera links carry the owned daily assignment ID and server-check eligibility. Add loading/empty/error and pending-next-day notices without redesigning the app. No approved clinical template is seeded. Camera example counters and full progress/history pages remain unconnected, clearly labeled; camera Save is disabled for real assignments. Verified mobile/iPad/desktop in 96 viewport/theme/font/page combinations. See `training-plans.md`.

Patient/Register exercise pickers retain Modules 3-5 as disabled next-phase rows at the user's request. Modules 1-2 remain the only selectable MVP modules.

The latest user-selected visual reference is archived unchanged at `docs/ui/patient/white-green-reference.html`. This section supersedes the older Patient color/navigation adaptations below. Route mapping and DBML constraints remain unchanged.

| Page group | Applied reference and intentional adaptation |
| --- | --- |
| Login | Centered heading/logo and white framed form, green primary/secondary controls, green-tinted background, IBM Plex Sans Thai. Retain MoRe, empty credential fields, existing validation and sample entry rather than the HTML's prefilled demo login. |
| Register account/personal/medical | Shared white form surface, green three-phase progress, input/focus/notice treatments. Keep actual last-four-digit display, existing password validation and fields. Tablet keeps the readable side-progress composition rather than stretching a mobile form. |
| Register Step 1 identity mobile/iPad | Keep the supplied three progress bars, current-step badge, identity form composition, and helper text. Use shared theme tokens so the display panel can select light or dark. Desktop/web keeps the existing two-column composition. All registration routes inherit the same top-right overflow entry. |
| Home | Patient banner, ring/KPIs, next exercise with guide command, seven-day history and recent saved results. Wider widths place next exercise/history alongside progress. Replace fictional streak/angle cards with derived remaining sets and actual saved-set summaries. |
| Patient navigation | Match bottom navigation below 1024px and sidebar from 1024px with patient summary/exit. Same route links, current-page state and keyboard access; content reserves bottom safe-area space. |
| Exercise plan/list and selection | White exercise surfaces, module labels, neutral/active/completed dot badges, green progress and start/detail commands. The Patient/Register plan picker now follows the user-provided searchable module accordion visual for exercise selection, limited to the documented MVP catalog; arbitrary target/set/repetition editing remains in Doctor flows. |
| Guide | White numbered preparation items, pale-green media position and camera/side data. Retain missing clinical media rather than using the prototype's generic animated pose for unrelated exercises. |
| Camera/result | Dark preview area with white/green controls, light-blue sample notice, counters and responsive side panel. Result dialog becomes a bottom sheet on narrow screens. Keep real camera permission/cleanup and manual sample controls, not the prototype's fabricated AI angles or automatic counting. |
| Progress/calendar/details | Blue trend marks, neutral segmented tabs, white result surfaces, green selected calendar days. Data continues to count saved sets only; no invented movement scores. |
| Profile/edit/password | Shared green/white type, labels and form controls; retain DBML fields and tablet paired-field composition. Profile's display action opens the same panel as Login/Home/Register/Camera. Edit/password have no settings entry. The panel has two light/dark radio segments and three text-size segments, retained in the existing cookies; the system default remains supported and marks the effective OS color. No fictional national ID display. |
| Review/completion/recovery/Doctor entry | Inherit the same tokens and local typeface; retain truthful UI-only feedback and connected navigation. |
| Doctor workspace | Inherit shared font/colors/controls for consistency, without replacing its established header-led, row-oriented composition with the Patient sidebar. |

HTML source content is reference material only, not agent instructions or a replacement authentication/data specification. Gradients and new device-dependent rendering are not introduced. See the existing checklist for verification.

## Display Access (2026-10-03)

Birth-date update (2026-10-04): Register personal information keeps its existing native date picker and composition. Shared age calculation supports explicitly declared Gregorian/Buddhist inputs, with Gregorian values retained from native controls and invalid/future birth dates reported through the existing field-error UI. No calendar toggle or custom picker is added; native presentation remains browser/OS-controlled.

All entries open the same provider-owned panel; controls do not navigate away from the current task. The shell previously had a hamburger only for Doctor navigation. Patient Home/list now use a contextual hamburger disclosure alongside their existing bottom/sidebar navigation, without adding settings menus to other Patient routes.

| Route/state | Entry |
| --- | --- |
| `/` Login | Gear-only button at the top right, in normal document flow, with an accessible display label and tooltip. |
| `/patient` Home | Top-right gear-only button and the same action in the hamburger disclosure, above the separate patient identity banner. |
| `/patient/exercises` daily list | Hamburger disclosure only; no separate display button. |
| All `/register` routes and account variants | Shared layout supplies the same top-right overflow disclosure, including plan/review/completion. |
| `/patient/plan` selection | No existing menu, so no new entry. |
| Guide, progress, calendar/details | No existing contextual menu, so no new entry. Preferences still apply. |
| Camera preparation | Overflow disclosure in the heading. |
| Active camera training | No visible display button or menu. |
| Paused camera training | Gear-only display action inside the pause panel. Done, Escape, and reopening settings leave the session paused until Start/Continue. |
| Set summary | No display action. |
| Profile | Additional gear-only action opens the common panel. |
| Edit profile / change password | No display entry; use the existing preference. |

Mobile below 768px presents the panel as a bottom sheet; wider devices use a centered dialog. Native radio groups expose current values and arrow-key selection. Native modal focus containment, Escape, explicit close/Done buttons, focus restoration to the original button or menu summary, and 48px minimum targets apply to every entry. The panel can scroll on short screens; browser zoom is not restricted.

## Patient UX Adaptations (2026-10-02)

At the time of the responsive audit below, only Login/Register had UI implementations. The later combined implementation is recorded separately below; these notes preserve the reason for each adaptation.

| Page/state | Adaptation from the reference | UX reason |
| --- | --- | --- |
| `/` Login | Retained its focused one-column form; shared primary teal is darker and the password icon no longer has a nested circular border. Link focus is visible. | A short login task does not benefit from a second column; contrast and clearer controls improve accessibility without recomposing the page. |
| `/register` identity | Added consistent account/personal/medical progress and a separate form heading. Mobile progress is horizontal; tablet progress and identity occupy a left column beside the form. | Shows where registration starts and uses tablet width meaningfully instead of enlarging a mobile form. |
| `/register` initial password | Uses the same composition, grouped read-only values, a restrained contextual note, and closer action spacing. Final four digits remain visible, with leading zeros preserved. | Separates credentials from the explanation and keeps the two password choices together. |
| `/register` custom password | Uses shared progress, a task heading, 20px field spacing, and consistent focus/error/primary states. | Makes a longer form easier to scan without adding fields or changing the password flow. |
| `/register/personal` | Shared overall three-step progress replaces the separate two-step profile badge. On wider tablet/desktop, birth date and derived age share a row; the action follows the form. Back text names its account-page destination. | Gives a consistent position in registration, visually associates related values, avoids detached bottom actions, and makes navigation truthful. |
| `/register/medical` | Shared three-step progress, a clear health heading, restrained note styling, and submit directly after content; tablet uses the side column. | Separates task, fields, explanation, and final action while retaining field order and the existing UI-only confirmation. |

Register uses neutral surfaces, brand teal, the existing MoRe logo/typeface, and unframed layout with restrained dividers. No gradients, device detection, or new persistence were introduced. See `docs/checklist.md` for verification and review status.

Figma access note: `get_design_context` returned `INVALID_ARGUMENT`, so high-fidelity design context/code was not available. Screenshot export and Figma Plugin API inspection worked, and the mappings below use frame names and visual grouping from the Figma canvas.

## Local Export Inventory (2026-10-01)

The supplied ZIP exports are extracted without renaming their PNG files:

- `docs/Gait_Analysis_patient.zip` -> `docs/ui/patient/`: 20 mobile reference images.
- `docs/Gait_Analysis_docNtherapist.zip` -> `docs/ui/doctor/`: 4 desktop Doctor/Therapist reference images.
- All 24 images were visually inspected. These are design references, not implemented pages or separate application assets.
- Patient Login is 780x1688 (a 2x export of 390x844). Other Patient images are 390 pixels wide, with heights 844, 920, 954, or 961. Doctor images are 2880 pixels wide, with heights 2000, 2964, or 3732.
- No iPad exports, standalone logo/icon assets, Doctor login, Patient profile, or forgot-password screen are included. Existing iPad mappings below remain historical Figma references, not locally verified designs.
- Figma MCP subsequently reported the Starter-plan tool-call limit. Local PNGs now provide visual references; live design context is still unavailable.

### Patient Export Files

Paths in this table are relative to `docs/ui/patient/`. Routes describe intended grouping; `/` now has a UI-only implementation awaiting review. Ambiguous flow contexts remain decision points.

| PNG file | Observed screen/state | Target route / grouping |
| --- | --- | --- |
| `01 — Login.png` | National ID and password login; show password, recovery, registration and medical-personnel entry | `/` |
| `02 — Register Step 1-1.png` | Registration starts with national ID entry | `/register` |
| `02 — Register Step 1-2.png` | Initial password display; use initial password or change it | `/register` variant |
| `02 — Register Step 1-3.1.png` | National ID, password, confirm password and username | `/register` variant |
| `03 — Register Step 2.png` | Name, birth date, derived age and sex | `/register/personal` |
| `04 — Register Step 3.png` | Other conditions, stroke type and diagnosed date | `/register/medical` |
| `04 — Register Step 3-1.png` | Exercise selection, collapsed module list and search | `/register/plan` candidate; flow context unconfirmed |
| `04 — Register Step 4.png` | Exercise selection with expanded modules and checkboxes | `/register/plan` candidate |
| `04 — Register Step 5.png` | Expanded exercise details, tutorial image, sets and repetitions | `/register/plan` detail state; not registration review |
| `04 — Register Step 6.png` | Edit selected rehabilitation exercises; returns to home | Patient plan editing; route to be decided, not `/register/done` |
| `04 — Home Dashboard.png` | Daily progress and exercise summary | `/patient` |
| `04 — Home Dashboard-1.png` | Detailed dashboard with module groups and streak indicator | `/patient` variant |
| `04 — Home Dashboard-2.png` | Exercise progress graph with period selector | `/patient/progress/[exerciseId]` |
| `04 — Home Dashboard-3.png` | Exercise progress detail with saved-set counts | `/patient/progress/[exerciseId]/detail` |
| `04 — Home Dashboard-4.png` | Empty dashboard before assessment/plan selection | `/patient` empty state |
| `05 — Exercise-Page.png` | Tutorial video placeholder and numbered exercise steps | `/patient/exercises/[exerciseId]/guide` |
| `05 — Exercise-Page-1.png` | Daily exercise list, sets/repetitions and start/detail actions | `/patient/exercises` |
| `07 — AI Camera Assessment.png` | Camera exercise, pose angles, repetition counter, stop/save controls | `/patient/exercises/[exerciseId]/camera` |
| `07 — AI Camera Assessment-1.png` | Result overlay: 2/3 sets, 3/5 repetitions; continue/progress/home actions | Result modal within camera flow; candidate `/patient/exercises/[exerciseId]/result` |
| `07 — AI Camera Assessment-2.png` | Result overlay: 3/3 sets, 10/10 repetitions; progress/home actions | Completed result modal within camera flow |

### Doctor / Therapist Export Files

Paths in this table are relative to `docs/ui/doctor/`. All four are desktop references for the clinician flow, even when the filename starts with `Patient`.

| PNG file | Observed screen | Target route |
| --- | --- | --- |
| `Doctor Dashboard — Patient Overview.png` | Searchable patient table and pagination | `/doctor` |
| `Patient — Personal Information.png` | Patient details and assessment summary | `/doctor/patients/[patientId]` |
| `Patient — Assessment History.png` | Date-filtered assessment history, exercise summaries and session entries | `/doctor/patients/[patientId]/assessments` |
| `Patient — Session Details.png` | Exercise groups, correct repetitions, angles, times and per-set tables | `/doctor/patients/[patientId]/sessions/[sessionId]` |

### Export Gaps and Decisions

- Frame names do not reliably identify screen purpose. The observed local inventory takes precedence over the earlier mobile name-based guesses.
- Registration review and registration completion have no matching mobile PNGs in these archives. Keep those routes as planned historical references, not confirmed local screens.
- Confirm whether exercise selection belongs to registration or an after-registration patient plan flow before implementing it; confirm the route for editing selected exercises.
- The registration variant includes a patient username and a password based on the national ID's final four digits. Check these against DBML and decide the intended account/password behavior before implementing registration. This inventory does not approve either behavior.
- Username decision resolved on 2026-10-04: omit the separate username field from the implemented custom-password variant. Use the full name from the personal-information step as the primary patient display name. The inventory above still describes the supplied PNG, not the current form fields.
- A module-selection image displays Modules 1-5 while the documented MVP is 2 modules / 5 exercises. The dashboard also contains a streak indicator. Resolve data/scope mismatches against DBML before implementing them.
- Mobile graph and detail views are exported, but calendar views and an independent progress overview are not. Camera completion states are overlays, not evidence of standalone result pages.

## Patient Mobile

Updated using the observed local exports above. Patient Login and Register account, personal, and medical UI are ready for review; all API/DB work remains `Not started`.

| Figma frame | Target route | Purpose | UI status | API/DB status |
| --- | --- | --- | --- | --- |
| `01 — Login` | `/` | Patient login with local format validation and mock notices | Ready for review (รอตรวจ) | Not started |
| `02 — Register Step 1-1` | `/register` | Register start / account information | Ready for review (รอตรวจ) | Not started |
| `02 — Register Step 1-2` | `/register` | Register variant / validation state | Ready for review (รอตรวจ) | Not started |
| `02 — Register Step 1-3.1` | `/register` | Register variant / additional patient data | Ready for review (รอตรวจ) | Not started |
| `03 — Register Step 2` | `/register/personal` | Personal information | Ready for review (รอตรวจ) | Not started |
| `04 — Register Step 3` | `/register/medical` | Medical information | Ready for review (รอตรวจ) | Not started |
| `04 — Register Step 4` | `/register/plan` | Rehabilitation plan selection/setup | Ready for review (รอตรวจ) | Not started |
| `04 — Register Step 3-1` | `/register/plan` (candidate) | Collapsed module selection; flow context unconfirmed | Ready for review (รอตรวจ) | Not started |
| `04 — Register Step 5` | `/register/plan` (candidate) | Exercise details and sets/repetitions | Ready for review (รอตรวจ) | Not started |
| `04 — Register Step 6` | `/patient/plan` | Select a clinician template; target editing belongs to Doctor UI | Ready for review (รอตรวจ) | Not started |
| `04 — Home Dashboard` | `/patient` | Patient home/dashboard | Ready for review (รอตรวจ) | Not started |
| `04 — Home Dashboard-1`, `04 — Home Dashboard-4` | `/patient` | Detailed and empty dashboard variants | Ready for review (รอตรวจ) | Not started |
| `04 — Home Dashboard-2` | `/patient/progress/[exerciseId]` | Exercise progress graph | Ready for review (รอตรวจ) | Not started |
| `04 — Home Dashboard-3` | `/patient/progress/[exerciseId]/detail` | Exercise progress set detail | Ready for review (รอตรวจ) | Not started |
| `05 — Exercise-Page` | `/patient/exercises/[exerciseId]/guide` | Video placeholder and exercise instructions | Ready for review (รอตรวจ) | Not started |
| `05 — Exercise-Page-1` | `/patient/exercises` | Daily exercise list | Ready for review (รอตรวจ) | Not started |
| `07 — AI Camera Assessment` | `/patient/exercises/[exerciseId]/camera` | Camera exercise and pose assessment | Ready for review (รอตรวจ) | Not started |
| `07 — AI Camera Assessment-1`, `07 — AI Camera Assessment-2` | Result modal under camera flow | Incomplete/complete result states | Ready for review (รอตรวจ) | Not started |
| `10 — Profile & Settings` | `/patient/profile` | Profile and settings | Ready for review (รอตรวจ) | Not started |
| `Modal` | Modal under patient flows | Shared modal states | Ready for review (รอตรวจ) | Not started |

## Patient iPad

Historical Figma mapping only: none of the following iPad frames is included in the supplied ZIP exports.

| Figma frame | Target route | Purpose | UI status | API/DB status |
| --- | --- | --- | --- | --- |
| `00-Ipad-login` | `/` | Responsive adaptation of mobile export; original iPad PNG unavailable | Ready for review (รอตรวจ) | Not started |
| `01-Ipad-Register` | `/register` | Responsive adaptation of mobile register step 1 variants; original iPad PNG unavailable | Ready for review (รอตรวจ) | Not started |
| `02-Ipad-Register 2` | `/register/personal` | Responsive adaptation of mobile personal information; original iPad PNG unavailable | Ready for review (รอตรวจ) | Not started |
| `03-Ipad-Register 3` | `/register/medical` | Responsive adaptation of mobile medical information; original iPad PNG unavailable | Ready for review (รอตรวจ) | Not started |
| `03-Ipad-Register 4` | `/register/plan` | iPad plan/module selection | Ready for review (รอตรวจ) | Not started |
| `03-Ipad-Register 5` | `/register/plan` | iPad expanded plan/module selection | Ready for review (รอตรวจ) | Not started |
| `03-Ipad-Register 6` | `/register/review` | iPad register review | Ready for review (รอตรวจ) | Not started |
| `03-Ipad-Register 7` | `/register/done` | iPad register completion variant | Ready for review (รอตรวจ) | Not started |
| `03-Ipad-Register 8` | `/register/done` | iPad register completion variant | Ready for review (รอตรวจ) | Not started |
| `04-Ipad-Home Dashboard` | `/patient` | iPad patient home/dashboard | Ready for review (รอตรวจ) | Not started |
| `05-Ipad-Exercise` | `/patient/exercises` | iPad exercise list | Ready for review (รอตรวจ) | Not started |
| `06-Ipad-Exercise_guide` | `/patient/exercises/[exerciseId]/guide` | iPad exercise guide | Ready for review (รอตรวจ) | Not started |
| `07-Ipad-Exercise_guide2` | `/patient/exercises/[exerciseId]/guide` | iPad exercise guide continuation | Ready for review (รอตรวจ) | Not started |
| `08-Ipad-Exercise_page` | `/patient/exercises/[exerciseId]/camera` | iPad active exercise camera page | Ready for review (รอตรวจ) | Not started |
| `09-Ipad-Exercise_page_finish_notall` | `/patient/exercises/[exerciseId]/result` | iPad incomplete result state | Ready for review (รอตรวจ) | Not started |
| `10-Ipad-Exercise_page_finish_all` | `/patient/exercises/[exerciseId]/result` | iPad complete result state | Ready for review (รอตรวจ) | Not started |
| `11-Ipad-Progres-page` | `/patient/progress` | iPad progress overview | Ready for review (รอตรวจ) | Not started |
| `12-Ipad-Progress-Calendar` | `/patient/progress/calendar` | iPad progress calendar | Ready for review (รอตรวจ) | Not started |
| `13-Ipad-Progress-Calendar-info` | `/patient/progress/calendar/[date]` | iPad progress day detail | Ready for review (รอตรวจ) | Not started |
| `14-Ipad-Progress-graph` | `/patient/progress/[exerciseId]` | iPad progress graph | Ready for review (รอตรวจ) | Not started |
| `15-Ipad-Progress-detail` | `/patient/progress/[exerciseId]/detail` | iPad progress detail | Ready for review (รอตรวจ) | Not started |
| `16-Patient-info` | `/patient/profile` | iPad patient information | Ready for review (รอตรวจ) | Not started |
| `17-Edit-Patient-info` | `/patient/profile/edit` | iPad edit patient information | Ready for review (รอตรวจ) | Not started |
| `18-Change-Password` | `/patient/change-password` | iPad change password | Ready for review (รอตรวจ) | Not started |
| `19-Forgot-Password` | `/forgot-password` | iPad forgot password | Ready for review (รอตรวจ) | Not started |

## Doctor Desktop

| Figma frame | Target route | Purpose | UI status | API/DB status |
| --- | --- | --- | --- | --- |
| `Doctor Dashboard — Patient Overview` | `/doctor` | Patient overview dashboard and patient list | Ready for review (รอตรวจ) | Not started |
| `Patient — Personal Information` | `/doctor/patients/[patientId]` | Patient profile and current plan | Ready for review (รอตรวจ) | Not started |
| `Patient — Assessment History` | `/doctor/patients/[patientId]/assessments` | Assessment history and progress review | Ready for review (รอตรวจ) | Not started |
| `Patient — Session Details` | `/doctor/patients/[patientId]/sessions/[sessionId]` | Exercise session detail and metrics | Ready for review (รอตรวจ) | Not started |

## Route Conventions

- Patient Login renders directly at `/`, the app's main page, with no redirect. The former `/login` route has been removed. The Next.js starter page and its default image assets have been removed; the tab icon uses the MoRe mark.

- All mapped routes must be responsive across mobile, tablet (including iPad), and desktop; device headings identify the primary Figma reference, not an exclusive device requirement.
- Patient mobile and iPad layouts should share routes where practical, prioritize those devices, and adapt to other tablets and desktop.
- Doctor routes are desktop first and must also adapt to tablet and mobile.
- Where Figma has no reference for a device size, adapt the existing design consistently and check that content and controls remain usable.
- Use route groups later if needed, for example `src/app/(patient)` and `src/app/(doctor)`, without changing public URLs.
- Start implementation with `/` using the Patient Login design.

## Connected UI Route Inventory (2026-10-02)

### Connected Demo Override (2026-10-05)

`/doctor/login` now authenticates actual staff roles; Doctor routes use PostgreSQL rather than mock IDs/profile/results/plan state. Patient progress/calendar and `/patient/sessions/[sessionId]` read owned saved sets/repetitions/metrics/checkpoints. Doctor session details read the same stored results, with MAX/AVG grouped by metric and side. Existing white/green tokens, header-led Doctor workspace, patient plan accordion and camera controls remain the baseline. Camera routes omit bottom/sidebar navigation to avoid covering the preview/commands; preparation retains its existing overflow action, active training has no display entry and the pause panel keeps the shared settings dialog.

Demo source selection and synthetic-cycle action exist only for DB-verified Demo patients and are explicitly not AI/clinical results. Templates/editors retain selected-side/positive targets/frequency/daily-or-weekly weekday inputs, with immutable versioned persistence and in-flow status/retry. Three viewport widths/two themes/three font sizes are checked in integrated Demo testing; physical iPad and human camera review remain pending. See `demo-ready.md` for the current inventory and readiness, overriding historical UI-only descriptions below.

### User-Baseline Correction

This correction supersedes the navigation/composition descriptions in the earlier inventory below. User-created code and supplied exports are primary; assistant-created presentation is not a new specification. Existing Login/Register is retained, including visible last-four-digit initial password and the personal-to-medical flow. No fields, schema, or mandatory registration step are added.

| Page group | Correction and reason |
| --- | --- |
| Patient Home | Restore the supplied teal welcome band, progress ring, daily saved-set summary, and completed/in-progress/not-started exercise states. All values derive from saved sets and daily targets, rather than invented clinical scores. iPad places greeting and progress side-by-side; mobile stacks them. |
| Patient navigation (all workspace pages) | Replace the assistant's fixed mobile bottom bar with the supplied hamburger-menu language. Expanded links remain in normal document flow, close after selection, and support Escape/focus return. Expose inline navigation from 768px for tablet scanning. |
| Exercises and guide | Keep the supplied exercise title, module, targets, start/detail commands, numbered preparation and media position. Remove generic decorative activity tiles; retain explicit missing-media state instead of inventing clinical assets. |
| Plan selection and registration-plan alternative | Use searchable, expandable plan rows and native radio selection instead of generic template cards. Preserve the supplied expandable-list language while respecting DBML clinician-template permissions. Registration placement remains unresolved and is not forced. |
| Progress, graph, details, calendar | Restore the supplied graph/detail view tabs; retain saved-only totals, time controls, and detail links under the corrected shared shell. Calendar stays seven columns; table overflow is local, not page overflow. Unsupported angle/quality/streak fields remain omitted. |
| Profile, edit, password | Retain the same data and commands; use paired fields on tablet instead of stretching a mobile form. Password remains UI validation only. |
| Camera and result | Retain camera-first layout, counters, pause/save/reset, and in-flow result dialog. Correct shared navigation, surfaces, and dialog action spacing without claiming sample controls are AI. |
| Doctor overview, patient details, history, session | Remove the assistant-added permanent desktop sidebar; restore the supplied header-led, wide row-oriented workspace and contextual patient tabs. Stack rows on mobile without removing review commands. |
| Doctor plan/template editors | Keep existing editable catalog, targets and schedule; use the same separators and expandable section language. No data behavior or ownership changes. |
| Login, Register account/personal/medical, review/done, recovery, Doctor entry | Preserve existing account/personal/medical form behavior. Supporting screens continue the baseline's typography and actions; no new authentication or account creation is implied. |

Verification and review status are recorded in the existing checklist, not a duplicate design document.

The user requested implementation across the system for one review. The following supersedes historical Not started labels above for implemented UI; API/DB is still Not started. Routes use validated App Router catch-all segments for the Patient/Doctor workspaces and explicit registration/auth pages. Unknown exercise IDs, patient IDs, invalid dates, and unknown workspace paths return 404.

| Routes | Current UI and adaptation rationale |
| --- | --- |
| `/`, `/doctor/login`, `/forgot-password` | Existing Patient login retained; sample Patient/Doctor entry links connect to workspaces. Recovery provides a contact/status state because no recovery backend exists. Doctor entry is sample-only, not a real login. |
| `/register/personal`, `/register/medical`, `/register/review`, `/register/done` | In-memory drafts survive client navigation for review/edit; completion opens sample Home. No account is created. Existing mobile/iPad registration composition remains. |
| `/patient/plan`, `/register/plan` | Select an available clinician template from the 2-module/5-exercise scope. Registration placement is pending; the registration alternative is directly reviewable but not mandatory. Patient target editing is not added from Figma because DBML assigns template management to clinicians. |
| `/patient` | Saved-only progress, daily target summary, exercise entries, and no-plan state. Mobile uses bottom navigation; iPad/desktop uses top navigation and a two-column exercise list for scanning. No unsupported streak/score. |
| `/patient/exercises` | Daily exercise list with saved-set progress and guide/result links. Touch-friendly repeated items rather than a scaled mobile frame. |
| `/patient/exercises/[exerciseId]/guide` | General preparation and camera view/side information. Missing tutorial-media state is explicit; iPad uses side-by-side preparation and media area. |
| `/patient/exercises/[exerciseId]/camera` | Actual permission-based camera preview with stream cleanup, plus explicit sample repetition controls, pause/resume/reset, partial save and saved-set cap. No AI inference or raw video persistence. Wider screens place controls beside the camera. |
| `/patient/exercises/[exerciseId]/result` | Result summary entry; saving also opens an in-flow result dialog, retaining the mobile reference's overlay behavior. |
| `/patient/progress`, `/patient/progress/[exerciseId]`, `/patient/progress/[exerciseId]/detail` | Saved-set totals, a labeled set-count trend, period controls and detailed results. No invented angle/quality data; patients remain in their own progress routes. |
| `/patient/progress/calendar`, `/patient/progress/calendar/[date]` | Month calendar links to saved-set day detail, including empty days. Calendar remains a seven-column grid at all widths. |
| `/patient/profile`, `/patient/profile/edit`, `/patient/change-password` | DBML-aligned profile editing in memory; derived age, read-only HN, password format validation without claiming a real password update. |
| `/doctor`, `/doctor/patients/[patientId]` | Search by name/HN, page size/pagination, patient personal/medical details, plan summary, editable medical notes. Desktop sidebar and denser rows; stacked mobile rows preserve actions. |
| `/doctor/patients/[patientId]/plan`, `/doctor/templates` | Search/catalog groups, exercise selection, positive target values, supported side choice, daily/weekly schedule/day validation, template naming and available-version updates. Existing daily targets are kept separate. |
| `/doctor/patients/[patientId]/assessments`, `/doctor/patients/[patientId]/sessions/[sessionId]` | Saved-session history with date filtering and set details. These summarize DBML exercise sessions, not an unsupported general assessment table. No training-video or fabricated metric panel. |

Shared language: existing MoRe logo/font/teal, neutral surfaces, restrained dividers, real empty/error/success states, visible focus, and CSS breakpoints. See checklist for actual verification, limits, and combined review entry URLs.

### Back Navigation

Registration account/personal/medical steps, recovery/Doctor entry, and Patient/Doctor detail pages retain their existing back destinations. Per the latest user request, back links are restored to the top-left of content in normal document flow; floating positioning and its extra bottom padding are removed. Registration retains its separate top back row on tablet. Dialogs, primary completion actions, and Patient bottom navigation are unchanged.
