# ท่าเตรียมและมุม realtime: Mock นั่งเหยียดขา รุ่น 3

Current mock is [v4](mock-readiness-v4.md), with wider readiness ranges, timestamp edge grace and test-only debug. This page describes preserved v3 behavior/regressions.

เป็น engineering fixture ของ `demo-knee-extension` เท่านั้น ไม่ใช่เกณฑ์แพทย์ ไม่แก้ `approved-criteria.ts` หรือ implementation ท่าจริง ไม่มี schema migration

## Definition และข้อมูล

`src/lib/pose/exercises/camera-knee-extension.ts` เก็บค่าทดสอบทั้งหมดและ `preparationBySide`; bind เป็น criteria ของข้างที่เลือกผ่าน adapter เดิม:

| ค่า | ทดสอบรุ่น 3 |
|---|---|
| ซ้าย: ไหล่/สะโพก/เข่า/ข้อเท้า/ส้น/ปลายเท้า | 11/23/25/27/29/31 |
| ขวา | 12/24/26/28/30/32 |
| มุมเข่าเริ่มต้น | 80–90° |
| มุมเข่ากลับ | 80–92° (hysteresis) |
| ออกจากจุดเริ่ม | ≥110° และนิ่ง 200 ms |
| เป้าหมาย peak ของรอบที่จบ | 160–170° |
| มุมลำตัว–ต้นขา | 80–100° |
| ต้นขา/ลำตัวเอียงจากแนวนอน/แนวตั้ง | ≤15° |
| ท่าเตรียมผ่านต่อเนื่อง | 400 ms; counter เดิมยังใช้ 200 ms ในแต่ละ phase |
| ระยะสะโพกจากตำแหน่งเริ่ม | ≤0.025 ของ normalized image |
| ทิศ heel→foot และ hip→knee | ≥0.015 ตาม sign ข้างที่เลือก |
| หลักฐานข้างใกล้: z ของ hip และ knee | ทั้งสอง delta ต้อง >0.015 โดย selected z ต่ำกว่า opposite z |
| ความกว้างสะโพกในภาพเพื่อกรอง frontal | ≤0.18 normalized x |
| ความเชื่อมั่น landmark | criteria.minVisibility เดิม 0.6 รวมคู่ opposite hip/knee ที่ใช้เทียบ z |
| เปลี่ยนคำแนะนำ | รอ 250 ms; ข้อมูลหายแจ้งทันที |
| ขาดช่วงนาน | >maxGapMs 1000 ms ยกเลิก draft แล้วจัดท่าใหม่ |

รุ่น 1 (140–180°) และรุ่น 2 (เริ่ม 75–105°, peak 160–170°) ยังคง definition/checkpoints/results เดิม รุ่น 3 เพิ่ม checkpoint start/peak/return ใหม่ด้วย `npm.cmd run demo:seed` แบบ idempotent รันสองครั้งแล้ว เก็บ metric definitionVersion=1 เดิมเพราะนิยามมุมเข่าไม่เปลี่ยน มุมลำตัวใช้เตรียมท่าใน client ไม่เพิ่ม metric ที่จัดเก็บ การเปลี่ยน criteria ต้อง reload ก่อนเริ่มเซตใหม่ อย่านำ draft ที่ใช้เกณฑ์เก่ามาฝืนบันทึกด้วยรุ่นใหม่

## นิยามและ mirror

ใช้ image-2d เท่านั้น: มุมเข่า hip–knee–ankle จุดยอด knee; มุมลำตัว–ต้นขา shoulder–hip–knee จุดยอด hip ใช้ `jointAngle` เดิมซึ่งคูณ normalized x/y ด้วย image width/height ก่อนคำนวณ ไม่มีการสลับไป world-3d

ขาขวาต้องหันซ้ายใน **ภาพดิบก่อน mirror**; ขาซ้ายกลับด้าน ตรวจจาก heel→foot และ hip→knee ร่วมกับลำตัวตั้งตรงและ near-side z หลายจุด หากมองภาพ preview ที่ mirror ขวาที่หันซ้ายในภาพดิบจะดูเหมือนหันขวาบนจอ Landmark index ยังคงข้างของร่างกาย ไม่สลับตาม mirror ข้อความหลักขอให้ “หันขาขวา/ซ้ายเข้าหากล้อง” ไม่สั่งทิศหน้าจอที่กำกวม

Visibility ไม่ใช่ระยะกล้อง ค่า z/ทิศทางเป็นประมาณการของโมเดลและอาจผิด ไม่ใช้จุดเดียวเดา near side ข้อมูลไม่ชัด/ขัดกันต้องจัดท่าใหม่ “ท่าเตรียมผ่าน” ไม่ยืนยันว่ามีเก้าอี้จริง

## State และผล

`exercises/knee-preparation.ts` เป็น mock gate ไม่ใช่ engine นับใหม่ ตรวจลำดับ landmarks → side profile/depth → torso/thigh/hip stability → knee start → stable time ก่อนส่ง raw knee angle ให้ `RepetitionCycle` เดิม

ระหว่างเคลื่อนไหวไม่บังคับ knee start แต่ยังตรวจร่างกายและข้างเดิม เมื่อ tracking/posture ไม่ผ่าน ระงับ sample และล้าง stability timer ของ phase ด้วย optional `suspend()`; ช่วงสั้นไม่เพิ่มรอบจากเฟรมที่หาย ขาดช่วงนาน interrupt draft แล้วรอท่าเริ่มใหม่ Completed reps ไม่ถูกล้าง ปุ่มพักยัง interrupt draft ตาม flow เดิม ผล peak/AVG/MAX/ความถูกคำนวณจากรอบที่จบจริงตามเดิม

Counter รองรับ optional `returned` range; ไม่มี field นี้ใช้ `start` เหมือนเดิม หลังกลับที่ 91–92° รอบจบได้ แต่ต้องกลับ 80–90° เพื่อ arm รอบใหม่ ฝั่ง recording ตรวจ checkpoint return และ end angle ตาม returned range โดยใช้ fallback start สำหรับนิยามเดิม

## Label และคำแนะนำ

Seated occlusion correction: selected shoulder/hip/knee/ankle determine measurement availability; heel/foot/opposite-leg points determine orientation authorization separately. Missing auxiliary points preserve valid knee/torso angles and visible skeleton, while counting stays blocked with specific guidance. Synthetic tests reproduce this distinction for both sides; they do not establish detection accuracy on real seated people.

Canvas เน้นข้างที่เลือก ไหล่–สะโพก–เข่า–ข้อเท้า; heel/foot ใช้จัดท่าและซ่อน label ระหว่าง active moving ใกล้เข่ามีมุมเข่า ใกล้ hip มีมุมลำตัว–ต้นขา ใช้ข้อมูลจริงและ display-only smoothing เดิม ไม่ส่งค่าที่ smooth ไปนับ/บันทึก มีเส้น skeleton และ tether ยึด label กับจุด

Label counter-mirror ตัวอักษร, clamp ใน image และเลี่ยง label อื่น รวม safe area ที่คำนวณจาก contain/letterboxing กับตำแหน่ง header/control card หากไม่มีพื้นที่พอจะไม่วาดทับปุ่ม มุมใน card ยังอ่านได้ Canvas update ตาม inference; React preparation card throttle 200 ms และแสดง null ทันทีเมื่อจุดสำคัญขาด ไม่แสดงค่าค้าง ขณะ pause/reset/close คืนสถานะ display ตาม flow เดิม

คำแนะนำหลักหนึ่งข้อความใช้ debounce ตาม config ตั้งแต่จัดเฟรม, หันข้าง, หันข้างที่เลือกเข้ากล้อง, หลังตรง/ต้นขาได้ระดับ, งอเข่ากลับ, รอนิ่ง, “ท่าเตรียมผ่าน · พร้อมเริ่ม”, เหยียด และกลับ ไม่มีเสียงใหม่

## ตรวจซ้ำและข้อจำกัด

```powershell
node scripts/test-knee-preparation.mjs
node scripts/test-pose-tracking.mjs
node scripts/test-pose-engines.mjs
node scripts/test-pose-feedback.mjs
node scripts/test-shared-camera-plan.mjs
```

Preparation unit tests ครอบคลุมสองข้าง, frontal, opposite side closer, body tilt, missing shoulder, aspect-correct angles, readiness stability, jitter 90→91, departure alone, successful/incorrect rounds, short/long loss, mirrored text/two angle labels และ legacy v2 isolation ไม่มีภาพคนจริงใน unit fixture

ผลตรวจ: preparation 65, tracking 31, engine 16, feedback 79, shared-plan 15 checks ผ่าน; recording 11 logic / 26 service / 5 API / 227 Chromium browser checks รวม 30 responsive combinations ผ่าน; hydration/lifecycle 50 checks ผ่านทั้งแผนกำหนดข้างและเลือกเอง เปิดตรง/reload/navigation โดยใช้ MediaPipe model จริงกับวิดีโอ blank จำลอง ไม่มีการยืนยันความแม่นยำกับภาพคนจริง Lint/typecheck/build และ skill validation ผ่าน รัน additive demo seed สองครั้งสำเร็จโดยคงข้อมูลเดิม

ต้องตรวจ physical iPad/mobile ทั้งสองแนว: ป้ายตรงข้อต่อและไม่กลับด้าน, far-side occlusion ทำให้เกณฑ์ z ผ่านได้หรือไม่, การหันตามภาพดิบ, ขยับสะโพก/ยกต้นขาแล้วระงับ, ไม่บังคับ knee start ระหว่างเหยียด, กลับครบแล้วนับครั้งเดียว, pause/resume/reset/save รวม stale angle เมื่อหลุดเฟรมและการเปลี่ยนหน้าทุกแบบ ยังไม่ได้ทดสอบอุปกรณ์จริงหรือเกณฑ์คลินิก
- Filtering update: [pose-smoothing.md](pose-smoothing.md) now defines the shared single-EMA measurement/render/count pipeline. The earlier raw-count/display-only smoothing descriptions below are historical; preparation thresholds and angle definitions remain the same.
