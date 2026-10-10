# Mock readiness v4: 2026-10-09

Engineering fixture only (`demo-knee-extension`), not medical criteria. No changes to the teammate's real exercise, schema, Full model, 2D angle formulas, mirror/contain mapping, EMA or primary camera controls.

Latest correction: v4 sets `singleSideOrientation: true`. Preparation requires the selected hip/knee/ankle and shoulder/torso angle; opposite-leg visibility/depth are no longer required. Direction uses selected hip-to-knee and, when visible, heel-to-foot. Hidden heel/foot do not block a valid selected chain. Wrong selected direction still blocks; no near/far depth claim is made. Opposite-side confidence/depth in debug are informational only. Preparation snapshots v3/v4 now use the single-side runtime policy, retaining their own angle ranges. Angle/checkpoint ranges are unchanged; no seed/schema change is needed. This supersedes bilateral-confirmation descriptions below.

## Confirmed causes versus device uncertainty

- Latest single-side policy applies to preparation-enabled demo snapshots v3 and v4. Their angle thresholds, confidence thresholds, EMA and counter remain unchanged. Opposite hip/knee missing/low presence no longer block knee measurement/counting. Missing selected hip/knee/ankle gives “ให้กล้องเห็นสะโพก เข่า และข้อเท้าข้างที่ฝึก”; missing initial shoulder gives a separate torso-measurement instruction. Wrong selected direction gives “หันข้างที่ฝึกเข้าหากล้อง”. Direction lock is retained during continuous tracking and cleared by existing interruption/pause behavior. Depth is calculated only if all four selected/opposite hip/knee landmarks pass current quality; absent or ambiguous values yield “ไม่สามารถยืนยัน”. Reliable depth differences are labelled as evidence from the current frame, not a confirmed near-side identity, and never gate permission in this mock. This supersedes the earlier statement that v3 retained bilateral readiness.

- Follow-up screenshot shows knee 91° / torso-thigh 104° and the bilateral-occlusion message. These angles are within v4 ranges. Old v4 criteria snapshots without the newly added single-side flag still reached the bilateral branch; synthetic fixtures reproduce this. `refreshMockCameraPolicy` normalizes only demo v4 snapshots in the gate and camera loading/resume path. Canonical signatures ignore object key order but still reject actual angle/version/checkpoint changes. Existing reps remain intact. This does not prove the exact config/version or script cache state on the physical iPad; reload the page to load the corrected code. Synthetic 91°/104° fixtures with the opposite leg hidden now pass for both sides.

- v3 rejected 95° knee readiness because its start range was 80–90°. The same synthetic side-on fixtures at 90°, 95°, 100° now pass preparation with v4.
- v3 reset readiness on every invalid frame; the counter reset start/return stability on every outside-range sample. Timestamp tests reproduce how boundary jitter can prevent progress.
- v3 independently required torso angle, near-vertical torso, near-horizontal thigh and stable hip, and rechecked orientation/posture during motion. These can block an otherwise valid knee cycle. v4 retains the torso angle as a preparation condition but treats tilt/hip position as positioning guidance rather than duplicate hard gates.
- The original start-knee range was already checked only while `movement.phase === preparing`; there was no confirmed unconditional 80–90° check during extension. Model mislocalization in the user's room and physical-device timing remain unverified.

## Config changes

All values live in `src/lib/pose/exercises/camera-knee-extension.ts` and are bound through the existing adapter.

| Value | v3 | v4 |
|---|---|---|
| Start knee | 80–90° | 75–105° |
| Return knee | 80–92° | 75–108° |
| Departure | ≥110° | ≥125° |
| Preparation torso/thigh | 80–100° | 70–110° |
| Preparation stability | 400 ms | 400 ms |
| Start/departure/return counter stability | 200 ms | 200 ms |
| Correct completed-round peak | 160–170° | 160–170° |
| Edge grace/tolerance | none | 250 ms / 3° |
| Long loss | 1000 ms | 1000 ms |

`StableWindow` carries already verified duration across brief edge failures but never adds the last-good→invalid or invalid→first-good intervals. Long failures reset progress. Only actual in-range accepted samples can complete readiness or return; tolerance never substitutes an angle or expands the actual valid range. Mock readiness applies grace to small knee/torso edge errors; ambiguous direction/depth still blocks preparation. Core hip/knee/ankle visibility/presence and quality filtering are unchanged. The optional counter grace fields leave legacy/clinical definitions without them on their original behavior.

Preparation confirms raw-frame direction and both-side hip/knee depth over valid stable samples, then locks the selected side. Auxiliary opposite-leg/foot occlusion after confirmation does not re-run orientation rejection during the cycle. Core tracking loss suspends counting; long loss interrupts only the unfinished round and clears the orientation lock. Pause resets preparation/filters and interrupts the unfinished draft; resume starts at the initial position again. No automatic side swap. Torso/shoulder loss prevents initial preparation; after orientation lock, unreliable torso is displayed as unavailable without invalidating a still-reliable knee chain.

Counter sequence: preparation 400 ms → start confirmation 200 ms → departure ≥125° stable 200 ms → return 75–108° stable 200 ms → one repetition. A departure alone or extension hold never adds a rep. A completed peak of 140°, for example, contributes one total rep but not one correct rep. Return at 106–108° can finish a round, but the next round must re-arm within 75–105°.

## Database and setup

`demo:seed` adds v4 checkpoints with `upsert(update: {})`, preserving v1/v2/v3 checkpoint rows and saved results. The adapter retains explicit v1/v2/v3 implementations. No migrations/schema additions. Start a new unsaved set after seeding; an already-open set keeps its bound criteria until reset/reopen.

```powershell
npm run demo:seed
npm run camera:test
```

Use the normal plan → today's exercises → guide → camera flow at `http://localhost:3001/patient/plan`. For mobile/iPad use the HTTPS instructions in camera-test-mode.md.

## Test-only debug

Camera labels show knee and torso/thigh angles plus the selected shoulder (`overlay-config.showShoulderLabel: true`). Ankle/heel/foot name-only labels remain hidden by `showNameOnlyLabels: false`; tracking, skeleton points/lines and debug confidence lists are unchanged. Set `showNameOnlyLabels` to true to restore all name-only labels.

When camera-test mode is enabled and the selected exercise is the mock, the existing secondary control-card scroll region includes **Debug ท่าทดสอบ**. It starts closed on both server and initial client render. No debug control/data panel is rendered in normal patient mode. It shows current two angles and ranges, per-joint confidence, actual direction vectors/depth differences with thresholds, orientation lock, preparation/counter stability, phase and blocking/cancellation reasons. Values come from the current quality-gated pipeline; no frame logging. Updates share the existing valid-data 200 ms UI throttle. Opening/closing debug does not create a new worker or change training state.

## Verification

`scripts/test-mock-readiness.mjs` checks both sides, 90/95/100° readiness, v3 rejection, edge grace without invalid-time accumulation, initial ambiguous orientation rejection, locked auxiliary occlusion, core loss/long interruption, stationary edge jitter, extension hold, single full return, incomplete target, pause/resume and preserved completed reps. `scripts/test-knee-preparation.mjs` explicitly remains a v3 regression.

Physical iPad/human camera remains untested. Test seated 90–100°, slow/quick extension, boundaries, chair occlusion, pause/resume, and open debug to identify the exact blocking condition. Synthetic tests confirm application state behavior, not medical accuracy or pose detection quality in a cluttered room.

Verified: readiness 65, legacy v3 preparation 89, smoothing 48, tracking 31, feedback 79, engine 16 and shared-plan 15 checks; recording 11 logic / 26 service / 5 API / 227 browser checks in 30 responsive combinations; camera hydration/debug/lifecycle 54 checks with matching SSR/pre-hydration DOM and zero hydration warnings across assigned/free sides. Lint/typecheck/build and repository Playwright skill validation passed. Additive seed ran twice successfully.

Latest selected-side correction verification: readiness 109, preparation 87, smoothing 48, tracking 31, feedback 79 and engine 16 assertions passed. Both sides complete a repetition with the opposite leg hidden; selected-side occlusion suspends counting without switching sides. Mirrored rendering retains anatomical landmark indices. Recording regression passed 11 logic / 26 service / 5 API / 54 Chromium hydration/lifecycle checks, including direct navigation and reloads, with zero hydration warnings. Lint, TypeScript, production build and repository skill validation passed. No seed/schema change was needed for this runtime orientation policy. Physical iPad and human-camera validation remain pending.
## Mock v5: wider preparation for green-feedback testing

The current mock uses knee start 60–115 degrees, return 60–118 degrees and preparation torso/thigh 50–130 degrees. Departure remains 125 degrees; the target remains 160–170 degrees held for 200 ms during an armed movement. Preparation remains 400 ms and counter stability 200 ms. Selected-side confidence, EMA, direction lock and engine are unchanged. These are engineering test values, not clinical thresholds.

V4 is retained explicitly; the existing idempotent demo seed adds v5 checkpoints without overwriting old versions/results. Seed was run successfully. Reload and start a new set to use v5; an existing started draft retains its bound version. Use the normal camera-test flow, prepare with the selected leg visible, press Start, hold the start position about one second, extend to 165 degrees for at least 200 ms, then return. Green indicates the target reached; a repetition is added only on stable return.

Verified: readiness 141 (including both-side wide-start → green → return tests), feedback 79, preparation 87, engine isolation 16 and shared-plan recording 15 checks. Lint and TypeScript passed. No component markup, browser API, or hydration initialization changed. Human movement and physical iPad remain unverified.
## Five-second preparation countdown (2026-10-10)

After pressing Start (or resuming), the mock preparation gate first confirms the seated start posture. The camera guidance card then displays 5, 4, 3, 2, 1 using accepted inference timestamps. Repetition samples are withheld until five seconds complete. Leaving the start posture or losing selected-side tracking during the countdown resets it; a frame gap over the existing maxGapMs restarts at five. The countdown runs once per Start/resume, not per repetition. Pause, reset, side change and stream closure discard its state through the existing preparation lifecycle. The original repetition engine still confirms the starting angle before accepting departure. No automatic camera permission, model reload, database/schema or clinical exercise changes.

Implemented in pose/preparation-countdown.ts and app/knee-camera.tsx, reusing the existing camera guidance card. Countdown checks 110 and mock readiness checks 141 passed; lint/typecheck passed. Human-camera/iPad countdown review remains pending.
## Selected-thigh seated preparation correction (2026-10-10)

Confirmed code issue: v5 broad knee/torso ranges combined with guidance-only thigh tilt could accept a bent standing-like chain. Orientation locking also bypassed repeated torso checks. The mock now requires selected hip-to-knee inclination within 35 degrees of image horizontal (intrinsic video dimensions), before countdown and during movement, including after orientation lock. This is an adjustable engineering seated-posture heuristic, not proof of chair contact or a medical classifier. A tilted camera or confident model mislocalization can still affect this check. Opposite-side occlusion remains allowed; confidence, EMA, knee ranges, target and counter remain unchanged. Old v5 snapshots missing the new field are normalized from the exercise config; no stored angle/checkpoint or schema changes are needed. Pause/restart remains necessary to abandon an old unfinished round; completed reps are preserved.

Readiness 149 checks passed, including a permissive bent-standing reproduction, rejection with the seated check, rejection after orientation lock, old v5 snapshot normalization, and both-side seated full repetitions/green feedback. Countdown 110 and legacy preparation 87 checks passed; lint/typecheck passed. Physical seated/standing camera and iPad testing remain pending. The UI guidance asks the user to sit on a chair and bring the thigh near horizontal; it does not claim confirmed chair detection.
- 2026-10-10: camera guidance warning now hides when preparation is ready and tracking is reliable. The explicit countdown remains visible until complete; unreliable tracking or failed preparation shows the warning again. Rendering uses existing preparation state plus an optional countdown display field; counting/thresholds unchanged. Lint/typecheck passed; physical iPad visual review pending.

## Readiness diagnostics and 90/105-degree regression (2026-10-10)

Confirmed code blockers: v5 had an added 35-degree selected-thigh hard gate despite broad knee/torso angles, and the single-side gate required signed image-facing direction plus optional heel/toe direction. Anatomical side does not determine image-facing direction; a reflected source image or a mislocalized auxiliary foot could reject a clear selected knee chain. Removed the redundant thigh hard gate (now advisory) and use the magnitude of selected hip-to-knee image direction; auxiliary foot/depth never authorize or block the single-side mock. Core tracking quality and initial selected shoulder/torso checks remain required. Camera position cannot be confirmed from two displayed angles alone; no claim of detecting chair contact or rejecting all standing poses is made. This supersedes the earlier 35-degree seated hard-gate section.

DB audit found versions 1–5; v4 checkpoints remain start 75–105/return 75–108/peak 160–170, v5 start 60–115/return 60–118/peak 160–170. demoCriteria binds the current v5 using the assignment exercise code and selected-side metric; recording-service validates code, landmark metric, versions and checkpoint ranges before returning it. The approved real-exercise registry remains separate. No DB edits, seeding, schema or target-range changes were necessary. The physical iPad's previously loaded version is unknown; new debug identifies it explicitly.

Debug now includes exercise code, definition/criteria versions, selected side, camera/model/start state, raw and filtered knee/torso values, unrounded inclusive angle check results, acquisition, each readiness blocker, stable time, selected direction, and informational depth. Filtered intrinsic-image coordinates feed both displayed angles and the counter. Display rounding (labels integer degrees, debug three decimals) does not alter comparisons or saved peaks. Initial knee checks are not applied during departure/return. Readiness ref state persists through renders and keeps the existing timestamp grace; countdown uses the same Start/resume handler and existing camera lifecycle.

Verified: readiness 231 assertions, including 90-degree knee/105-degree torso for v4/v5 and both sides; exact inclusive min=max tests, boundaries/outside ranges, reflected images, selected tracking loss, opposite occlusion, misleading auxiliary foot, tilted 90/105 posture advice, stationary/no rep, full return/one rep. Legacy preparation 87, countdown 110, smoothing 48, tracking 31, feedback 79 and shared-plan recording 15 checks passed. Recording regression passed 11 logic/26 service/5 API/54 Chromium browser hydration/lifecycle checks (direct URL/reloads/navigation; SSR/pre-hydration DOM match and zero warnings). Lint/typecheck/build passed. Real-human movement and physical iPad remain unverified. Test seated positioning, countdown, one full extension/return, stationary pose and actual tracking loss on the device, and consult debug for the remaining blocker.
- 2026-10-10: angle overlay labels shortened to ลำตัว and เข่า, removing anatomical-chain/hip-name prefixes from the angle labels. Camera guidance uses the same short names; joint indices, formulas, thresholds and recording unchanged. Preparation/renderer 87 checks and lint/typecheck passed.

## Continuous mock torso range (2026-10-10)

Current mock v5 now requires the selected shoulder–hip–knee filtered angle within 90–105 degrees inclusive before preparation/countdown and throughout extension/return, even after direction lock. The latest user instruction supersedes prior broad/advisory torso behavior. Any out-of-range or unavailable torso immediately interrupts the unfinished repetition, clears preparation stability/direction lock, and requires stable preparation plus a knee start position before a new round. Completed repetitions are retained. Out-of-range guidance is “ปรับท่านั่งให้มุมลำตัว–ต้นขาอยู่ที่ 90–105°”. No stale torso sample or edge grace authorizes an out-of-range frame. This is an engineering angle condition, not evidence that a user stood up.

The range and maintainTorsoRange flag live in camera-knee-extension.ts; the existing mock adapter refreshes old v5 runtime snapshots from that config. Knee checkpoint ranges, target, completed-round engine, filtering and database save behavior are unchanged; no DB/schema/seed change required because torso is a runtime gate rather than the stored primary knee metric. Real exercise definitions are unchanged.

Readiness 257, legacy preparation 87, countdown 110 and shared recording 17 checks passed, with lint/typecheck. Tests cover both sides, stationary/no rep, valid full repetition/one rep, upper/lower torso violations, stand/sit-like invalid torso sequences, selected shoulder occlusion, preservation of previous repetitions and prohibition of finishing an interrupted round. Human-camera/iPad review remains pending.
- 2026-10-10 latest mock adjustment: continuous torso range is now 90–110 degrees inclusive, replacing 90–105. The guidance reads the configured bounds. Knee correct peak remains 160–170, and immediate cancellation/rearming behavior is unchanged. Readiness 259 checks (110 accepted, 111 rejected) and feedback 79 passed; lint/typecheck passed. Physical camera review remains pending.
