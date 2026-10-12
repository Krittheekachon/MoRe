---
name: more-training-audio
description: Maintain MoRe patient camera/MediaPipe training audio, settings, countdown and per-exercise audio adapters; use when adding prompts, voice sets or exercise audio events.
---
# MoRe training audio
Read repository AGENTS.md, current docs/more.md and [training audio guide](../../../docs/training-audio.md) before changing camera audio. The guide contains the actual path/function/config routing table, event/file mappings, add-exercise procedure and troubleshooting. From this skill directory the repository guide is `../../../docs/training-audio.md` (resolve relative path from repository root if tooling handles links differently: docs/training-audio.md).

Pipeline: accepted existing engine/preparation snapshot → src/lib/audio/knee-audio.ts → TrainingAudioController → actual public/audio assets. Keep audio as presentation behavior; never duplicate exercise thresholds or alter counts/database to repair audio without an explicit user instruction.

Use shared global catalog and one player with no stale guidance queue. Numbers are rep_completed only, 01–20 with padStart; preparation uses ready → 5..1 → whistle with cancellable tokens. Preserve repetitions after pause; cancel all audio at pause, close, unmount and voice change. Do not add return_to_start or overlapping TTS/ticks.

Settings must hydrate consistently: server cookie defaults in layout.tsx feed DisplaySettingsProvider; browser APIs are gesture/lifecycle-only. Verify direct URL and refresh console, not just lint/build. Test file existence, priority/cooldown/cancellation using scripts/test-training-audio.mjs; inspect mobile/tablet/desktop settings. Report actual tested browsers separately from physical iPad unlocking/timing and human-pose testing.

No pre-existing MoRe camera skill was found on 2026-10-12; this scoped project skill is the entry point. Keep its detailed guide synchronized when code paths/config/event contracts change. Do not copy unrelated Prisma skills or invent a second engine.

Countdown regression note: never let audio-ready override engine allowed; loss during preparation cancels sequence/remaining before corrective guidance. Map knee-start corrective messages to the existing posture MP3, keep engine thresholds/counts/DB unchanged. Patient angle labels use the existing drawMeasurementLabels renderer; debug visibility restrictions must not inadvertently hide a user-requested overlay. See training-audio.md for confirmed findings and tests.

Start signal completion rule: after number 1 clears, issue the whistle and allow training using current engine permission immediately; do not await the whistle tail with remaining=1. Countdown number playback uses countdownAudioTimeoutMs (3000ms) rather than the generic 20s timeout. Test missing ended events on numbers and whistle; never allow a media event to deadlock readiness. See training-audio.md.

Encouragement uses audioConfig.encouragementAngle (140?150 inclusive) and encouragementMs (2000), once per movement round. Do not reset the spoken latch on a noisy frame or leaving this audio range; cancel current guidance without changing engine criteria.

Draft reset with a retained camera must restore audio's paused flag and clear stale guidance cooldown via KneeAudio.resetForNewSet. Do not reuse pauseLocally's silent state after a successful reset. Preserve mute preference and the stream/worker; do not replay intro. Plan target repetitions are not a cap on counting/correctness; verify extra completed rounds without changing angle criteria.
