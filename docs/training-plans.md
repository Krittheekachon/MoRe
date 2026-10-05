# แผนฝึก MoRe: การเชื่อมฐานข้อมูล

## สถานะล่าสุด (2026-10-05)

รอบ Demo ทั้งระบบใหม่กว่า: หน้าหมอเชื่อมการสร้าง/แก้แผนกลางเป็นเวอร์ชันใหม่ ค่าฝึก เซต/ครั้ง/ความถี่/ข้าง/วัน และกำหนดแผนให้คนไข้ผ่าน transaction/retry identity แล้ว สำเนาคนไข้และ daily snapshot เดิมไม่เปลี่ยน การเลือกแผนยัง serialize/reuse แบบเดิม ระบุ configured_by/created_by เป็นบุคลากรเมื่อหมอกำหนด ไม่แอบใช้ ID คนไข้

เพิ่ม catalog/แผน/ประวัติสังเคราะห์ผ่าน seed แยกที่รันซ้ำได้ เกณฑ์ชั่วคราวเฉพาะ `demo-knee-extension` + MORE_DEMO_MODE + DB-bound Demo identity ไม่แตะ 5 ท่าจริงและไม่เพิ่ม schema ประวัติคนไข้และผลฝั่งหมออ่าน saved sets/repetitions/metrics/checkpoints จาก DB จริงแล้ว ไม่มี mock ในเส้นทางที่เชื่อม หน้ารายละเอียดใช้ `/patient/sessions/[id]` และ `/doctor/patients/[id]/sessions/[id]` ตรวจเจ้าของก่อนอ่าน ดู `demo-ready.md` สำหรับ checklist/วิธีเปิด/ผลรวมและข้อจำกัด clinical

งานกล้องต่อยอด: เพิ่ม runtime MediaPipe/state machine/บริการบันทึกเซตใน schema เดิมและทดสอบด้วย fixture แยกแล้ว ดู `camera-recording.md` สถานะกล้องตัวอย่างด้านล่างเป็น milestone ก่อนหน้า ตอนนี้หน้า `seated-leg-raise` เปิด preview/landmarks จริงได้ แต่ยังปิดนับ/บันทึกจนยืนยันตัวท่านั่งเหยียดขาและเกณฑ์ แผนทางคลินิกยังขาด ท่าอื่นยังเป็นตัวอย่างเดิม

เชื่อมแผนกลาง แผนผู้ป่วย รายการรายวัน และทางเข้ากล้องกับ PostgreSQL แล้ว ใช้ `src/lib/prisma.ts` และ auth/session จริงจาก `src/lib/account-session.ts` ไม่สร้างระบบบัญชีซ้ำ ไม่แก้ schema/DBML/migration/package/seed และไม่ reset/commit/push งานที่เคยติดเพราะไม่พบ auth ใน workspace เป็นสถานะเก่า ปัจจุบันใช้ `requirePatient` และ `currentAccount` ได้แล้ว

UI คงโครงขาว/เขียวและองค์ประกอบเดิม ปรับหน้าตัวเลือกเป็นแผนกลางของทีมรักษาแทนการให้คนไข้กำหนดท่าและเป้าหมายเอง เพิ่ม loading/empty/error state ข้อมูล Home/แผน/วันนี้/รายละเอียดท่า/เป้าหมายกล้องมาจากฐานข้อมูล หน้าประวัติ/ความก้าวหน้าแบบเต็มยังเป็นตัวอย่างและมีป้ายกำกับ ไม่อ้างว่าเชื่อมแล้ว

## โค้ดและ API

- `src/lib/training-service.ts`: อ่าน template, เลือกแผน, สร้าง snapshot รายวัน, รวมผล saved, ตรวจรายการก่อนเริ่มกล้อง และอ่านประวัติย่อบน Home
- `src/lib/training-calendar.ts`: วันที่และขอบเขตวัน Asia/Bangkok ไม่อิง timezone ของเครื่องผู้ใช้
- `src/lib/training-types.ts`: DTO ที่ส่งให้ browser ไม่มี credentials หรือข้อมูลคนไข้คนอื่น
- `src/lib/training-api.ts`: ตรวจ session/role/password-change flag และตรวจ ID
- `src/components/app/training-views.tsx`: Home/เลือกแผน/รายการวันนี้/รายละเอียดท่าที่เชื่อมจริง
- `src/app/patient/[[...segments]]/page.tsx`: ตรวจสิทธิ์และโหลดข้อมูลฝั่ง server ก่อนแสดงหน้า
- `src/components/app/camera-view.tsx`: รับ daily assignment จริงและตรวจสิทธิ์ซ้ำก่อนเริ่ม/ทำต่อ ไม่บันทึกผลกล้องในงานนี้

| API | หน้าที่ |
| --- | --- |
| GET `/api/patient/training/templates` | แผนกลางที่เปิดใช้และมีผู้สร้าง doctor/therapist/admin ที่เปิดใช้ |
| GET `/api/patient/training/plan` | แผนปัจจุบันของคนไข้ใน session |
| POST `/api/patient/training/plan` | รับเฉพาะ `templateId`; ตรวจ Origin/JSON และคัดลอกแผน |
| GET `/api/patient/training/today` | อ่าน/สร้าง snapshot ของวันนี้แบบ idempotent |
| GET `/api/patient/training/daily/[id]` | ตรวจเจ้าของและสิทธิ์เริ่มรายการสำหรับกล้อง |

ทุก API ตรวจสิทธิ์ฝั่ง server ไม่รับ patient_id/role/เป้าหมาย/วันที่จาก browser ใช้ no-store และ error ที่ไม่เปิดเผยรายละเอียดฐานข้อมูล หน้ากล้องใช้ `/patient/exercises/[code]/camera?daily=[id]`; รายละเอียดใช้ `guide?daily=[id]` URL เดิมที่ไม่มี query ใช้ได้เฉพาะเมื่อพบรายการของตนในวันนี้ตรงกันเพียงรายการเดียว

## การเลือกแผนและข้อมูลรายวัน

- อ่าน `rehabilitation_templates`, `template_exercises` และ weekdays แล้วคัดลอกลง `rehabilitation_plans`, `plan_exercises` และ weekdays ใน transaction เดียว เก็บ source IDs, side, targets, sessions_per_day, schedule, instructions และ version
- ใช้ row lock ของ patient_profiles เพื่อ serialize การเลือกแผน/สร้างวัน เลือก template เดิมที่เป็นแผน active จะคืนแผนเดิม แม้ส่งพร้อมกันหลายคำขอ ไม่สร้าง plan ซ้ำเมื่อกดซ้ำหรือ reload
- ถ้ามีแผน active ซ้อนกันจะปฏิเสธให้ทีมรักษาตรวจ ไม่เดาเลือกแผนเพื่อสร้างวัน ระบบแก้แผนฝั่งหมอในอนาคตต้องใช้ locking/versioning ที่สอดคล้องกัน
- ก่อนมีแผนจะไม่สร้างวันว่างมาล็อกวันนั้น เมื่อมีแผนแล้ว การอ่านวันนี้ครั้งแรกสร้าง rehabilitation_day และ daily_exercises ตามวันที่/วันในสัปดาห์ที่กำหนด แม้เป็นวันไม่มีรายการก็มี snapshot ว่างและแสดง 0% โดยไม่หารด้วยศูนย์
- เป้าหมายเซตรายวัน = target_sets × sessions_per_day; ครั้งต่อเซตยึด target_reps_per_set ข้อมูล daily เป็น snapshot ไม่เขียนทับเมื่อเปลี่ยนแผน ถ้าวันนี้มี snapshot แล้ว แผนที่เลือกใหม่เริ่มเที่ยงคืนวันถัดไปตามเวลาไทย วันนี้ยังฝึกแผนเดิมได้
- วันใหม่เริ่มผลที่ 0 และใช้แผน/ตารางที่มีผลวันนั้น ไม่ลบหรือเขียนทับประวัติเดิม
- ความคืบหน้านับเฉพาะ exercise_sets.status = saved จากทุก session ของ daily item รวมผลที่ saved แล้วใน session ที่หยุด/ยกเลิก ไม่ใช้ session completed หรือ local demo counters แทนผลจริง ไม่นับ draft/paused/cancelled sets และจำกัดเปอร์เซ็นต์ไม่เกิน 100
- ก่อนเข้ากล้องและก่อนกดเริ่ม/ทำต่อ ตรวจเจ้าของ วันที่ไทย วันยังไม่ปิด ท่า/หมวดยังเปิดใช้ และเซตยังไม่ครบ รายการคนอื่นหรือ code ไม่ตรงตอบ 404 รายการหมดสิทธิ์ตอบ 409
- หากหมอกำหนดข้างไว้ ใช้ข้างนั้น หากท่ารองรับการเลือกข้างและไม่ได้กำหนด ต้องเลือกก่อนเริ่ม ไม่เดาข้างแทนคนไข้

Template ที่มีท่าซ้ำไม่ถูกเสนอหรือคัดลอก เพราะ unique(plan_id, exercise_id, version_number) ของ schema เดิมไม่รองรับสองรายการท่าเดียวกันใน version เดียว ไม่รวมเป้าหมายหรือเปลี่ยน schema โดยพลการ ต้องให้ทีมรักษาแก้ต้นแบบหรืออนุมัติ design ใหม่ก่อน

## ข้อมูลที่ยังขาดและงานค้าง

ฐานข้อมูลจริงหลังทดสอบยังไม่มีแผนกลางที่หมอยืนยัน และไม่มีบัญชีหมอผู้สร้างแผนจริง จึงแสดงสถานะว่างอย่างตรงไปตรงมา Catalog เดิมมี 2 หมวด/5 ท่าและคง `prisma/seed.mjs` ที่รันซ้ำได้ ไม่เพิ่มแผนจากชื่อ mock หรือถือค่า default ของ catalog เป็นคำสั่งรักษา

ต้องได้ผู้สร้างที่มีสิทธิ์ ชื่อแผน รายการท่า ข้างที่ฝึก เซต/ครั้ง ความถี่ วันฝึก และคำแนะนำที่ทีมรักษายืนยันก่อนเพิ่มแผนจริง ไม่ seed ผู้ป่วยหรือเดาเกณฑ์ทางการแพทย์ Fixtures ในชุดทดสอบด้านล่างเป็นข้อมูลทดสอบซอฟต์แวร์เท่านั้น ไม่ใช่ clinical prescription และถูกล้างเมื่อจบ

งานต่อ: clinician Login/จัดการ template, MediaPipe และบันทึกผลกล้องจริง, ประวัติ/ความก้าวหน้าแบบเต็ม กล้องตอนนี้รับเป้าหมายจริง แต่ตัวนับตัวอย่างยังเป็น local runtime และปุ่มบันทึกถูกปิด การเปลี่ยนการแสดงผลขณะพักยังคงพักและไม่รีเซ็ตตัวนับ การเปิด/ปิดหน้ากล้องไม่สร้างผลฝึกปลอม

## วิธีตรวจซ้ำ

ใช้เฉพาะฐานข้อมูลพัฒนาบนเครื่อง และตั้ง `.env` ตาม `accounts-setup.md` ไม่แชร์ credentials เปิด PostgreSQL เดิมและ dev server ก่อน ชุดทดสอบใช้ catalog ที่มีแล้ว ไม่มี reset/migration

```powershell
npm.cmd run dev
npx.cmd --yes --package @playwright/cli playwright-cli -s=more-training open http://localhost:3000
node scripts/test-training.mjs
npx.cmd --yes --package @playwright/cli playwright-cli -s=more-training close
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd run build
git diff --check
```

Runner ใช้ jiti ที่ติดตั้งอยู่แล้วเพื่อเรียก service จริง และ Playwright CLI เพื่อทดสอบ browser สร้างผู้รักษาสังเคราะห์กับคนไข้สองบัญชี/แผนชั่วคราวโดยไม่มีข้อมูลผู้ป่วยจริง ล้างเฉพาะ records ของ fixture ที่สร้างในรอบนั้นตาม foreign keys ใน finally; ไม่ล้างบัญชีจากชุด auth เดิม ไม่พิมพ์รหัสผ่าน/เลขบัตร/session cookie หากรายงาน cleanup failed ให้ตรวจเฉพาะ records ชื่อ MoRe Training Test ก่อนรันซ้ำ ภาพอยู่ใน test-results ซึ่งไม่ส่งขึ้น Git

ผลตรวจจริง: 28 service assertions และ 123 browser assertions ผ่าน ครอบคลุมเลือก/reload, คำขอเลือกและสร้างวันพร้อมกัน, แยกคนไข้สองบัญชี, ปฏิเสธ injection และแผนที่ใช้ไม่ได้, ผล saved หลาย session/ไม่นับ draft, เปลี่ยนแผนแต่คง snapshot, วันใหม่เริ่ม 0/ประวัติเดิมยังอยู่, วันไม่มีรายการ, รายการคนอื่น/วันก่อน/ครบเซต/วันปิดเข้า camera ไม่ได้ และ session ที่ไม่ Login เรียก API ไม่ได้

ตรวจ responsive 96 ชุด: 390/820/1180/1440px × สว่าง/มืด × ปกติ/ใหญ่/ใหญ่มาก × Home/เลือกแผน/วันนี้/กล้อง ไม่มี horizontal overflow ตรวจภาพมือถือ/iPad/desktop ในโหมดมืดตัวอักษรใหญ่สุดด้วย ตรวจ active camera ไม่มีปุ่มตั้งค่าและเปิด/ปิดจากแผงพักแล้วคงพัก/ตัวนับเดิม TypeScript, lint และ production build ผ่าน เป็น emulated browser checks ไม่ใช่การทดสอบอุปกรณ์จริงหรือ AI กล้องจริง

เข้าตรวจรวมผ่าน `http://localhost:3000/` แล้ว Login → `/patient/plan` → Home/วันนี้ → รายละเอียดท่า → กล้อง ขณะยังไม่มีแผนที่ยืนยัน หน้าตัวเลือกจะว่างตามข้อมูลจริง
