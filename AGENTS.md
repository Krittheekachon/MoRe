<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# MoRe Project Rules

MoRe is a stroke rehabilitation platform for patients and doctors/therapists. The app is built with Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL, Prisma, and MediaPipe Pose Landmarker.

## Required Reading

- Read this file first before making project changes.
- Read the relevant files in `docs/` before starting the requested work:
  - `docs/more.md` for project scope and stack.
  - `docs/ui-map.md` for Figma frame to route mapping.
  - `docs/checklist.md` for current implementation status.
  - `docs/MoRe_Database_scope_1_3 (1).dbml` before changing API, Prisma, or database work.
  - `docs/Term1 Final Project Report (1).docx` when the feature scope is unclear.
- Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` for this installed Next.js version.
- At the start of every task, re-read the relevant project `.md` files to check the latest rules, scope, decisions, and progress before acting.
- Review the available skills for the task. If a skill applies, read its `SKILL.md` and relevant referenced instructions before using its tools or implementing the work. State which skill is being used and why; if none applies, proceed using the project documentation.

## Database Authority

- Use `docs/MoRe_Database_scope_1_3 (1).dbml` as the source of truth for application data. Read the relevant tables, fields, relationships, constraints, and notes before implementing data-related UI, forms, mock data, validation, API contracts, Prisma models, queries, or persistence.
- Keep data behavior aligned with the existing database design. Mock data and UI fields must reflect that design; derived display values must be based on existing data and must not silently introduce new stored fields.
- If a requirement needs a new table, field, relationship, enum value, constraint, or other database design change, explain the proposed change, reason, and affected areas, then ask the user and wait for explicit approval before implementing it.
- Do not add unsupported data requirements solely because they appear in Figma or another document. Collect the mismatch as a decision point first.
- After an approved database design change, update the DBML and relevant project `.md` files together with the implementation and checklist.

## Workflow

- Build UI one page at a time.
- Start with the Patient Login page.
- After each page is implemented, run the relevant checks, start or reuse the dev server, and report the URL for review.
- Stop after reporting the URL and wait for the user to confirm that the page passes before moving to the next page.
- Track UI completion separately from API/DB completion.
- Update `docs/checklist.md` to reflect real progress only after work is actually done.
- If documents conflict, collect the decision points and ask for a decision before building that part.

## Implementation Notes

- All Patient and Doctor/Therapist screens must be responsive across mobile, tablet (including iPad), and desktop devices.
- Patient screens prioritize mobile and iPad layouts; adapt them for other tablet sizes and desktop as well.
- Doctor/Therapist screens prioritize desktop layouts; adapt them for tablet and mobile as well.
- Before reporting a page as ready for review, check mobile, tablet/iPad, and desktop layouts for readable content, usable controls, and unintended overflow or overlap.
- Treat MediaPipe camera processing as client-side UI/runtime behavior unless an explicit backend requirement is added.
- Do not store raw national ID values in logs. Use secure lookup/encryption patterns from the DBML when implementing persistence.
- Current DBML scope stores per-session, per-set, per-repetition, and metric results; it does not persist training video or per-frame pose data.
