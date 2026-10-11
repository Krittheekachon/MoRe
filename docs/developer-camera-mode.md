# Developer camera mode

## Access

Run `npm run dev` (localhost) or `npm run camera:test:https` for a network device using the existing HTTPS setup. On the patient login form, enter `dev` in the ID field and `password` as the password. Successful login opens `/developer`. Logout uses the normal session logout.

This credential works only when the server's `NODE_ENV` is `development`. The encrypted server session carries a developer flag and no patient user ID. Both `/developer` and `/api/developer/criteria` check that flag and the environment on every request. Production rejects the login (401), the API (403), and the page (404), including a cookie previously issued in development. Ordinary patients cannot access these resources. No database account or schema migration is required.

## Shared camera and engine

The developer page uses `PoseCamera`, the existing Full Pose Landmarker worker, landmark quality/filtering pipeline, preparation gate, and repetition engine for `demo-knee-extension`. Criteria are produced by the existing `cameraTestCriteria` binder from the current exercise definition. Unstored checkpoint/metric ID placeholders are never persisted.

Choose a side, open the camera, and start/pause/resume using the existing controls. Close the camera before changing sides. Reset clears the in-memory attempt and completed results while preserving the active stream/model. There is no Save Set control. Developer start, pause, resume, reset, exit and unload do not call patient recording endpoints or write sessions, sets, repetitions or progress. Patient recording continues through its existing API.

## Debug and overlays

Debug can be opened/closed. Its snapshots update every 200 ms (approximately 5 Hz); overlay options use refs and do not restart inference. Skeleton, landmark IDs and angle lines can be independently enabled. Labels/lines use the same filtered points and mirroring as the camera overlay.

The panel displays camera/model state, observed processing FPS, worker inference time, selected side and landmark IDs; raw x/y/z/visibility for the selected shoulder, hip, knee and ankle; raw/filtered angles, active definition/code/versions and thresholds; quality, orientation/depth uncertainty, preparation timer/blockers, engine state, count, current repetition peak and latest result. Missing measurements display “ไม่มีข้อมูล”. Inference time measures `detectForVideo`, excluding transport and UI rendering; FPS measures returned inference frames, not video display FPS.

Raw coordinates are MediaPipe normalized image coordinates: x/y relative to source dimensions and z relative depth. The existing image-2d angles use x × source video width and y × source video height, not CSS dimensions or z. Knee uses hip–knee–ankle; torso uses shoulder–hip–knee. Displayed angles and counting retain the shared quality-gated smoothing pipeline and original thresholds.

Patient pages retain the test exercise, instructions, positioning guidance, counts/sets and ordinary recording. Technical debug panels, coordinates, criteria, measurement overlays and simulation controls are developer-only. No patient Debug button is provided.

## Verification (2026-10-11)

- Developer policy: 8 assertions; engine: 16; preparation: 259.
- Chromium developer browser checks: 23, including UI login, authorization, direct loads/refresh, no horizontal overflow at 390×844, 834×1194, 1194×834 and 1440×900, actual Full model inference, reset retaining the stream, and zero patient API mutations during start/pause/reset/close.
- Real production server: 3 checks for rejected credentials and rejected development cookie on page/API.
- Isolated patient recording regression: 11 logic, 26 service, 7 API and 76 browser checks. Patient login, assignment/free-side flows, partial recording and developer denial passed; zero hydration warnings. Temporary patient fixtures were cleaned up.
- Lint, TypeScript and production build passed. Responsive screenshots inspected in Chromium. Camera automation uses a blank canvas stream and the actual model; it does not manufacture pose landmarks or validate human movement.

Physical iPad/mobile camera permissions, tracking accuracy, FPS and real seated extension/return still require device testing. Open the HTTPS URL produced by the existing camera script, trust the local certificate according to the camera setup documentation, and test both sides, occlusion, pause/resume and reset. These mock criteria are engineering fixtures, not medical validation.
