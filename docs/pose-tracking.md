# Tracking และ Label จุดวัดในห้องแคบ

## ขอบเขต

MediaPipe Pose ประมาณตำแหน่งข้อต่อ ไม่ได้จำแนกขาโต๊ะ/เก้าอี้เป็นหมวดวัตถุแยก การจับผิดในฉากรกอาจยังเกิดแม้ confidence สูง จึงไม่ถือว่าป้ายชื่อ/เปอร์เซ็นต์ยืนยันว่าเป็นอวัยวะจริง และไม่รับประกันว่าตัวกรองนี้แก้เฟอร์นิเจอร์ได้ทุกกรณี ยังไม่ได้ทดสอบห้องผู้ใช้หรือ physical iPad

## การปรับ

- `src/lib/pose/tracking-config.ts`: ตัวกรองทางวิศวกรรมส่วนกลาง ไม่ใช่เกณฑ์ทางคลินิก ตั้ง detection/presence/tracking confidence 0.65 ตาม option ของ [MediaPipe Web Pose Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js) โมเดลยังเป็น lite เดิม ไม่โหลดระบบใหม่
- `tracking-quality.ts`: ใช้จุดวัดจริงจาก `PoseCriteria.landmarks` ตามท่า/ข้างและ `minVisibility` เดิม ตรวจ finite, ขอบเฟรม, เวลาเฟรม และการกระโดด พิกัดต้องต่อเนื่อง 300 ms ก่อนใช้วัด; gap เกิน 500 ms หรือการกระโดดเกิน `0.04 + 1.5 × dt(seconds)` ของพิกัด normalized ต้องยืนยันใหม่ ค่าเหล่านี้ปรับได้ใน config และอาจปฏิเสธการเคลื่อนไหวเร็ว/การขยับกล้อง ให้ทดสอบจริงก่อนปรับ
- เฟรมที่ไม่ผ่านส่งมุม null ให้ counter เดิม ทำให้ยกเลิกเฉพาะ draft ของรอบนั้น ไม่ล้าง completed repetitions ห้ามนำค่าก่อนหลุด tracking มานับต่อ ไม่มีการเปลี่ยนเกณฑ์มุมหรือ schema
- `PoseDisplaySmoother`: ลดความสั่นด้วย exponential smoothing 80 ms เฉพาะ x/y ที่ใช้วาด ใช้ visibility ปัจจุบัน และ reset เมื่อ tracking ไม่ผ่าน/ปิดกล้อง ไม่แก้ points ต้นฉบับ มุม/per-repetition peaks/ข้อมูลบันทึกยังมาจาก raw landmarks ของเฟรมที่ผ่านตัวกรอง
- `draw-overlay.ts`: ซ่อนจุดและเส้นที่ visibility/presence ต่ำกว่า `overlay-config.minDisplayVisibility` (0.6) จึงไม่ลากเส้นจากจุดที่ไม่น่าเชื่อถือ
- `landmark-labels.ts`: ติดชื่อเฉพาะ `criteria.landmarks` ไม่ hardcode ว่าทุกท่าใช้เข่า เช่น ซ้ายใช้ 23/25/27 → สะโพกซ้าย/เข่าซ้าย/ข้อเท้าซ้าย ขวาใช้ 24/26/28 ป้าย counter-mirror ตัวหนังสือให้ไม่กลับด้านตาม canvas และ clamp อยู่ในเฟรม
- `vis` คือ landmark visibility/confidence ที่โมเดลรายงาน ไม่ใช่เปอร์เซ็นต์ความแม่นยำหรือโอกาสว่าเป็นขาคน ขณะรอยืนยันมี “รอนิ่ง” จุดที่หาย/visibility ต่ำไม่ติดป้ายที่ตำแหน่งเดา และแสดงรายชื่อจุดกับค่า vis ในการ์ดจัดกล้องแทน
- Label เปิด/ปิดและขนาด/สีปรับที่ `overlay-config.ts`: `showMeasurementLabels`, `labelFontSize` (หน่วย pixels ของวิดีโอต้นฉบับ), `labelBackground`, `labelColor` ไม่มีการเก็บ video/landmarks รายเฟรมลง DB

## ตรวจแล้วและต้องตรวจต่อ

`node scripts/test-pose-tracking.mjs` ผ่าน 31 checks: ข้างซ้าย/ขวา, low visibility, jump, gap, เวลาไม่เรียง, หลุดเฟรม, acquire ใหม่, รอบปกตินับได้, draft ที่ผิดไม่เพิ่มครั้งและคงผลเดิม, labels ตามจุดวัด, mirror ข้อความ, ซ่อนเส้นต่ำกว่า confidence และ smoothing ไม่เปลี่ยน input

Engine isolation 16, feedback 79 ผ่าน; lint/typecheck/build ผ่าน Browser recording regression ใช้ MediaPipe จริงกับ blank synthetic video ผ่าน 227 checks / 30 responsive combinations ไม่ใช่ภาพคนจริง

ตอนลองจริง: เลือกข้างก่อนเปิดกล้อง จัดกล้องด้านข้างให้เห็นสะโพก–เข่า–ข้อเท้าของข้างนั้นครบ เพิ่มแสงและแยกแนวขาที่ฝึกออกจากแนวขาโต๊ะ/เก้าอี้ หาก labels ไปอยู่บนเฟอร์นิเจอร์ให้พักและปรับกล้อง ไม่ถือว่า confidence สูงยืนยันตำแหน่งถูก ตรวจว่าป้ายตรงข้อต่อ ตัวหนังสือไม่กลับด้าน จุดหายแล้วไม่นับ และกลับมาทำครบ cycle หลัง tracking พร้อม จดว่ากรองแรงจนพลาดครั้งจริงหรือไม่ก่อนปรับ config
# Mock v3 update

For the current demo knee-extension criteria, [knee-preparation-test.md](knee-preparation-test.md) adds a posture gate: short unreliable intervals suspend stability/counting; intervals reaching `maxGapMs` discard the unfinished round. Earlier criteria retain their original behavior. Display labels now focus on the selected shoulder/hip/knee/ankle and two angles; no furniture identification guarantee is implied.

- Latest pipeline: [pose-smoothing.md](pose-smoothing.md) supersedes the display-only EMA and old jump formula below. Current measurements/counts/saved peaks use the same filtered landmarks as rendering; targets remain unchanged.
