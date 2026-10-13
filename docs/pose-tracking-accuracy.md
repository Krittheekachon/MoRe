# Selected-leg tracking reliability — 2026-10-13

Current model setting: the user subsequently changed `defaultPoseModel` to `heavy`. Provision `node scripts/setup-pose-assets.mjs --heavy` on every machine; model assets are ignored by Git. Full-default statements below describe the earlier implementation. Full/Heavy comparison scripts explicitly select Full before opening the camera, independent of the user-selected default.

## Current Start flow — supersedes manual confirmation below

User changed the flow on 2026-10-13: remove the manual “ตรวจแล้ว จุดตรงกับข้างที่ฝึก” button for both shared patient/developer camera flows. Press Start once, then move into the seated preparation pose. Existing Start allocates/resumes the existing slot as before; no repetitions are created while waiting. `PoseCamera.frame` freezes the per-person chain baseline only when actively waiting, current image points are trusted, `KneePreparation` allows the start pose and `PoseChainContinuity.confirm(result.at)` has at least 500 ms continuous acceptable samples. Preview alone never freezes a baseline. This is stable-data acquisition, not confirmation of anatomical identity.

After acquisition the existing ready audio → 5..1 → whistle flow runs. Invalid pose/tracking cancels preparation/countdown, interrupts only the unfinished round and waits for valid start pose again. Pause/resume, reset and model/camera lifecycle reuse the existing flow. Reset/model/new stream invalidate the baseline; Start remains available to arm a fresh acquisition. No extra manual confirmation or recheck tap is required. Selected side, angle criteria, existing EMA, completed-round logic and persistence schema remain unchanged. Initial knee start is 60–115°, torso 80–115°; maintain the existing quality and stability thresholds.

The compact card is informational: “กดเริ่ม แล้วนั่งเข้าท่าเตรียม” before Start and “กำลังตรวจท่าเตรียม” while waiting. It shows the current positioning issue and disappears after acquisition. Labels remain visible. Users/caregivers may visually review the points, but this is optional advice. Because automatic stable-data acquisition replaces human approval, a stable wrong leg/hip/ankle can still become a baseline; do not claim automatic detection establishes correct anatomical placement. Historical manual-confirmation descriptions below describe the earlier implementation.


Branch: `fix/pose-tracking-accuracy`. Scope: engineering guards for `demo-knee-extension`, not the teammate's real exercise. On clarification the user selected keeping current v7 torso 80–115° and knee correct peak 155–180°; no criteria/checkpoint/version/DB edits.

## Ankle geometry and proportions extension

Latest clarification retains torso 80–115° (not the 90–105° copied into the request) and knee 155–180°. Existing per-instance, manually confirmed baseline is kept; no prescribed human thigh/shin ratio or replacement ankle is introduced.

`PoseChainContinuity.sample` optionally captures ankle–heel, ankle–toe and heel–toe image distances divided by this person's confirmed shin length. `update` compares these only if BOTH auxiliary landmarks were reliable at confirmation AND are reliable now. Missing/low-confidence auxiliaries are unavailable evidence, not a failure and not a substitute coordinate. They are never added to a frozen baseline later. A change exceeding `footGeometryAllowance + baselineRatio × footGeometryTolerance` gives `ankle-geometry`, cancels the unfinished cycle, clears filtered angles and uses “ให้กล้องเห็นข้อเท้าข้างที่ฝึกชัดเจน” and the existing ankle guidance audio. This indicates inconsistent geometry, not proof that clothing caused it. A foot landmark error can also cause this warning.

Values: `footGeometryAllowance = 0.20` of shin length and `footGeometryTolerance = 0.60` of the individual's confirmed ratio. The optional geometry check also resets pre-confirmation stability when reliable auxiliary geometry changes abruptly, so a suspect frame cannot immediately become a confirmed baseline. These allowances intentionally permit projected foot rotation/foreshortening; no clinical validation or detection guarantee is claimed. General point movement now scales hip/knee by confirmed thigh and ankle by confirmed shin rather than using the shorter segment for all joints. Existing hip/swap guards still use the shorter confirmed segment; test extreme proportions rather than assuming universal acceptance.

Preflight instructions also ask users to arrange loose trouser cuffs so the ankle is visible. Static but wrong initial ankle/heel/toe positions, jointly shifting foot points, gradual plausible drift and large perspective changes remain limitations. Check actual anatomical ankle before confirmation. Changing person or camera distance requires stopping and using “ตรวจตำแหน่งใหม่” (or camera/reset), not automatic baseline relearning.

## Confirmed cause and limitations

The existing `PoseTrackingQuality` tests confidence, acquisition and frame displacement, with its scale computed from the current hip–knee segment. It does not have a user-confirmed frozen segment baseline or evidence of a possible leg substitution. Confidence and locked landmark IDs do not establish anatomical correctness. No supplied black-trouser/overlapping-leg or waist-jacket clips were available, so this change does not establish that MediaPipe now locates those landmarks correctly.

The new checks detect some discontinuities; a wrong but stable initial hip or leg can pass them. User/caregiver visual confirmation is therefore required. Image-2D segment lengths change with perspective/foreshortening; an oblique camera may be rejected or change measured angles. No equivalence of oblique and side-on angles is claimed. Slow identity substitution with plausible geometry and overlapping legs may remain undetected.

## Actual pipeline and files

- `src/components/app/knee-camera.tsx` (`PoseCamera` through existing `pose-camera.tsx` entry): open stream → existing confidence/acquisition guard → `PoseChainContinuity` → existing single 40ms EMA → existing angle/preparation/countdown/engine → overlay and saved completed rounds.
- `src/lib/pose/chain-continuity.ts`: `update`, `confirm`, `reset`; selected shoulder/hip/knee/ankle quality, source-aspect-corrected image distances (`x × width/height`, `y`), independent selected-side key and immutable baseline. No replacement coordinates, relabeling or automatic side selection.
- `src/lib/pose/tracking-config.ts`: `chainTrackingConfig`; confirmed shorter segment scales movement thresholds. Frozen baseline is committed only after reliable samples and an explicit user action. Rejected/missing samples cannot replace it. The opposite chain is optional evidence from a trustworthy preceding frame, never a permission requirement.
- `landmark-labels.ts`: `inspectChain` reveals selected anatomical hip/knee/ankle labels during preflight; normal angle labels remain unchanged after confirmation. Trial frames never sample the training counter or send recording mutations. Confirming interrupts preview/countdown state before real Start.
- `pose-camera.css`: compact expandable instructions, inspection-only compact metrics; full camera remains. Theme tokens, scrolling and existing controls retained.
- `model-config.ts`: Full default and actual local Full/Heavy paths. `runtime.ts`/`worker.ts`: one single-flight CPU worker, model option, monotonic result rejection. `changeModel` is developer-only, inactive-only and awaits old disposal; generation checks reject old callbacks. Close/reopen also awaits pending disposal. Model/side/stream/reset invalidates manual confirmation. Pause retains baseline but interrupts the unfinished round and requires reacquisition/start pose on resume.
- `scripts/setup-pose-assets.mjs`: default downloads Full; `--heavy` downloads Heavy separately, checks pinned SHA256 and writes atomically. Assets are ignored by Git; each machine must provision them. Source: [Google Pose Landmarker guide](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker).

## Adjustable experimental values

| Config | Initial value | Meaning |
|---|---:|---|
| confirmStableMs | 500 ms | Reliable preview continuity before confirmation enabled |
| maxGapMs | 500 ms | Tracking gap; never bridge old motion |
| reacquireMs | 400 ms | Reliable current samples before continuing after loss |
| baselineLengthTolerance | 0.45 | Max fractional deviation from confirmed 2D segment length |
| frameLengthAllowance / frameLengthSpeed | 0.10 / 2 | Fractional length allowance + fractions/second × timestamp delta (0.30 at 100 ms) |
| hipAllowance / hipSpeed | 0.12 / 1.5 | Shorter-segment fractions, plus fractions/second × timestamp delta |
| pointAllowance / pointSpeed | 0.20 / 8 | Joint-motion allowance; permits planar fast knee extension in timestamp fixtures |
| swapSeparation / swapMovement / swapRatio | 0.25 / 0.20 / 0.45 | Optional previous opposite-chain separation, displacement and relative-distance evidence |

These are starting engineering heuristics, not validated anatomical/clinical thresholds. Low confidence, jump/segment/swap suspicion interrupts the unfinished round immediately, clears filtered angles, cancels readiness audio, and displays “ตรวจจับข้างที่ฝึกไม่ชัด กรุณาจัดตำแหน่งใหม่”. Completed repetitions remain. Returning trustworthy samples must reacquire and return to start; no held sample counts. If geometry really changes, use “ตรวจตำแหน่งใหม่” while stopped rather than silently learning a new baseline.

## Test entry and model comparison

Run `npm run camera:test` (or HTTPS variant on an iPad), login `dev` / `password`, open `/developer`, choose the side, open camera, separate the legs, use sufficient light and remove clothing tied around the waist and arrange loose cuffs away from the ankle. Expand preflight instructions, move the chosen leg slowly, return to preparation and visually check the three labels before confirming and pressing Start. Patient mock uses the same preflight and pipeline without developer debug/model controls.

Provision `node scripts/setup-pose-assets.mjs` and `node scripts/setup-pose-assets.mjs --heavy`. Full stays default; switch while stopped, confirm again. Developer debug reports selected model, inference milliseconds, processing FPS, raw non-empty pose outputs / processed frames (not accuracy), and guard reason. Mute/error/missing model must not create training counts.

For actual comparison use the SAME source clip, playback speed, source resolution and timestamps separately with Full then Heavy. No clip uploader is added to patient UI. A test harness can supply that clip as the video source to `openPoseRuntime` and collect `PoseFrame` outputs sequentially. Prepare consented clips for normal clothing, black trousers + overlapping legs, waist-tied jacket, and loose moving trouser cuffs (including leg still while cuff moves), both sides, side-on and any proposed oblique placement. Manually annotate chosen-side identity and hip/knee/ankle, complete cycles and occlusion periods. Report swap/hip errors, rejected valid motion, extra/missed cycles, inference mean/p95, accepted-frame rate and delay separately from skeleton jitter. Do not infer accuracy from confidence, non-empty rate or smoother animation. No clip/frame data is stored in patient DB.

On physical iPad test portrait/landscape, voice unlock/countdown cancellation, slow/fast extensions, pause/resume/reset, model failure/switch, close/open and navigation away. Verify stable-but-wrong starting detection is caught by human confirmation, not claimed caught by this guard.

## Human measurement protocol (not yet performed)

Compare Full and Heavy sequentially with the same consented clips for each clothing scenario and side. Recruit several people with different leg lengths and thigh/shin proportions; record the actual measurements and uncertainty, rather than grouping by appearance alone. Keep source resolution, illumination and camera placement comparable. Repeat each person at different camera distances with the full selected measurement chain visible; reset and confirm a fresh individual baseline at each position. This separates distance effects from proportions. Do not conclude that leg length caused a failure based on one person.

For every clip/model record: manually annotated completed cycles vs counted cycles, false/missed counts, side substitutions/hip/ankle placement errors, rejected valid cycles, processing mean/p95 and device latency. For angle accuracy use an independently measured reference with a documented measurement method, frame alignment, viewing plane and uncertainty; MediaPipe or its smoothed output cannot be its own ground truth. Record no-output frames as missing, not 0°. Report limitations and individual results before any population conclusion. The synthetic proportions test below is software coverage, not this human study.

UI finding: the shared angle-view throttle was being advanced during every missing-angle frame. Guard status now has its own `lastChainViewAt` (200 ms), so current ankle uncertainty reaches the warning/debug panel even while angle data are unavailable. This changes presentation timing, not engine thresholds.

## Reproducible checks

- `node scripts/test-chain-continuity.mjs`: 1,440 timestamp assertions (includes 36 side/mirror × individual proportion × camera-scale combinations; thigh/shin 0.12/0.22, 0.22/0.12, 0.20/0.20 in normalized-image fixtures, scales 0.6/1/1.2, auxiliary ankle contradictions, repeated cuff-like changes without extra counts, missing auxiliaries, and no late baseline learning), plus left/right/mirror, legitimate planar fast motion, hip jump, substitution, missing points, baseline protection, stale samples and preservation of completed rounds.
- Existing regression: tracking 31, smoothing 48, mock readiness 317, preparation 87, training audio 112 assertions; existing criteria unchanged.
- Playwright CLI: open the running development origin, then `run-code --filename scripts/test-pose-accuracy-browser.js` (35 checks; mock worker landmarks, 4 viewport sizes, informational preflight/one-tap Start/automatic acquisition/cancel and restart countdown/complete a round/reject hip/ankle geometry jumps/specific ankle guidance/preserve completed count/pause/resume/reset/switch/close, direct/refresh, no patient mutations or hydration errors) and `scripts/test-pose-model-browser.js` (5 checks; real Full and Heavy each produce inference on blank synthetic video, never >1 worker, cleanup). These do NOT measure human detection accuracy.
- Existing recording regression with `MORE_TEST_ORIGIN=http://localhost:3002 MORE_CAMERA_HYDRATION=1 node scripts/test-recording.mjs`: 11 logic, 23 service, 7 API and 74 browser checks passed. Direct/refresh markup and hydration checked; blank inference can arm Start but cannot acquire a valid baseline or count; preview has no recording slot, reset retains worker/stream, close releases them. Temporary isolated fixtures removed; patient data and catalog preserved. The existing pg concurrent-query deprecation warning is unrelated to pose changes.
- TypeScript, targeted lint and production build checked. Physical iPad/Safari and the requested human clips remain untested.
