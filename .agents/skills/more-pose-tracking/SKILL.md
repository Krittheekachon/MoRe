---
name: more-pose-tracking
description: Maintain MoRe selected-leg pose quality, automatic preparation after Start and Full/Heavy model lifecycle; excludes doctor UI and unrequested clinical or database changes.
---
# MoRe pose tracking

Read AGENTS.md, current docs/more.md and [tracking reliability guide](../../../docs/pose-tracking-accuracy.md). Follow the existing PoseCamera → runtime/worker → quality → single EMA → preparation/counter → overlay pipeline. Do not create a second engine or use smoothing/confidence as proof of anatomical identity.

Use `PoseChainContinuity` only for the mock exercise. Current user decision: no manual confirmation button. Start arms the existing flow; `PoseCamera.frame` acquires a frozen baseline only while actively waiting, with current trusted landmarks, `KneePreparation` permission and `PoseChainContinuity.confirm` stability. Preview alone cannot acquire it. Never learn rejected points, infer chosen side from the most moving leg, require the opposite leg, synthesize missing coordinates, or count trial/held samples. Suspicion interrupts the unfinished round immediately but preserves completed rounds. Camera/side/model/reset must invalidate confirmation; pause/resume must reacquire and await start pose. Baseline cannot detect a wrong but stable initial landmark; optional visual review is advice, not a required extra tap. Never label automatic acquisition anatomical confirmation.

Tune engineering values in `chainTrackingConfig`, not exercise angle ranges. Source aspect ratio corrects normalized distances. Image-2D segment consistency is sensitive to perspective, so test fast real motion and oblique views, not only jitter. Consult docs/training-audio.md when changing readiness cancellation.

Preserve the user-selected `defaultPoseModel` (currently Heavy); do not reset it to Full. Provision the selected model on each machine. Developer model switch awaits old runtime disposal; reject old async callbacks using generation and monotonic timestamps, never run two workers. Use `model-config.ts` and checksum-verified `setup-pose-assets.mjs --heavy`; assets are local/ignored, not stored in patient DB.

Run chain-continuity and existing tracking/smoothing/readiness/audio checks plus the guide's direct/refresh/browser lifecycle tests. Separate synthetic/blank-video lifecycle evidence from same-clip human Full/Heavy comparison and physical iPad measurements. Do not promise accuracy that was not measured. Update the detailed guide from confirmed results.

Ankle evidence: compare optional reliable same-side heel/toe geometry only with an automatically acquired stable preparation baseline containing those points. Never learn missing auxiliaries later, impose a universal thigh/shin ratio or fabricate ankle positions. Configure `footGeometryAllowance`/`footGeometryTolerance` in `tracking-config.ts`; `ankle-geometry` is uncertainty, not a clothing diagnosis. Test proportions AND image scale, stationary-leg/moving-cuff cases, and missing auxiliaries; separate these synthetic fixtures from multi-person measurements. Preserve the current clarified angle ranges rather than changing them to improve tracking.
