# Config และ logic รายท่า

ล่าสุด Mock v3 เพิ่ม optional preparationBySide/returned ใน definition โดย bind เป็น preparation ของข้างเดียว และใช้ gate แยกครอบ counter เดิม เฉพาะ `demo-knee-extension`; ไม่ใช่ clinical registry ดู [knee-preparation-test.md](knee-preparation-test.md) ค่า v2 ด้านล่างเป็นประวัติ

ข้อกำหนด Mock ล่าสุดใช้ `correctPeak: { min: 160, max: 170 }`, criteriaVersion 2 และ metric definitionVersion 1 เปลี่ยนเฉพาะ fixture; v1 140–180° แยกไว้เป็น legacy config/checkpoints เพื่อคงผลเดิม Seed เพิ่ม v2 ไม่เขียนทับ v1 engine นับรอบเหมือนเดิมไม่ต้องถึงเป้าหมายจึงนับ ส่วนความถูกใช้ peak ของรอบที่จบแล้ว

Skeleton แสดงเส้นเชื่อมจริงตาม MediaPipe POSE_CONNECTIONS แล้ว ตั้ง `overlay-config.ts.showConnections` และ `connectionWidth` (ค่าเริ่มต้น 6 พิกเซล canvas) เส้นและจุดใช้สีสถานะเดียวกันและขอบเข้ม ข้อความเดิมด้านล่างที่ระบุว่ามีเฉพาะจุดถูกแทนที่โดยการอัปเดตนี้ ไม่เปลี่ยนการนับหรือเกณฑ์ของท่า

## ตำแหน่งไฟล์

- `src/lib/pose/overlay-config.ts`: ตั้งขนาดจุด (`landmarkRadius`), สี (`landmarkColor`), ความทึบ (`opacity` 0–1), เปิด/ปิดจุด (`showLandmarks`) ใช้ร่วมกันทุกท่าที่ผ่าน PoseCamera ปัจจุบันวาดเฉพาะ landmarks ไม่มีเส้นเชื่อม ขนาดเป็นพิกเซล canvas ตามความละเอียดกล้อง ไม่ใช่ CSS pixel และไม่เกี่ยวกับเกณฑ์นับหรือฐานข้อมูล
- `src/lib/pose/draw-overlay.ts`: renderer กลาง แสดงจุดจริงจาก MediaPipe และใช้ config กลาง ไม่ต้องแก้หน้ากล้องรายท่า

## สีตามสถานะการเคลื่อนไหว

`overlay-config.ts.statusColors` ตั้งสีแดง (`invalid-start`), เหลือง (`ready`), เขียว (`target-reached`), เทา (`tracking-lost`) ทุกท่าใช้ renderer เดิม มีขอบเข้มช่วยให้เห็นบนภาพสว่าง/มืด ยังคงเป็นจุด landmarks ไม่มีการเพิ่มเส้นหรือเปลี่ยนขนาด

ตัวนับให้ snapshot phase/completedReps แบบอ่านอย่างเดียว ผ่าน `RepetitionCounter.movement` ส่วน engine สร้าง feedback แยก (`angle-return-feedback.ts`) ซึ่งใช้ start/correctPeak/minVisibility/stableMs/maxGapMs จาก criteria เดิม ไม่มีเกณฑ์มุมใหม่ใน UI สีแดงใช้เฉพาะ phase เตรียมรอบที่ไม่อยู่ช่วงเริ่ม เหลืองเมื่อพร้อมหรือกำลังเคลื่อนไหวยังไม่ถึงเป้าหมาย สีเขียวต้องถึงช่วงเป้าหมายนิ่งตาม stableMs และค้างตลอดการกลับจน engine ยืนยันรอบเสร็จ จากนั้นกลับเหลือง

tracking ที่วัดไม่ได้/ไม่ชัด/หลุดเฟรมเป็นเทาทันที ก่อนสถานะอื่น เมื่อข้อมูลกลับมาอ่าน phase ปัจจุบันของ engine: หาก engine interrupt เพราะ tracking หาย ต้องตั้งท่าเริ่มใหม่ ไม่กู้รอบหรือสีเขียวจาก draft ที่ถูกทิ้ง ถ้าถึงเป้าหมายแค่เฟรมเดียวสีไม่เปลี่ยนเขียว แต่เกณฑ์นับ/ความถูกต้องบันทึกยังคงเดิม (สถานะแสดงผลไม่ใช่ผลประเมินที่จัดเก็บ)

ก่อนเริ่มหรือขณะพักมีตัวนับ preview แยกเพื่อแสดง phase เท่านั้น ไม่เพิ่มจำนวนครั้งบนหน้าจอหรือส่ง DB การพัก/สลับ criteria ล้าง feedback การวัด/ข้อความ/เสียง/ผลบันทึกไม่เปลี่ยน ใช้ `node scripts/test-pose-feedback.mjs` ตรวจสีและเปรียบเทียบ repetition payload ทุกเฟรมกับ counter เดิม

- `src/lib/pose/exercises/<exercise>.ts`: config รายท่า ได้แก่รหัสท่า, engine, landmarks ซ้าย/ขวา, coordinate system, ช่วงมุมเริ่ม/กลับ, มุมออกจากเริ่ม, ช่วงมุมที่ถูก, เวลานิ่ง, visibility และ versions
- `src/lib/pose/exercises/registry.ts`: catalog config แยกตามรหัสท่า ไม่ใช่การอนุมัติหรือเปิดสิทธิ์ใช้งาน
- `src/lib/pose/exercise-definition.ts`: bind config กับ metric/checkpoint IDs จาก DB เป็น `PoseCriteria` ที่ส่งให้ client ได้ ไม่มี function/Prisma/browser API ใน payload
- `src/lib/pose/engines/angle-return.ts`: engine วัดมุมสามจุด, เริ่ม → ออกจากเริ่ม → กลับ, ตรวจรอบครบและความถูกต้อง กล้องและ server ใช้ engine เดียวกัน
- `src/lib/pose/engines/registry.ts`: interface ตัวนับและ engine; engine ที่ไม่รู้จักถูกปฏิเสธ config เก่าที่ไม่มี engine ใช้ angle-return เพื่อความเข้ากันได้
- `src/components/app/pose-camera.tsx`: entry กล้องกลาง ใช้ implementation เดิมใน knee-camera.tsx เพื่อรักษา lifecycle/pause/save/UI
- `src/lib/pose/approved-criteria.ts`: registry เกณฑ์ท่าจริงที่ผ่านการยืนยัน ยังคงเดิม ไม่ใส่ Mock หรือเกณฑ์สมมติลงไป

ท่าทดสอบปัจจุบันย้าย config ไป `exercises/camera-knee-extension.ts` แล้ว `camera-test-adapter.ts` เป็น compatibility adapter ที่ bind เฉพาะรหัสทดสอบ การแก้ config ไม่แก้ท่าจริงของเพื่อน

## เพิ่มท่าใหม่ที่ใช้มุมเพิ่มแล้วกลับ

1. สร้างไฟล์ config ตาม `ExerciseDefinition` ใน exercises/ ใช้รหัสท่าที่มีใน DB และกำหนด landmarks ของท่านั้น ไม่คัดลอกค่าทดสอบเป็นเกณฑ์ทางคลินิก
2. ลงทะเบียนใน exerciseDefinitions แล้วใช้ `bindExerciseCriteria(definition, side, { metricId, checkpointIds })` โดยใช้ IDs/versions จริงที่สอดคล้องกับ metric/checkpoint ใน DB
3. เมื่อท่าจริงและเกณฑ์ได้รับการยืนยัน ให้นำ criteria ของซ้าย/ขวาเข้าจุด approvedPoseCriteria เดิม หน้ากล้องเลือก component กลางอัตโนมัติตาม registry ไม่ต้องเพิ่มชื่อท่าใน route อีก
4. ตรวจ full cycle/ไม่ครบ/ไม่เข้าเกณฑ์/ข้อมูลหาย/pause/ownership/save และรักษาประวัติ versions เดิม หากต้องเปลี่ยน schema ต้องขออนุมัติตาม AGENTS.md

## เพิ่มวิธีเคลื่อนไหวอีกแบบ

ขณะนี้รองรับ engine `angle-return` แบบมุมเพิ่ม ไม่ใช่ทุกชนิดของท่า หากท่าใหม่เป็นมุมลด, ต้องค้าง, วัดแนวดิ่ง หรือประเมินหลายมุม ให้เพิ่ม engine แยกใน engines/ และลงทะเบียนพร้อมชนิด `PoseCriteria.engine` โดย implement `createCounter`, `measure`, `confidence`, `validCriteria`, `complete`, `correct` ไม่แก้ engine เดิมให้กระทบท่าอื่น

interface และผลบันทึกปัจจุบันรองรับมุมสามจุดหนึ่ง metric และ checkpoint start/peak/return เท่านั้น การเพิ่มหลาย metric/แกนอ้างอิงต้องขยายสัญญา validation/persistence ให้สอดคล้อง DBML ก่อน ไม่ใช่เพิ่มชื่อ engine แล้วใช้งานได้ทันที ฝั่ง server ยังตรวจ ownership, versions, DB metric/checkpoint และข้อมูลรอบ ไม่เชื่อ config/ผลถูกจาก client

MediaPipe model/worker/camera tracks/pause/save เป็นส่วนกลาง ไม่สร้างใหม่ต่อท่า ไม่มี schema migration และยังไม่เพิ่ม implementation ท่าจริงใด

## ตรวจสอบ

`node scripts/test-pose-engines.mjs` ตรวจ config สองท่าที่มี landmarks/เกณฑ์ต่างกัน รอบครบแต่ผิดเกณฑ์ การพัก การ reset แยกตัวนับ การไม่แก้ config ต้นฉบับ และ engine ไม่รู้จัก fixture ท่าที่สองอยู่ในสคริปต์เท่านั้น ไม่เผยแพร่หรือ seed ลง DB

การทดสอบนี้เป็นโครงสร้างและ logic ไม่ยืนยันกล้องคนจริงหรือ iPad จริง
