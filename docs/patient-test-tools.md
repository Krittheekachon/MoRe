# เครื่องมือทดสอบ Routine ฝั่งผู้ป่วย

ล็อกอินบัญชีผู้ป่วยทดสอบ แล้วเปิด `/patient?testTools=1` แผงอยู่ท้ายหน้า ไม่ทับ Bottom Navbar ใช้ได้ทุกหน้าผู้ป่วยยกเว้นเปลี่ยนรหัสผ่าน หน้ากล้องใช้ `?daily=ID&testTools=1` ไม่มีการลบอัตโนมัติเมื่อเปิด URL

Development เปิดโดยค่าเริ่มต้น ปิดด้วย `MORE_PATIENT_TEST_TOOLS=0` และ restart server; production ปิดโดยค่าเริ่มต้น เปิดเฉพาะตั้ง `MORE_PATIENT_TEST_TOOLS=1` ฝั่ง server ทุก API ตรวจ environment และบัญชี patient ที่ active/ผ่าน auth/ไม่ติด required password change พร้อม Origin และ validation เดิม Query เปิดเฉพาะ UI ไม่มีสิทธิ์ลบ ไม่รับ patient ID จาก client บัญชี dev/doctor ใช้ไม่ได้

## วันที่จำลอง

เลือกวันแล้วกด **ใช้วันที่นี้**, **วันถัดไป**, **กลับวันที่จริง / ปิดโหมดทดสอบ** วันที่อยู่ใน encrypted HTTP-only account session `routineTestDate` ไม่เก็บใน localStorage/DB/ไฟล์กลาง และล้างเมื่อ login ใหม่ ตัวช่วย `routineNow` ใช้ Asia/Bangkok ร่วมกันกับแผนวันนี้/start/progress แต่ recording timestamps, durations, อายุ และ security expiry ยังคงเวลาจริง ยอมรับวันจริงระหว่าง 2000-01-01 ถึง 2100-12-31

เมื่อมี override แสดง **กำลังทดสอบวันที่ …** แม้ซ่อนแผงด้วยการถอด query หากต้องการกลับเวลาจริงต้องกดปุ่มกลับวันที่จริง/logout/ปิด server flag แผนต้องมีผลในวันที่เลือก การกลับวันเดิมอ่าน snapshot และประวัติเดิม ไม่แก้ timestamp หรือเป้าหมายย้อนหลัง

เปลี่ยนวันพักและปิดกล้อง ยกเลิกเสียง และโหลดหน้าใหม่ ไม่ย้าย draft ไปวันใหม่ เซตที่เริ่มแล้วผูกวันเริ่มเดิม ระบบส่ง BroadcastChannel pause/changed ให้แท็บ session เดียวกัน หาก browser ไม่รองรับ channel ให้ reload แท็บอื่นก่อนฝึกต่อ

ไฟล์ `.demo/routine-test-date.json` ไม่มีผลต่อ runtime แล้ว `scripts/routine-test-date.mjs` ไม่ตั้งวันใหม่อีกต่อไป คำสั่ง `off` ล้างไฟล์เก่าได้ ใช้แผง session นี้แทน

## เคลียร์ผล

ค่าเริ่มต้นลบ **เฉพาะวันที่ทดสอบปัจจุบัน** มีตัวเลือกแยก **ผลฝึกทั้งหมดของคนไข้รายนี้** dialog แสดงชื่อ/HN และขอบเขต ต้องยืนยันก่อนลบ ลบจริงย้อนกลับไม่ได้

`clearTrainingResults` ล็อก patient profile และ daily exercises ตามลำดับเดียวกับระบบแผน/การบันทึก แล้วลบ checkpoint results → metrics → repetitions → camera checks → sets → sessions ใน transaction โดย filter ผู้ป่วยและวันทุกคำสั่ง reset daily status/timestamps กับ rehabilitation day activity/closed flag คง daily targets/snapshots, แผน, บัญชี/profile และ catalog ไม่ล้างทั้งตาราง

คำขอบันทึกเก่าของ set ID ที่ลบได้ 404/409; recording re-read หลัง daily lock กันแข่งกับ delete ผลที่บันทึกก่อน delete ถูกลบด้วย transaction ผลหลัง delete ใช้ ID เดิมไม่ได้ UI ใช้ single-flight guard หยุดเริ่ม/บันทึกหลัง pause และโหลดประวัติ/progress ใหม่หลังสำเร็จ ไม่มี schema/migration ใหม่หรือการเปลี่ยน engine/เกณฑ์ท่า

## API และไฟล์

| API | Request / response |
|---|---|
| GET `/api/patient/test-tools` | `{patientName,hn,date,simulated}` ไม่มี token/national ID |
| POST | `{action:"date",date:"2026-10-13"}` หรือ `{action:"real"}` |
| POST ลบ | `{action:"clear",scope:"day"หรือ"all",date:"2026-10-13",confirmation:"CLEAR_MY_TRAINING"}` วันที่ต้องตรง server ปัจจุบัน |

invalid date/field/confirmation: 400; no session: 401; role/environment/Origin: 403; stale date: 409

- `src/lib/routine-clock.ts`: flag, validation, business clock
- `src/lib/account-session.ts`: override และล้างเมื่อ login
- `src/lib/patient-test-tools.ts`: transaction ลบ/reset
- `src/app/api/patient/test-tools/route.ts`: server authorization
- `src/components/app/patient-test-tools.tsx`: แผงและ confirmation
- `src/app/patient/[[...segments]]/page.tsx`, `src/app/system.css`: server visibility/banner/flow
- `src/components/app/knee-camera.tsx`, `src/lib/recording-service.ts`: pause และ stale save guard

## ตรวจสอบ

เปิด local HTTPS server และ Playwright CLI session `more-recording` แล้ว:

```powershell
$env:MORE_TEST_TOOLS_CHECK="1"
node scripts/test-routine.mjs
```

สร้าง/ลบเฉพาะผู้ป่วย fixture ใหม่ ตรวจ PostgreSQL delete วันเดียว/ทั้งหมด/แยกคน/รักษาแผน/กัน stale save/flag; Chromium ตรวจเปิดตรง/refresh, session isolation, next/return/real day, API validation/confirmation, anonymous denial และ 390×844, 820×1180, 1180×820, 1440×900 ผลทดสอบ emulation ไม่ยืนยันอุปกรณ์จริง

ทดสอบมือถือ/iPad จริงต่อ: วันแรกบันทึกบางส่วน → วันถัดไป 0/ประวัติเดิม → กลับวันเดิม → เคลียร์วันเดียวตรวจวันอื่น → เคลียร์ทั้งหมดตรวจแผนยังอยู่ → กลับวันที่จริง ตรวจกล้องหยุดและไม่มีเสียง/pending save แทรก ใช้บัญชีทดสอบเท่านั้น
