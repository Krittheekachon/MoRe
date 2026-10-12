# จุดเชื่อมข้อมูลผู้ป่วย–แพทย์

คำสั่งล่าสุด: นำฟีเจอร์แพทย์ประจำตัวออกทั้งระบบ รวมชื่อเดิม directory และความสัมพันธ์กับผู้ป่วย บัญชี role doctor และงานแผน/ผลฝึกยังอยู่

## API ที่คงอยู่
- GET /api/doctor/patients?q=&page=1&pageSize=20: รายชื่อจริงจาก patient_profiles พร้อมค้นหา/แบ่งหน้า items: patientId, hn, fullName, dateOfBirth, sex; ไม่มี primaryDoctor หรือสถานะการ assign
- GET /api/doctor/patients/{id}: รายละเอียด/แผนเดิม ตรวจ integrationDoctor
- GET /api/doctor/patients/{id}/training: patientId, profile, plan, today, routines, sessions, timeZone Asia/Bangkok; ผลฝึกเดิม ไม่สร้างสำเนาข้อมูล

ใช้ integrationDoctor, staffPatient และ session ฝั่ง server เดิม เฉพาะ doctor ที่ได้รับสิทธิ์ ไม่ส่ง password/national-ID/session secrets ผู้ป่วยอ่านเฉพาะ profile ของตน ไม่เพิ่ม polling หลังสมัคร/บันทึกให้เรียก GET ใหม่

## API ที่นำออก
/api/doctor/primary-doctors, /api/doctor/primary-doctors/{id}, /api/doctor/patients/{id}/primary-doctor ไม่มี route แล้ว (404)

## ฐานข้อมูลและไฟล์
migration 20261012010000_remove_primary_doctor ลบเฉพาะ primary_doctors, patient_profiles.primary_doctor_id และ primary_doctor_name พร้อม FK/index ไม่ลบบัญชี แผน หรือผลฝึก คง migration เก่าเพื่อให้เครื่องใหม่ replay ได้ ใช้ Prisma 7: migrate deploy --config prisma7.config.ts แล้ว generate --config prisma7.config.ts และ restart server

แก้ schema/DBML, account-session/readOwnProfile, demo-data/PatientProfile, doctor-service/staffPatient, patient-doctor-integration/listIntegrationPatients/readIntegrationTraining และลบ primary-doctor-service/types/routes การ์ดใน patient-views และเฉพาะแถวแพทย์หลักใน doctor-connected ถูกนำออกตามคำสั่งทั้งระบบ ไม่รื้อหน้าแพทย์/layout/navigation

## ตรวจ
scripts/test-patient-doctor-integration.mjs ใช้บัญชี/ผลฝึก fixture ตรวจสมัคร รายชื่อ/แบ่งหน้า สิทธิ์ ข้อมูลแยกคน ผลฝึกเดิม และ endpoint ที่นำออก คืน fixture เท่านั้น MORE_INTEGRATION_BROWSER=1 ตรวจโปรไฟล์ direct/refresh หลายขนาด ไม่มีการ์ดแพทย์ ไม่มี overflow/hydration mismatch ยังไม่ยืนยัน UI เพื่อนหรืออุปกรณ์ iPad จริง

ผลตรวจ: PostgreSQL/API 29 checks, Chromium โปรไฟล์ 14 checks ครบ 4 viewport sizes/direct/refresh และ hydration errors 0; TypeScript และ targeted lint ผ่าน ยังไม่ตรวจ iPad จริง
