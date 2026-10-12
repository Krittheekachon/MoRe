# เสียงระหว่างฝึก MoRe

## Pipeline และขอบเขต

`PoseCamera.frame` ใช้ accepted/filtered landmarks และ `KneePreparation`/counter เดิม → `KneeAudio` presentation adapter → `TrainingAudioController` → MP3. ไม่มี Botnoi API, TTS หรือเสียงติ๊ดซ้อน ตัว counter และ DB ไม่เปลี่ยน สูตรมุม/ช่วงเป้าหมายยังมาจาก definition เดิม การเตรียมเริ่มใน mock รอ audio sequence แทน timer แบบเดิม ส่วนท่าอื่นยังใช้ `PreparationCountdown` เดิม

ปัจจุบันเชื่อมเฉพาะ exercise code `demo-knee-extension` ผ่าน `assignment.exercise.code` ไม่แก้ implementation ท่าจริงของเพื่อน `rep_completed` เป็น presentation event ที่อนุมานจากจำนวน `counter.repetitions` เพิ่มหลัง `sample` ของ engine จริง ไม่ยิงจากการถึงเป้าหมายหรือปุ่ม UI

## ต้องการแก้อะไร → แก้ที่ไหน

| ต้องการแก้ | ไฟล์ | ฟังก์ชัน/config/ส่วน |
|---|---|---|
| เปลี่ยน MP3/บทพูด | `public/audio/more-male` และ `public/audio/more-female` | แทนไฟล์ชื่อเดิมใน global/โฟลเดอร์ท่า; ตรวจ checksum เมื่อย้ายชื่อ |
| เพิ่มเสียง global/เฉพาะท่า | `src/lib/audio/catalog.ts` | `globalSounds`, `kneeSounds`, `soundPath` |
| เพิ่มชุดเสียง | catalog, `display-settings.tsx`, `layout.tsx` | `Voice`, path `more-${voice}`, ตัวเลือก UI และ cookie parser |
| เพิ่มเลขเกิน 20 | catalog และ global ของทั้งสองเสียง | `audioConfig.maxRep`; `String(rep).padStart(2, "0")` |
| จังหวะ countdown/สัญญาณเริ่ม | `src/lib/audio/knee-audio.ts`, catalog, `public/audio/shared/Whistle Sound Effect Ringtone.mp3` | `updatePreparation`, loop 5→1, `countdownStepMs`; whistle หลังเลข 1 |
| Cooldown/รอก่อนแนะนำ | catalog | `cooldownMs=5000`, `encouragementMs=2000`, `encouragementAngle={min:140,max:150}` |
| Priority | controller และ knee-audio | `play(event, priority)`; guidance 1, intro 3, sequence 4, rep 5 |
| ท่าใหม่/event ใหม่ | adapter ท่าใหม่ + catalog + `knee-camera.tsx` | route ตาม exercise code; reuse controller/global ไม่ทำ engine ใหม่ |
| ค่าเริ่มต้น/จำค่าบนอุปกรณ์ | catalog, `display-settings.tsx`, `src/app/layout.tsx` | `audioConfig.enabled/voice`, `setAudio`, cookie `more-audio-enabled`/`more-audio-voice` |

## Mapping และเงื่อนไข

Paths เริ่ม `/audio/more-male/` หรือ `/audio/more-female/` ตาม voice; ไม่ใส่ `public` ใน URL

| Event | ไฟล์ต่อจาก base | เล่น/ยกเลิก |
|---|---|---|
| intro | `seated-knee-extension/exercise_intro.mp3` | หลังเปิด stream จาก gesture สำเร็จ ครั้งเดียวต่อการเปิด; หยุดเมื่อพัก/ปิด/ออก/เปลี่ยน voice |
| missing | `global/move_into_camera_view.mp3` | ไม่พบ landmarks; ข้อความจริงหนึ่งปัญหาต่อครั้ง |
| camera | `seated-knee-extension/adjust_camera_position.mp3` | gate แจ้งให้กล้องเห็นจุดวัด |
| visibility | `seated-knee-extension/improve_tracking_visibility.mp3` | ข้อความจุดไม่ชัด |
| posture | `seated-knee-extension/correct_seated_posture.mp3` | gate ลำตัว/ท่านั่งไม่ผ่าน |
| side | `seated-knee-extension/turn_side_to_camera.mp3` | gate ขอหันข้าง |
| ready | `global/ready_for_countdown.mp3` | ผ่าน gate ขณะกดเริ่ม; รอเสียงจบก่อนเลข; pose หลุดยกเลิก token |
| countdown | `global/rep_count_05.mp3` ถึง `rep_count_01.mp3` | แต่ละเลขแสดงตอนเริ่ม play และอยู่อย่างน้อย 1 วินาที รอแต่ละไฟล์จบก่อนต่อ |
| start | `/audio/shared/Whistle Sound Effect Ringtone.mp3` | หลังเลข 1 จบ เปิด counting gate หลังจบ whistle และ pose ยังใช้ได้; ใช้ไฟล์ MP3 นกหวีดเดิมใน shared ไม่เรียก API |
| encourage | `seated-knee-extension/encourage_knee_extension.mp3` | accepted pose + moving + ต่ำกว่า target min ต่อเนื่อง 2 วินาที; หยุดเมื่อถึงเป้าหมาย/ลดเท้า/ท่าผิด และไม่เริ่มใหม่ในช่วงลด |
| rep_completed | `global/rep_count_01.mp3` ถึง `rep_count_20.mp3` | engine จบรอบจริง; ต่อเลขหลังพัก เซตใหม่เริ่ม 1; เกิน maxRep ไม่เล่น/ไม่วน |

ไม่มี event/ไฟล์ `return_to_start` ผูกใช้งาน

## Controller และ lifecycle

`TrainingAudioController` ใช้ Audio element เดียว ไม่มีคิว guidance. ข้อความซ้ำไม่ replay ขณะเล่น และเว้น 5 วินาทีหลังจบ/ยกเลิก ข้อความใหม่แทนข้อความเก่า; rep preempts guidance. Async sequence ใช้ token และตรวจเวลาเฟรมล่าสุด/ความพร้อมทุกขั้น `pauseLocally`, close/unmount, reset และเปลี่ยนชุดเสียงหยุด player/sequence. Preview ระหว่างพักไม่พูดใหม่

`unlock` เรียกจากปุ่มเปิดกล้อง/เริ่ม ใช้ไฟล์เลขแบบ muted บน element เดิมเพื่อขอสิทธิ์เสียง. `onerror`, rejected `play`, timeout (`playbackTimeoutMs`) resolve failure ไม่โยนไป engine. เมื่อปิดเสียงยังแสดง countdown 5 วินาทีโดยไม่เล่นเสียง การล้มเหลวของเสียงอาจรอ timeout แต่ไม่ทำให้กล้องหรือการนับเสีย

ตั้งค่าใช้ cookie ฝั่ง server เป็น initial props ของ provider ทั้ง SSR/client ครั้งแรกตรงกัน ไม่มี window/localStorage/navigator ระหว่าง render ค่าเสียงเริ่มเปิด/หญิง; เปลี่ยนค่าใน dialog การแสดงผลเดิม cookie อายุหนึ่งปี ไม่เก็บใน DB

## เพิ่มเสียง/ท่าใหม่

1. ใส่ไฟล์ทั้งสอง voice ใน global ถ้าใช้หลายท่า มิฉะนั้นใส่โฟลเดอร์เฉพาะท่า ตรวจ basename/content จริง อย่าเดา path
2. เพิ่ม catalog และ semantic event จาก snapshot/event ของ engine เดิม ระบุ play/cancel/priority ไม่ใช้ช่วงมุมใหม่ใน audio
3. สร้าง adapter ของท่า แยกเงื่อนไขคำแนะนำ แต่ใช้ `TrainingAudioController`, global readiness/numbers และ settings เดิม
4. ต่อ route ตาม exercise code ใน PoseCamera; reset เมื่อ stream/side/set เปลี่ยน คง reps เมื่อพัก
5. เพิ่ม path tests และ fake-media tests; ทดสอบเสียงจริงบนอุปกรณ์ ก่อนอ้างว่าทำงานบน iPad

## ตรวจปัญหาและอุปกรณ์

- 404: เปิด Network ดู Request URL แล้วเทียบ `soundPath` กับไฟล์จริง เช็ก case, global/ท่า และไม่ใช้ `/public/…`
- ซ้อน/เล่นซ้ำ: ตรวจว่าใช้ player เดียว ตรวจ `current`/priority/cooldown และ reps เพิ่มจาก engine เท่านั้น ไม่มี TTS/Audio element ตัวที่สอง
- Autoplay blocked: เปิดกล้อง/เริ่มจาก gesture, ตรวจ rejected play, ลองกดเริ่มใหม่หลังสลับ voice; ไม่ตั้ง autoplay อัตโนมัติ
- คิวเก่าค้าง: ไม่มี guidance queue; ตรวจ token/reset และ `sound.paused` หลังพัก/ออก ห้ามต่อ countdown เก่าหลัง tracking หลุด
- มือถือ/iPad: เปิด HTTPS ที่เชื่อถือ certificate, อนุญาตกล้อง, เปิดการแสดงผลเลือกเสียง/เปิดเสียง; ทดสอบ intro, จัดท่าจนพร้อม, 5→1/whistle, หลุดกลาง countdown, เหยียดค้าง/ถึงเป้าหมาย/ลด, นับ 1–20/21, พัก/ต่อ/เซตใหม่, ปิดกล้อง/ออก, สลับเสียง/ปิดเสียง, refresh จำค่าและ console hydration

## ผลตรวจ

`node scripts/test-training-audio.mjs` ตรวจ 56 MP3 paths + whistle และ fake player/adapter: priority, duplicate, cooldown, rejected play, mute, ready→5..1→whistle, cancellation, rep continuation และ lowering. ผลเริ่มต้น 77 checks ผ่าน. Physical iPad audio unlock/speaker timing และ human-pose flow ยังต้องทดสอบจริง; unit tests ไม่ยืนยันว่าได้ยินเสียงบนอุปกรณ์

ห้ามแก้เกณฑ์นับ สูตรมุม definition/criteria version หรือ DB เพื่อแก้เสียง เว้นแต่ผู้ใช้สั่งเรื่องนั้นโดยตรง

Chromium browser validation: 69 checks passed (56 MP3 + whistle HTTP URLs, settings persistence across refresh, direct developer load with zero hydration/page errors, actual MP3 currentTime advancing, one intro/open, voice-switch/pause/close cancellation, settings widths 390/834/1194/1440). Camera uses a blank canvas stream and real Full inference; no fabricated landmarks/human exercise verification. Audio was decoded/advanced in browser, not verified audibly on physical speakers.

Final verification: focused lint, standalone TypeScript and production build passed; existing engine 16, readiness 259 and legacy countdown 110 assertions passed. Lowering detection for audio uses cumulative movement high-water minus audioConfig.loweringDelta (1 degree), so a slow return also cancels encouragement. This is audio-only and does not modify engine thresholds. Visibility failure from the accepted-frame quality guard selects visibility guidance; no landmarks selects global missing guidance.

Start signal uses the existing public/audio/shared/Whistle Sound Effect Ringtone.mp3 unchanged (browser metadata duration 5.03873 seconds). Counting starts when this start signal is issued after 1; its audio tail no longer blocks training. No generated WAV remains. Final MP3-path/browser regression passed again after selecting the existing asset.

## Countdown interruption and patient labels (2026-10-12)

`KneeAudio.updatePreparation` never treats completed audio as permission to bypass the current engine: ready returns current allowed. Before readiness is completed, an invalid frame cancels the sequence token/current audio, clears the number and requests the applicable corrective MP3 (posture for งอเข่ากลับสู่ท่าเริ่มต้น, existing camera/visibility/missing prompts for tracking problems). Guidance cooldown remains the existing 5 seconds; no extra voice asset/TTS or stale queue is introduced. When accepted preparation returns, the normal ready → 5..1 → whistle sequence starts again. During actual extension the existing gate still distinguishes preparation from movement; knee-start range is not enforced throughout extension.

PoseCamera uses gate permission plus current trusted non-null angle to feed audio preparation. It displays a countdown number only while that preparation input passes, and marks the countdown view not yet ready. Invalid preparation shows its actual guidance rather than retaining a countdown label. Exercise angle ranges, counters and DB writes are unchanged.

Confirmed code findings: KneeAudio previously returned true once audio-ready even when current allowed was false; posture guidance mapping did not recognize the knee-start corrective message; drawMeasurementLabels was limited to developer mode. The patient canvas now restores the same existing filtered, mirrored angle labels (ลำตัว/เข่า), while developer angle toggle remains supported. These code findings do not identify every cause of the user's physical-camera symptom; real-camera interruption timing remains to verify.

Regression test-training-audio.mjs now includes loss while spoken 5 is pending, corrective posture event, cleared remaining number, cancellation of 4/whistle, restart and current-permission checks after ready. Tests wait for async completion instead of relying on a short fixed delay. Recheck with real camera: hold valid seated posture, leave it during 5, confirm numbers stop/corrective audio plays, then return and confirm a new sequence; repeat for obscured landmarks and with muted audio.


## Fix countdown holding at 1 (2026-10-12)

Confirmed code cause: updatePreparation previously kept remaining=1 and ready=false while awaiting the existing ~5-second whistle MP3 ended promise. Media without an ended event could extend that wait to the controller 20-second timeout; the screenshot alone cannot establish which browser event occurred on the iPad.

Now the completed 5?1 sequence clears remaining and marks audio-ready when issuing the whistle, without awaiting its tail. Current engine permission is still required for counting; the normal gate/movement/counter are unchanged. Pause/reset/unmount still cancel audio. Countdown number play calls have their own audioConfig.countdownAudioTimeoutMs=3000 watchdog (controller play third argument); other sounds retain playbackTimeoutMs=20000. This prevents a missing number-ended event from leaving 1 indefinitely. A timed-out/missing sound does not disable pose processing. Existing numbered MP3/whistle assets are unchanged.

Regression explicitly uses a player that never emits ended for numbers/whistle, verifies remaining=null and permission=true after sequence, and cleans up the still-playing signal. Audio tests 89, readiness 259, engine 16 and lint/typecheck passed. Actual iPad speech timing/countdown completion remains to verify with human camera input.

2026-10-12 encouragement range: audio-only 140?150? inclusive with existing 2-second dwell, once per movement round. Leaving range/quality loss cancels speech and dwell but preserves the spoken latch until the round ends; returning phase never triggers encouragement. Controller 5-second cooldown remains. Regression 96 assertions and lint/typecheck passed; actual iPad speaker timing pending. No exercise/DB criteria change.

## Reset audio and repetitions beyond plan target (2026-10-12)

Confirmed reset bug: discard calls pauseLocally which sets sound.paused=true; successful draft reset retained the camera but did not restore audio state. Successful non-exit reset now calls KneeAudio.resetForNewSet(cameraReady), clears repetition/audio-preparation state and stale guidance cooldown, and resumes guidance only when a stream exists. This does not reload the MediaPipe worker, reopen camera, bypass user mute or replay the intro. Pause/exit remain silent.

The reported maximum refers to repetition count, not knee angle. Inspection found no targetReps cap in RepetitionCycle or PoseCamera correctReps calculation: correctness is computed over every completed record with the same existing criteria. Added overflow regression verifies 8 complete/correct rounds, including rounds beyond a plan target of 5; no angle criteria or DB behavior was changed to fake a fix. If the physical case still differs, capture the peak/quality/torso blocker for the extra round rather than changing the target or upper angle bound without evidence.

Audio 99 checks and engine 18 checks passed; Chromium audio/lifecycle 71 checks includes reset -> corrective guidance resumes with camera retained, direct reload and zero hydration/page errors. Focused lint/typecheck passed. Real iPad/human-pose overflow still requires validation.
