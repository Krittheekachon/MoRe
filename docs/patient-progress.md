# ความก้าวหน้าผู้ป่วย

## Flow และภาพอ้างอิง

`/patient/progress` เป็นภาพรวมตามภาพแรก: ชื่อ/วันที่, วงแหวนความคืบหน้า, จำนวนวันทำครบแผนต่อเนื่องถึงวันที่เลือก, สรุปเซต/ท่า และรายการตาม Module จริง ปรับสี/component/typography ให้ตรงระบบปัจจุบัน ไม่คัดลอกข้อมูลหรือสีตัวอย่าง

ดูรายละเอียดส่ง **daily exercise ID** ไป `/patient/progress/exercises/ID` ภาพ 2–3 เป็นส่วนกราฟและผลรายเซตในหน้าเดียว เลื่อนหรือกดลิงก์กราฟ/รายละเอียดได้ ปุ่มกลับรักษา date ใน URL และ scrollY แบบ optional sessionStorage (อ่านเฉพาะ effect; ไม่ใช้กำหนด SSR/สิทธิ์) ครอบคลุมผู้ไม่มีผลฝึกด้วย ไม่ต้องมี session จึงเปิดรายละเอียดได้

## ข้อมูลจริงและนิยาม

`src/lib/patient-progress.ts` → `readPatientProgress` อ่าน snapshot `daily_exercises` และวันที่ `rehabilitation_days.local_date` Asia/Bangkok พร้อม saved sets/repetitions/primary angle metrics/camera checks จาก Prisma เดิม ไม่แก้ DB/schema/engine ไม่แก้หน้าหรือ component ประวัติของแพทย์

- จำนวนครั้งที่ทำ: จำนวน completed rounds ที่บันทึกจริง รวมรอบเกินเป้าหมาย
- จำนวนครั้งถูก: repetitions.is_correct เดิม
- เซตครบ/เป้าหมาย/เปอร์เซ็นต์: `routineProgress` เดิม รวมทุกข้างโดยไม่เอาจำนวน session หรือ saved rows มาแทนเซตครบ
- ช่วงแบ่งเข้ามาฝึก: session ที่มี saved set จริง แยกจากเซตตามแผน
- Partial ทำต่อใน set ID เดิมอ่านยอดสะสมครั้งเดียว รายการ partial เก่าคนละ ID ไม่รวม/แก้ย้อนหลังอัตโนมัติ รายละเอียดบอกช่วง/ID และ ordinal ต่อข้างตามจำนวนเซตที่ครบก่อนหน้าอย่างเปิดเผย ไม่ clamp เพื่อซ่อนข้อมูลเก่า
- ค่าเฉลี่ยมุม: รวม **peak ของแต่ละ repetition** หารจำนวนค่าที่บันทึกจริง ไม่เฉลี่ยทุกเฟรมหรือเฉลี่ยค่าเฉลี่ยช่วงแบบน้ำหนักเท่ากัน แยก metric ID/version/side ใช้ primary metrics เท่านั้น ไม่มีมุมแสดง “—” ไม่มีรอบเป็น 0 ครั้ง ไม่ใช้ 0° แทนมุมหาย
- ผลทดสอบกล้องรวมเป็นผลฝึกในหน้าผู้ป่วย ไม่มีปุ่มแยกจริง/ทดสอบ เก็บ metadata เดิมไว้แต่ไม่ใช้กรองการแสดงผล
- กราฟ: จำนวนรอบที่บันทึกแต่ละวันของ exercise code ที่เลือก ช่วงย้อนหลัง 7/30/90/365 วันถึงวันของรายการ selected ไม่สร้างจุดศูนย์แทนวันที่ไม่มีข้อมูล แสดงค่ารายวันแบบอ่านได้เพิ่มเติม
- ข้อมูล “แนวโน้ม +xx%” ในภาพไม่มีสูตรที่กำหนดในระบบ แสดง empty state “ยังไม่มีข้อมูลแนวโน้ม” ไม่สร้างเปอร์เซ็นต์หรืออ้างการประเมินทางคลินิก วันล่าสุดคำนวณจากข้อมูลบันทึกจริงในช่วง
- Streak ระบุชัดว่าทำครบทุกท่า/ข้างต่อเนื่องจนวันที่เลือก หากวันที่เลือกยังไม่ครบจะแสดง 0 ไม่ใช้เปอร์เซ็นต์จากภาพตัวอย่าง

## Routes / สิทธิ์ / freshness

`GET /api/patient/progress` และ `GET /api/patient/progress/ID` ใช้ trainingGet/currentAccount เดิม patient-only, Cache-Control no-store ไม่รับ patient ID จาก client ID ของคนอื่นได้ 404 ไม่ส่งรหัสผ่าน/session/national ID

หน้า server ใช้ requirePatient และ ownership query เดียวกัน เปิด URL ตรง/refresh ได้ Loading อยู่ใน patient route, empty state ตามข้อมูล และ error พร้อมลองใหม่จาก TrainingFailure เดิม

Modal “ดูความก้าวหน้า” ปิดการนับ/เสียง/camera tracks แล้วรอ Promise จาก **runtime dispose เดิม** (worker closed acknowledgement หรือ fallback terminate 500ms เดิม) ก่อน full navigation เพื่ออ่านข้อมูล server ใหม่ ไม่ใช้ RSC ของหน้าที่เคยเปิดก่อนบันทึก ยังคง pagehide/unmount cleanup เดิม และ single-flight navigation guard ไม่เปลี่ยน inference/counting

## ไฟล์

- `src/lib/patient-progress.ts`: query/DTO/aggregate/ownership
- `src/components/app/patient-progress.tsx`, `.module.css`: overview/detail/chart/filters/scroll restoration/responsive theme
- `src/app/patient/[[...segments]]/page.tsx`, `loading.tsx`: patient routing/empty-error-loading
- `src/app/api/patient/progress/route.ts`, `[id]/route.ts`: patient APIs
- `saved-set-summary.tsx`, `knee-camera.tsx`, `src/lib/pose/runtime.ts`: latest-data navigation และรอ resources คืนครบ
- `scripts/test-routine.mjs`, `scripts/test-patient-progress.mjs`, `scripts/test-patient-progress-browser.js`, `scripts/test-recording-browser.js`: temporary fixture checks

## ตรวจสอบ

`node scripts/test-routine.mjs` ตรวจ PostgreSQL 44 checks รวม partial → full set เดิม/weighted average/owner isolation/zero/missing angles/multiple sets/days/both sides การทดสอบ browser เพิ่มด้วย `MORE_PROGRESS_BROWSER=1` และ Playwright CLI session `more-recording` บน HTTPS local: overview→ID detail→refresh→back filters, รวม test/real และละเลย scope เก่า, ID คนอื่นถูกปฏิเสธ, 24 viewport/theme/font combinations (มือถือ/iPad portrait/landscape/desktop), hydration 0 warnings มีภาพหน้าจอจริงใน output/playwright สำหรับตรวจ UI ข้อมูลเป็น fixture ระบุชื่อ ไม่ใช้แทนข้อมูลคนไข้ใน implementation

Recording regression ใช้ MediaPipe Full จริงกับ blank synthetic stream เพื่อตรวจการคืน worker/track ผ่านลิงก์ Modal ไม่ได้ยืนยันการเคลื่อนไหวมนุษย์ ต้องตรวจ iPad/มือถือจริงต่อ: ฝึกบางส่วน→บันทึก→ดูความก้าวหน้า→ทำต่อ→กลับรายละเอียด, toolbar ยุบ/ขยาย, ตัวอักษรใหญ่, มุมหาย, เปลี่ยนวัน และประวัติเดิม

Latest decision: camera-test results count as training in patient progress. Removed real/test switcher and presentation filtering; legacy scope URLs are ignored. Existing metadata, recording and engine criteria remain unchanged. TypeScript check passed.

กราฟมีตัวกรอง จำนวนครั้งที่ทำได้ / จำนวนครั้งที่ทำถูก / ทั้งหมด (ค่าเริ่มต้น) โดยทั้งหมดแสดงสองเส้น ไม่บวกยอดซ้ำ ใช้ count/correct ของผลบันทึกเดิม รวมรายวันตาม Asia/Bangkok เส้นทำถูกใช้เส้นประและ legend พร้อมค่ารายวันสำหรับการเข้าถึง ตัวกรองข้อมูลทำงานร่วมกับช่วงเวลา 7/30/90/365 วัน ไม่เปลี่ยน engine หรือฐานข้อมูล

Verified graph filters: Chromium 115 checks (24 responsive/theme/font combinations), PostgreSQL 44 checks, TypeScript and targeted lint passed; zero hydration warnings. No physical iPad verification.

## Previous-day history and chart direction
Chart dates remain chronological (oldest left, newest right) and scale between the first/last recorded date in the selected range. A single recorded day starts at x=45 on the left; missing dates are not invented as zero. Total/correct filters share the same date mapping. Overview now lists all saved daily exercise records in TrainingHistory, newest first; detail lists all saved days for that exercise, independent of graph range. Links use actual owned daily exercise IDs and anchor to results, preserving the overview date in the back link. No API/schema/engine changes.

Verified: PostgreSQL 44 checks, Chromium 119 checks including latest-day to previous-day detail navigation, 24 responsive/theme/font combinations and zero hydration warnings. TypeScript and targeted lint pass. Physical iPad not tested.

Patient display naming (2026-10-13): `exerciseDisplayName` in `src/lib/exercise-display.ts` presents `demo-knee-extension` as “นั่งเหยียดขา - Seated Knee Extension” consistently in training, recent results and progress/history. Stored catalog name, code, criteria, results and doctor UI remain unchanged.
