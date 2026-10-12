# Doctor portal merge — 2026-10-12

Merged origin/feat/doctor-portal (7de7f62) with patient main (3892bb2), following the user-selected resolution of five conflicts.

- .gitignore retains certificates and /TEST_ACCOUNTS.md.
- Root layout remains main, including server audio preferences; no body-wide hydration suppression added.
- system.css retains main CSS unchanged; added doctor page/drawer/results rules are scoped to .doctor-app.
- AppShell dispatches to the unchanged patient shell or isolated doctor-shell.tsx. Main header/MoreLogo remain; doctor desktop navigation and mobile drawer retained. Drawer receives focus and handles Escape.
- ResultsHistory retains Routine/filter/mock information; teammate total/correct summaries and result badges are added without modifying counting or persistence.
- DoctorPatientList reads real patients directly. Prototype fixtures are retained but not used in the live list: their repeated real IDs and unrelated synthetic names would open a different identity than the displayed name.
- The page-size preference loads after hydration in a cancellable animation frame. tsconfig excludes output (contains a second Git worktree, not application sources).

Verification: TypeScript and targeted shell/results/list lint pass; production build passes; Demo policy 13 checks; patient-doctor PostgreSQL/API integration 28 checks (temporary fixtures removed); Chromium browser 53 checks at 390×844, 820×1180, 1180×820 and 1440×1000, including XL text/light and dark themes, patient navbar scrolling, doctor drawer/Escape/details, direct load/refresh and zero hydration errors. Physical iPad/Safari toolbar behavior and human-camera testing remain unverified. Pre-existing unused-variable warnings remain in doctor-patient-session-detail.tsx; PostgreSQL driver emits an existing concurrent-query deprecation warning in the integration test.

No schema, clinical criteria, pose/audio engine or saved history changes.
