# Doctor Course (Rehabilitation Template) Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive, medical-grade Doctor Course Management UI at `/doctor/templates` allowing doctors to create and edit versioned rehabilitation courses (templates) across 5 modules and 11 exercises (with `seated-leg-raise` enabled and the other 10 exercises clearly disabled/pending), specifying sets, reps, frequency (daily sessions & schedule), description, and displaying the last editor audit trail.

**Architecture:** 
- The Doctor workspace at `/doctor/templates` displays existing templates as clean, professional cards with audit details (creator display name, updated date, version).
- A rich modal/editor component (`DoctorCourseEditorModal` or embedded editor in `src/components/app/doctor-templates.tsx`) allows creating or editing a template.
- Master catalog represents 5 modules and 11 exercises; `seated-leg-raise` is active and selectable, while the remaining 10 exercises are disabled with a "เร็วๆ นี้ (Coming Soon)" badge.
- When an exercise is selected, inputs for sets, reps, frequency (sessions/day), schedule (daily vs specific weekdays), side selection, and custom notes appear.
- Backend reuses and enhances `writeTemplate` and `staffTemplates` in `src/lib/doctor-service.ts` to include creator details (`User.display_name`) and support immutable versioning.
- Patient selection at `/patient/plan` consumes these templates seamlessly.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vanilla CSS (tokens in `src/app/system.css` and scoped styles), Lucide React icons, Prisma ORM 7, PostgreSQL.

**Spec:** User request and design discussion aligned in conversation on 2026-10-13; DBML source of truth `docs/MoRe_Database_scope_1_3 (1).dbml`.

## Global Constraints

- Preserve DBML constraints: `rehabilitation_templates` must use immutable versioning (creating a new version and marking the old inactive `is_active: false` when editing, preserving patient historical plans).
- Doctor UI visual baseline: Modern medical white/teal design system matching `DoctorPatientList` and `DoctorPatientSessionDetailView`.
- Do not add new database tables or columns without approval; use `created_by` relationship (`creator: { select: { display_name: true, role: true } }`) and `updated_at` to derive "last edited by".
- Exactly 11 exercises in 5 modules displayed; `seated-leg-raise` is enabled, 10 other exercises are visible but disabled.
- Responsive across desktop (primary), iPad/tablet, and mobile.

## Review Focus

- Missing or invalid template name: Prevent submission with clear field validation message.
- Submitting with zero selected exercises: Prevent submission with a warning notification.
- Editing an existing template: Ensure base template is deactivated and new template version is incremented (`base.version_number + 1`), preserving audit trail.
- Side selection rules: Enforce valid sides (`left`, `right`, `both`, `none`) according to whether the exercise supports side selection.
- Audit display formatting: Render creator display name and Thai-formatted date correctly even if template was created by legacy seed.

---

### Task 1: Update Doctor Service to Include Creator Identity in Template Queries

**Files:**
- Modify: `src/lib/doctor-service.ts:57-60`
- Test: `scratch/test-template-creator.mjs`

**Interfaces:**
- Consumes: Prisma `RehabilitationTemplate` model and `User` relation
- Produces: `staffTemplates(staff)` returning templates with `creator: { display_name: string, role: string }`

- [ ] **Step 1: Write verification test script for `staffTemplates`**
  Create `scratch/test-template-creator.mjs` that calls `staffTemplates` and asserts that returned templates include `creator.display_name`.

- [ ] **Step 2: Run test to verify current state**
  Run `node scratch/test-template-creator.mjs`.
  Expected: FAIL or shows missing `creator` field in templates.

- [ ] **Step 3: Update `staffTemplates` in `src/lib/doctor-service.ts`**
  Add `creator: { select: { display_name: true, role: true } }` to the Prisma `include` query in `staffTemplates`.

- [ ] **Step 4: Run test to verify it passes**
  Run `node scratch/test-template-creator.mjs`.
  Expected: PASS with `creator` data present.

- [ ] **Step 5: Commit**
  ```bash
  git add src/lib/doctor-service.ts
  git commit -m "feat(doctor): include template creator details for audit display"
  ```

---

### Task 2: Define Full 5-Module / 11-Exercise Master Catalog Definition

**Files:**
- Create: `src/lib/exercise-master-catalog.ts`
- Test: `scratch/test-catalog-definition.mjs`

**Interfaces:**
- Produces: `EXERCISE_MODULES_CATALOG` containing the 5 modules and 11 exercises with their codes, names, English names, default targets, and `isSelectable` flags (`seated-leg-raise: true`, others: `false`).

- [ ] **Step 1: Write test for master catalog**
  Create `scratch/test-catalog-definition.mjs` verifying:
  - Total 5 modules with correct Thai titles
  - Total 11 exercises
  - Exactly 1 exercise (`seated-leg-raise`) has `isSelectable === true`
  - 10 exercises have `isSelectable === false`

- [ ] **Step 2: Run test to verify failure**
  Run `node scratch/test-catalog-definition.mjs`.
  Expected: FAIL with module not found.

- [ ] **Step 3: Implement `src/lib/exercise-master-catalog.ts`**
  Define:
  - Module 1: การควบคุมลำตัวและการทำงานของขาเบื้องต้น (บริหารลำตัวขณะนั่ง, กระดกข้อเท้า)
  - Module 2: การควบคุมลำตัวและการเคลื่อนไหวของขา (ยกขาขณะนั่ง / Seated Leg Raise, ลุกยืนจากท่านั่ง, ยกสะโพก)
  - Module 3: การยืนและการเริ่มเดิน (ท่ายืนทรงตัว, ก้าวขาอยู่กับที่)
  - Module 4: การเดินและการทรงตัวขั้นสูง (ยืนถ่ายน้ำหนัก, ก้าวขาไปข้างหน้า)
  - Module 5: การเดินขั้นสูงและเคลื่อนไหวคล่องตัว (เดินต่อส้นเท้า, ก้าวข้ามสิ่งกีดขวาง)
  Export helper functions to retrieve exercises by module and check availability.

- [ ] **Step 4: Run test to verify pass**
  Run `node scratch/test-catalog-definition.mjs`.
  Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add src/lib/exercise-master-catalog.ts
  git commit -m "feat(catalog): add 5-module 11-exercise master catalog definition"
  ```

---

### Task 3: Build Premium Doctor Template List View & Card UI

**Files:**
- Create: `src/components/app/doctor-templates-list.tsx`
- Modify: `src/app/system.css` (add styling for template cards, badges, and audit footer)
- Test: `scratch/verify-template-list-ui.mjs`

**Interfaces:**
- Consumes: Templates data with creator, exercises, and catalog
- Produces: `DoctorTemplateListView` component displaying cards with:
  - Title & Version tag (`v1`, `v2`)
  - Description
  - Exercise pills with sets × reps and daily frequency
  - Audit trail: "แก้ไขล่าสุดโดย: [ชื่อหมอ] • [วันเวลา]"
  - "แก้ไขเป็นเวอร์ชันใหม่" and "+ สร้างแผนใหม่" action buttons

- [ ] **Step 1: Write UI verification script using Playwright**
  Create `scratch/verify-template-list-ui.mjs` to navigate to `http://localhost:3001/doctor/templates` and verify presence of template cards, badges, and creator metadata.

- [ ] **Step 2: Implement `DoctorTemplateListView` in `src/components/app/doctor-templates-list.tsx`**
  Build the template list component using modern medical card styling, badge components, and localized Thai date formatting.

- [ ] **Step 3: Add CSS styles in `src/app/system.css`**
  Add styles for `.doctor-template-card`, `.doctor-template-header`, `.doctor-template-pill`, `.doctor-template-audit`, and responsive grid layout.

- [ ] **Step 4: Wire up `DoctorTemplateListView` in `src/app/doctor/[[...segments]]/page.tsx`**
  Replace old raw `DoctorTemplateEditor` list rendering with the new `DoctorTemplateListView`.

- [ ] **Step 5: Run Playwright verification script**
  Run `node scratch/verify-template-list-ui.mjs`.
  Expected: PASS with screenshot generated.

- [ ] **Step 6: Commit**
  ```bash
  git add src/components/app/doctor-templates-list.tsx src/app/doctor/\[\[...segments\]\]/page.tsx src/app/system.css
  git commit -m "feat(doctor): implement premium template list view with audit trail"
  ```

---

### Task 4: Build Doctor Course Modal/Drawer Editor with 5 Modules, 11 Exercises & Frequency Controls

**Files:**
- Create: `src/components/app/doctor-course-editor-modal.tsx`
- Modify: `src/app/system.css` (styling for modal, accordion, exercise item config)
- Test: `scratch/verify-course-modal.mjs`

**Interfaces:**
- Consumes: `catalog`, existing `template` (if editing), `onClose`, `onSuccess`
- Produces: Interactive modal with:
  - Course Name input
  - Course Description textarea
  - 5 Module Accordions with 11 exercises:
    - `seated-leg-raise` is enabled with "AI กล้องพร้อมใช้งาน" badge
    - 10 other exercises are disabled with "เร็วๆ นี้" badge
  - Expanded config for selected exercise:
    - Target sets (default 3)
    - Reps per set (default 10)
    - Daily frequency (1, 2, or 3 sessions/day)
    - Weekly schedule (Daily vs Specific Weekdays checkbox group)
    - Side selection (ซ้าย / ขวา / ทั้งสองข้าง / ให้คนไข้เลือก)
    - Specific clinical instructions
  - Save action submitting to `/api/doctor/templates`

- [ ] **Step 1: Write Playwright test for Course Editor Modal**
  Create `scratch/verify-course-modal.mjs` testing opening the modal, verifying disabled state of 10 exercises, toggling `seated-leg-raise`, configuring frequency, and submitting.

- [ ] **Step 2: Implement `DoctorCourseEditorModal` in `src/components/app/doctor-course-editor-modal.tsx`**
  Build modal dialog with accessible dialog attributes, keyboard trap/Escape support, form state management, validation, and optimistic saving state.

- [ ] **Step 3: Add modal & form styles in `src/app/system.css`**
  Add `.doctor-modal-backdrop`, `.doctor-modal-content`, `.doctor-module-accordion`, `.doctor-exercise-row-disabled`, `.doctor-frequency-badge`.

- [ ] **Step 4: Connect Editor Modal into `DoctorTemplateListView`**
  Bind "+ สร้างแผนใหม่" to open empty modal, and "แก้ไขเป็นเวอร์ชันใหม่" to open modal prefilled with base template's data and `baseId`.

- [ ] **Step 5: Run Playwright test to verify creation & edit flows**
  Run `node scratch/verify-course-modal.mjs`.
  Expected: PASS.

- [ ] **Step 6: Commit**
  ```bash
  git add src/components/app/doctor-course-editor-modal.tsx src/components/app/doctor-templates-list.tsx src/app/system.css
  git commit -m "feat(doctor): implement full course editor modal with 5 modules and frequency controls"
  ```

---

### Task 5: End-to-End Verification across Doctor & Patient Workspaces

**Files:**
- Test: `scratch/verify-e2e-doctor-patient-course.mjs`

- [ ] **Step 1: Write comprehensive verification script**
  Test full flow:
  1. Doctor logs in and opens `/doctor/templates`
  2. Doctor creates a new course: "คอร์สฟื้นฟูกำลังขาเบื้องต้น" with 3 sets × 10 reps, 2 rounds/day
  3. Doctor edits the course to create version 2
  4. Verify creator display name and Thai date format appear on card
  5. Patient opens `/patient/plan` and verifies the new course is visible for selection
  6. Verify responsive layout at Mobile (390px), Tablet/iPad (820px), and Desktop (1440px)

- [ ] **Step 2: Execute verification script**
  Run `node scratch/verify-e2e-doctor-patient-course.mjs`.
  Expected: All checks pass, zero console errors, screenshots saved to artifacts.

- [ ] **Step 3: Clean up temporary scratch scripts and review branch status**
  Run `git status` to ensure clean working tree and no lingering temporary files.
