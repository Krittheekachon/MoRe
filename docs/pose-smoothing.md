# Landmark smoothing: 2026-10-09

This supersedes the earlier display-only smoothing pipeline in pose-tracking.md and knee-preparation-test.md. Angle definitions, exercise criteria, database schema, real exercise implementation, full-screen camera and floating controls are unchanged.

## One pipeline

Seated occlusion fix: quality/acquisition/jump checks now require the selected measurement chain and shoulder only for the mock. Hidden or jumping opposite hip/knee and heel/foot no longer reset EMA for the visible leg or blank its skeleton/angles. Preparation still separately requires reliable heel/foot and both-side hip/knee depth to authorize counting; missing auxiliary points show specific foot/far-leg guidance. No inferred coordinates, automatic side switching, or widened angle targets. This fixes a reproduced application gate failure; real model mislocalization on the user's seated image remains unverified.

Raw MediaPipe image landmarks → finite/bounds/visibility/presence/timestamp/body-scaled continuity checks → 300 ms acquisition → one per-landmark, per-axis x/y/z EMA → existing angle measurement and preparation gate → existing counter/feedback → skeleton/labels and displayed angles.

`PoseLandmarkSmoother` replaces the existing display-only EMA; the old class name is a compatibility export, not a second filter. Image/world-coordinate filters have separate instances and never mix units. The mock uses intrinsic image-2D knee hip–knee–ankle and torso/thigh shoulder–hip–knee as before. Skeleton and labels use the same filtered image coordinates as those measurements. There is no additional angle low-pass filter: smoothing coordinates already smooths angles, and another filter would add lag. Current angle, counter and saved per-repetition maximum all derive from accepted, filtered current coordinates. Stored peaks can differ from old raw peaks; targets and rounding are unchanged. Labels update on inference frames; React angle/preparation/landmark presentation updates at most every 200 ms for valid data, with immediate clearing on loss.

## Config and invalid samples

`src/lib/pose/tracking-config.ts`:

- `landmarkSmoothingMs: 40`: EMA `alpha = 1 - exp(-dt / 40)`. At the existing 100 ms minimum inference interval, approximately 92% of a new position is followed in one frame. This is a time constant, not a fixed frame count or total latency guarantee.
- `acquireMs: 300`, `maxFrameGapMs: 500`: retained tracking acquisition/gap checks.
- Jump allowance is `(0.04 + 2 × dtSeconds) × bodyScale`. `bodyScale` uses current hip–knee normalized distance divided by `referenceSegmentLength: 0.25`, clamped to `0.75…2`. This heuristic scales tolerance with framing/body size and elapsed time; it cannot identify furniture or person identity.

Visibility is required; optional presence is also checked if the current landmark includes it. Missing/low-confidence/out-of-bounds points never update EMA state and are hidden immediately, with zero confidence rather than fabricated zero coordinates. No old positions or angles are used for counting. Selected-side quality loss resets coordinate filters, nulls angles, and uses the existing mock short suspension/long interruption behavior; legacy counters keep their existing interruption policy. A gap over 500 ms resets per-point EMA when used alone. Reacquisition seeds from the new current position, not from the old subject. Large body discontinuities trigger reacquisition; smooth substitution of a different person is not guaranteed detectable because the current single-pose API has no persistent identity lock.

Side remains locked by the existing controls during a set. Changing side while allowed interrupts the unfinished draft and resets quality/preparation/filter display, without deleting saved results. Pause interrupts the draft and resets filters/acquisition; resume must reacquire and return to the initial position. Camera close/reopen and criteria/side changes reset state. Instances are created once per component, not once per render. Runtime keeps the existing single in-flight frame and skips repeated/non-increasing result timestamps. Video/canvas retain identical contain, centering and mirroring; label text remains counter-mirrored.

## Verification and device limits

Run `node scripts/test-pose-smoothing.mjs`, `node scripts/test-pose-tracking.mjs` and `node scripts/test-knee-preparation.mjs`. Timestamp fixtures cover two sides, 100/200 ms movement, jitter, complete cycles, interruption/occlusion, per-point/axis isolation, optional presence, stale timestamps and equal elapsed time at different frame subdivisions.

Chromium lifecycle/hydration regression uses real MediaPipe on a synthetic blank video, including direct URL, repeated reloads, internal navigation, assigned/free side controls, pause/resume/reset/save and camera cleanup. It verifies runtime/UI flow, not human pose accuracy.

Still required on real mobile/iPad in both orientations: stationary jitter, quick/slow extensions, occlusion/reacquisition, label alignment while rotating, cluttered-room false positives and perceptible delay. Tune only engineering filter config from these observations; do not widen exercise target ranges. Filtering does not establish medical measurement accuracy.

Verified: smoothing 48, tracking 31, preparation 65, feedback 79 and engine 16 assertions; recording regression 11 logic / 26 service / 5 API / 227 browser checks across 30 responsive combinations; hydration/lifecycle 50 checks with SSR/pre-hydration DOM matching and zero warnings in assigned/free-side cases. Lint, TypeScript, production build and repository Playwright skill validation passed. No real-human camera or physical iPad testing.
