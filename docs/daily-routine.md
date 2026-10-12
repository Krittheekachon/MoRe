# การบันทึกและ Routine ประจำวัน

วิธีจำลองวันที่ปัจจุบัน: [เครื่องมือทดสอบผู้ป่วย](patient-test-tools.md) ใช้ `?testTools=1` และ override แยกใน encrypted account session แทนไฟล์วันที่ Demo กลาง ข้อความและคำสั่งไฟล์วันที่ด้านล่างเป็นประวัติเดิม ไม่ใช้กับ runtime ปัจจุบัน ปิด override ด้วยปุ่มกลับวันที่จริง/logout หรือปิด flag ฝั่ง server

อัปเดต 2026-10-12: ใช้ PostgreSQL จริงและ schema เดิม ไม่เพิ่มตาราง ไม่เปลี่ยน engine หรือเกณฑ์มุม ท่า mock ยังเป็นข้อมูลทดสอบ ไม่ใช่ผลประเมินทางการแพทย์

## สิ่งที่พบในระบบเดิม

`training-service.ts` สร้างแผนรายวันจากแผนที่มีผลและตารางวันฝึกอยู่แล้ว หน้าหลักและประวัติอ่านฐานข้อมูลจริง `recording-service.ts` บันทึกเซต/รอบ/มุมใน transaction และล็อกรายการรายวันเพื่อป้องกันคำขอซ้ำอยู่แล้ว แต่เดิมใช้จำนวนเซต saved ตัดสินความสำเร็จโดยไม่ตรวจจำนวนรอบ และไม่อนุญาตบันทึกเซตที่เริ่มวันก่อนหลังเที่ยงคืน

## นิยามที่ใช้

- Routine คือชุด `daily_exercises` ของผู้ป่วยใน `rehabilitation_days.local_date` หนึ่งวัน ไม่ใช่ session หรือจำนวนครั้งที่เปิดกล้อง
- สถานะ: ยังไม่เริ่ม / กำลังทำ / ครบตามแผน เมื่อทุกท่าครบทุกข้างตามจำนวนเซตและรอบที่กำหนด
- จำนวนครั้งใช้เฉพาะรอบเหยียด–กลับที่ engine ยืนยันว่าจบ จำนวนครั้งที่ทำถูกแยกจากจำนวนรอบ ไม่บังคับให้ทุกครั้งเข้าเกณฑ์มุมเป้าหมายเพื่อให้ครบจำนวนครั้งตามแผน
- เซตที่ saved มีรอบน้อยกว่า `target_reps` เก็บเป็นประวัติ แต่ไม่ถือว่าครบเซต เซตว่างไม่มีมุม แสดงไม่มีข้อมูล
- ความก้าวหน้าใช้เซตที่มีจำนวนรอบมากที่สุดไม่เกินจำนวนเซตเป้าหมายของแต่ละข้าง: แต่ละเซตมีน้ำหนัก `min(actual,target)/target` เช่น 2/5 ครั้ง = 40% ของหนึ่งเซต ไม่รวมสองเซตที่ทำไม่ครบให้กลายเป็นเซตที่ครบ
- `selected_side=both` ต้องครบซ้ายและขวา ข้างละจำนวน `daily_exercises.target_sets` (รวม sessions_per_day แล้ว) ไม่เอาผลซ้ายมาแทนขวา `null/none` ไม่กำหนดข้าง
- ผลเกินเป้าหมายเก็บทุกเซต/ทุกรอบ แต่ความก้าวหน้าสูงสุด 100% และ Routine สำเร็จได้ 0 หรือ 1 ครั้งต่อวัน คำนวณจากข้อมูล ไม่เพิ่ม counter ทุกครั้งที่บันทึก
- เป้าหมายและข้างใช้ snapshot ใน `daily_exercises` ที่สร้างครั้งแรกของวัน การเลือกแผนใหม่หลังสร้าง snapshot มีผลวันถัดไป ไม่แก้เป้าหมายย้อนหลัง

## ตารางและจุดแก้ไข

| ต้องการปรับ | ไฟล์ / ฟังก์ชัน | ตารางที่เกี่ยวข้อง |
|---|---|---|
| คำนวณ Routine/partial/ทั้งสองข้าง | `src/lib/routine-progress.ts` → `routineProgress` | daily_exercises, exercise_sets, repetitions |
| สร้างเป้าหมายรายวัน/อ่านหน้าหลักและประวัติ | `src/lib/training-service.ts` → `ensureTrainingDay`, `dailyDTO`, `readDailyTraining`, `readRoutineHistory`, `readTrainingHistory` | rehabilitation_plans, plan_exercises, plan_exercise_weekdays, rehabilitation_days |
| เริ่ม/พัก/ยกเลิก/บันทึกและ retry | `src/lib/recording-service.ts` → `createRecordingService`, `lockDaily`, `progressFor` | exercise_sessions, exercise_sets, repetitions, repetition_metrics, repetition_checkpoint_results |
| เก็บข้างของ session แม้ไม่มีรอบ | `recording-service.ts` → `start` | camera_checks: selected_side, feedback_code=side_selected, is_ready=false (ไม่ได้อ้างว่าผ่าน readiness) |
| สรุปมุม/ผลที่บันทึก | `src/lib/results-service.ts`, `src/components/app/results-views.tsx`, `knee-camera.tsx` | MAX/AVG ของ peak_angle_deg ต่อรอบ ไม่ใช่ทุกเฟรม |
| นิยามวันและวันที่จำลอง | `src/lib/training-calendar.ts` → `trainingDay`; `src/lib/routine-clock.ts` → `routineNow` | rehabilitation_days.local_date |
| ตรวจเปลี่ยนวันเมื่อเปิดค้าง | `src/components/app/training-day-refresh.tsx` → `TrainingDayRefresh`; patient page; `/api/patient/training/today` | อ่านวันที่จาก server |

บันทึกผูกกับ patient → day → daily exercise → session → set เสมอ ข้างล็อกตาม session ผ่าน camera_checks และตรวจซ้ำตอนบันทึก/retry เก็บมุมเริ่ม/สูงสุด/กลับ ข้าง เวลาครบรอบ และเวอร์ชันตาม engine เดิม คำขอซ้ำ payload เดิมคืนผลเดิม; payload ต่างกันตอบ conflict; สิทธิ์ผู้ป่วยตรวจฝั่ง server

## วันใหม่และข้ามเที่ยงคืน

แบ่งวันที่ด้วย Asia/Bangkok ฝั่ง server; local_date เป็น date label ไม่ใช้ timezone ของอุปกรณ์ วันใหม่มี snapshot ใหม่และผลเริ่ม 0 ประวัติเก่าไม่ถูกลบ เซตที่เริ่มก่อนเที่ยงคืนและบันทึกหลังเที่ยงคืนนับวันเริ่มเซต โดยคง daily exercise ID เดิม เวลาเริ่ม/บันทึก/ระยะเวลายังเป็นเวลาจริง ไม่เลื่อน timestamps ตามวันที่จำลอง เริ่มเซตใหม่ของวันเก่าไม่ได้

หน้าผู้ป่วยตรวจ `/today` ทุก 30 วินาทีขณะมองเห็น และตรวจอีกครั้งเมื่อ focus/กลับแท็บ หาก server date เปลี่ยนเรียก router.refresh มี cleanup ครบและ initial render เป็น null ทั้ง server/client ไม่ refresh หน้ากล้องระหว่างทำเซตเพื่อไม่ทิ้งรอบชั่วคราว เมื่อออกไปหน้าหลัก/แผนจะอ่านวันใหม่ทันที

## ทดสอบเปลี่ยนวันใน development

ใช้เฉพาะบัญชีสังเคราะห์ที่สร้างด้วย `npm run demo:setup` / `npm run demo:seed` ตาม [demo-ready.md](demo-ready.md) และยืนยันกับ `.demo/manifest.json` อย่าใช้ข้อมูลคนไข้จริง ตัวเลือกนี้เป็นไฟล์ local ของผู้พัฒนา ไม่มี query string/localStorage/API ที่ผู้ป่วยใช้ให้สิทธิ์ได้ และ server production เพิกเฉยเสมอ บัญชีผู้ป่วยทั่วไปไม่อยู่ใน manifest จึงใช้วันจริง

```powershell
node scripts/routine-test-date.mjs 2026-10-12
# ฝึก/บันทึกบางส่วนและครบตามแผนในบัญชี Demo
node scripts/routine-test-date.mjs 2026-10-13
# กลับแท็บหรือรอไม่เกินประมาณ 30 วินาที ตรวจวันใหม่ 0 และประวัติเดิม
node scripts/routine-test-date.mjs off
```

ไฟล์ `.demo/routine-test-date.json` ถูก gitignore; คำสั่งเขียนแบบ atomic เพื่อไม่อ่าน JSON ที่เขียนไม่เสร็จ วันที่จำลองใช้ร่วมกันสำหรับการอ่านแผน/เริ่มเซต/แสดงความก้าวหน้า การบันทึกเซตที่เริ่มแล้วใช้วันใน snapshot เดิม ต้องเลือกวันซึ่งแผนทดสอบมีผล บัญชี dev ไม่บันทึกผลผู้ป่วย: ใช้บัญชี Demo เพื่อทดสอบ persistence

## การตรวจสอบ

อัปเดตการบันทึกบางส่วนและ Modal: อ่าน [saved-set-summary.md](saved-set-summary.md) การทำต่อใช้ set ID เดิมและเพิ่มเฉพาะรอบใหม่ ไม่เพิ่มเซตทุกครั้งที่กดบันทึก ไม่รวมรายการเก่าคนละ set ID อัตโนมัติ

`node scripts/test-routine.mjs` สร้างผู้ป่วย/ท่า software fixture ใหม่สองคนใน PostgreSQL local และลบเฉพาะ fixture เมื่อจบ ตรวจ partial, retry พร้อมกัน, วัน Bangkok, ข้ามเที่ยงคืน, ผลเกินเป้าหมาย, snapshot, ทั้งสองข้างและการแยกผู้ป่วย ไม่มีภาพ/landmark ปลอมในหน้าฝึก

เปิด Chromium ของ Playwright CLI session `more-recording` ที่ HTTPS local แล้วรัน:

```powershell
$env:MORE_ROUTINE_BROWSER="1"
node scripts/test-routine.mjs
```

การทดสอบ browser ใช้ fixture เท่านั้น สำรอง/คืน manifest และวันที่จำลองใน finally ตรวจเปิดตรง/refresh/logout-login, รูปแบบมือถือ/iPad/desktop, focus และ polling ข้ามวัน ดู console hydration ประกอบ ผลรอบเป็น software fixture ไม่ใช่การยืนยันความแม่นยำทางการแพทย์

บนมือถือ/iPad จริง: เปิด HTTPS ตาม [camera-test-mode.md](camera-test-mode.md) บันทึกเซตบางส่วน → ตรวจข้อความยังไม่ครบ → ฝึกจนครบ → refresh/logout-login → เปลี่ยนวันตามคำสั่งและกลับแท็บ → ตรวจวันใหม่ 0 กับประวัติเก่า; ทดสอบกล้อง/การนับจริงและ toolbar ต่อ ยังไม่ได้ตรวจบน iPad จริง

ผลตรวจครั้งนี้: PostgreSQL 26 checks, Chromium Routine 22 checks และ clock policy 3 checks (Demo/development, ผู้ป่วยทั่วไป, production), hydration 0 warnings; recording regression 11 logic / 26 service / 7 API / 227 browser checks ผ่าน TypeScript และ production build ผ่าน lint ไม่มี error มี warning เดิมหนึ่งรายการใน test-nav-debug-browser.js ข้อมูลก่อน/หลัง cleanup เท่ากัน: 8 ผู้ป่วย, 11 แผน, 16 วัน, 16 daily exercises, 6 saved sets, 11 repetitions ไม่ลบประวัติเดิม
