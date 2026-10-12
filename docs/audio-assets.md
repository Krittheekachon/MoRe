# Rehabilitation voice assets

Both `public/audio/more-male` and `public/audio/more-female` contain the same 28 English MP3 filenames, now organized into `global` (22 files) and `seated-knee-extension` (6 files). Public URLs use `/audio/more-male/…` or `/audio/more-female/…` (omit `public`). The male and female original numbering differed; the 2026-10-12 rename used separate mappings for each folder.

## Prompt filenames

- `exercise_intro.mp3`
- `adjust_camera_position.mp3`
- `move_into_camera_view.mp3`
- `improve_tracking_visibility.mp3`
- `correct_seated_posture.mp3`
- `ready_for_countdown.mp3`
- `encourage_knee_extension.mp3`
- `turn_side_to_camera.mp3`

## Repetition numbers

Twenty files are named `rep_count_01.mp3` through `rep_count_20.mp3`. When a caller is added, format the integer with `String(rep).padStart(2, "0")`:

```ts
const filename = `rep_count_${String(rep).padStart(2, "0")}.mp3`;
```

Only repetition numbers 1–20 have audio assets. These filenames do not change counting behavior.

## Verification

All 56 original files were found and renamed, with no missing or unmatched assets and no destination overwrites. Each folder has exactly 28 files and their sorted filename sets match. Every file's SHA-256 before and after the rename is identical; evidence is stored in [audio-assets-checksums.json](audio-assets-checksums.json).

Repository search found no existing audio callers or old MP3 path references in source, scripts or documentation at rename time. Audio playback is now connected via [training-audio.md](training-audio.md); the earlier rename alone did not connect it; pose detection, counts and database recording are unchanged. Files already using their destination names were also checked on a second pass and skipped (56 skipped, zero renamed).
