# สรุปหลังบันทึกเซต

## ต้นเหตุที่ยืนยันจากโค้ด

เดิม Modal ใช้จำนวนรายการ saved แทนลำดับเซตตามแผน และ recording start สร้างเซตใหม่หลังบันทึกบางส่วน จึงเกิด 4/1 โดยไม่ใช่เซตที่ 4 ตามแผน ไม่มีการ clamp เพื่อซ่อนข้อมูล

`src/lib/recording-service.ts` ใช้ daily exercise lock และ transaction เดิม: start คืน set ID กับ repetitions/elapsedSeconds/baseReps ของเซต saved ที่ยังไม่ครบ ล่าสุดของข้างที่เลือก; save ตรวจ prefix กับข้อมูลจริงก่อน append รอบใหม่ ไม่แก้รอบเดิม retry ที่ตรงกันคืนผลเดิม ส่วน request เก่าหรือ prefix ต่างกันได้ 409 เซตครบแล้วไม่รับการต่อหรือสร้างเซตเกินแผน

จำนวนครั้งที่ทำคือ completed rounds ที่ engine ส่งมา ส่วนครั้งที่ถูกอ่าน is_correct จาก repetitions ตามเกณฑ์เดิม ไม่เปลี่ยน pose engine หรือเกณฑ์ นับความคืบหน้าจากข้อมูล saved เดิม ไม่มี schema/migration ใหม่ เปลี่ยนเฉพาะ note DBML ให้ตรงพฤติกรรม

ผลตอบกลับ SavedSet มี setNumber, targetSets, targetReps, correctReps, setCompleted, exerciseCompleted, dayCompleted โดยลำดับตามแผนต่อข้างแยกจากจำนวนแถวบันทึกและ set_number ใน session

## UI และ lifecycle

การตัดสินใจล่าสุด 2026-10-12: ผู้ป่วยบันทึกเซตที่เริ่มแล้วได้แม้ 0 ครั้งหรือไม่มีรอบใหม่ ลบข้อความ “ยังไม่มีรอบใหม่ที่ทำครบให้บันทึก” และเงื่อนไขบล็อก UI/API แล้ว ไม่ต้องครบเซตจึงบันทึกได้ ประวัติแสดงจำนวนจริง 0 และมุมเป็น null เมื่อไม่มีรอบ ไม่สร้างค่ามุมปลอม การบันทึกไม่เท่ากับการทำครบ Routine

`src/components/app/knee-camera.tsx` คืน prefix เข้า counter เดิมเมื่อเริ่ม/ทำต่อ ส่ง baseReps เพื่อกัน stale save ผลสรุปใช้ response ที่ยืนยันแล้ว การทำต่อกลับพร้อมเริ่ม ต้องกดเริ่ม ไม่เปิดการนับทันที เซต 0 ครั้งกลับมาทำต่อ set ID เดิมได้ การบันทึกซ้ำที่ไม่มีรอบใหม่อัปเดตเวลาจริงของเซตเดิม ไม่สร้างเซตเพิ่ม ระหว่าง Modal พักการนับ หยุดเสียง และไม่แสดง warning ด้านหลัง

`src/components/app/saved-set-summary.tsx` และ `.module.css` แยกบันทึกบางส่วน/ครบเซต/ครบแผน มีปุ่มหลักตามสถานะและดูความก้าวหน้าเป็นปุ่มรอง dialog กลางจอสำหรับ iPad/desktop มือถือวางด้านล่าง ไม่มี drag handle เพราะไม่ได้ลากจริง จำกัดความสูงและเลื่อนเนื้อหาได้ ใช้ theme เดิม ปุ่มอย่างน้อย 56px ไม่ลบ focus outline

ไม่มีระบบเก็บความพยายามที่ไม่สำเร็จแยกจาก completed round ใน contract เดิม เก็บเซตที่บันทึก 0 ครั้งพร้อม elapsed จริงได้ โดยไม่มี repetition/metric/checkpoint ปลอม ผลเก่าไม่ถูกลบ: audit ก่อนแก้พบ saved 10 รายการ โดยเป็นศูนย์รอบ 4 และบางส่วน 4 ไม่รวม/ล้างข้อมูลเหล่านี้อัตโนมัติ

## ตรวจสอบ

- `scripts/test-routine.mjs`: PostgreSQL 39 checks รวม partial 2/5 → 5/5 set ID เดิม, prefix IDs ไม่เปลี่ยน, concurrent retry, stale request, correctness แยก, zero save/retry/resume/no-new-round elapsed, surplus reps, เซตถัดไป, ทั้งสองข้าง, วันและประวัติ แยกผู้ป่วย cleanup เฉพาะ fixture
- `scripts/test-recording.mjs`: regression recording/API/browser ปรับ expectation ให้ partial resume และ reset รักษาผลยืนยันแล้ว
- Chromium ตรวจ presentation fixture ของ Modal 49 checks บน 390×844, 820×1180, 1180×820, 1440×900 ทั้งสามสถานะ ตรวจเปิดตรงและ refresh ไม่พบ hydration warning ไม่ใช่การยืนยันการเคลื่อนไหวมนุษย์
- ต้องตรวจบนมือถือ/iPad จริง: บันทึกบางส่วน → ทำต่อเซตนี้ → กดเริ่ม → บันทึกครบ → ดูความก้าวหน้า/ประวัติ พร้อมตัวอักษรใหญ่ โหมดสี แนวนอน และแถบ browser ยุบ/ขยาย

ผล regression: recording 11 logic / 23 service / 7 API / 227 browser checks ผ่าน (30 ขนาดจอ/ธีม/ขนาดตัวอักษร); TypeScript และ production build ผ่าน audit หลัง cleanup ยัง saved 10 / zero 4 / partial 4 เท่าเดิม คำสั่ง lint ปกติรวม worktree และ generated artifacts ใต้ output จึงตรวจซ้ำด้วย `npm run lint -- --ignore-pattern 'output/**'` แทน ไม่ถือว่า build ผ่านยืนยันกล้องบน iPad จริง

ไม่แตะ UI/layout/routes ของแพทย์ และไม่เปลี่ยน logic ท่าจริงของเพื่อน
