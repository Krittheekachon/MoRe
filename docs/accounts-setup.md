# ระบบบัญชี MoRe

## Demo ทั้งระบบ: สถานะที่ใหม่กว่า (2026-10-05)

Login บุคลากรเชื่อมจริงแล้วที่ `/api/auth/doctor/login` ผ่าน hash verification, in-memory throttle, Origin/JSON validation และ HttpOnly session เดิม หน้าบุคลากรและ API ตรวจ active role จริงทุกคำขอ ไม่ให้บัญชีคนไข้เข้าถึง และไม่เปิด mock bypass link ส่วน Recovery และนโยบายรหัสตั้งต้น 4 หลักยังคงรอการยืนยัน ไม่ถือว่า Demo อนุมัตินโยบายบัญชีจริงเหล่านี้

บัญชีบุคลากร/คนไข้สังเคราะห์และรหัสสุ่มสร้างด้วย `npm run demo:seed` เก็บ credentials ใน `.demo/accounts.json` ที่ ignore และผูก Demo isolation กับ `.demo/manifest.json` ไม่สร้าง auth/session/schema ซ้ำ บุคลากร Demo เข้าถึงเฉพาะคนไข้ Demo; คนไข้/บุคลากรปกติไม่ใช้เกณฑ์ Demo ข้อความ clinician Login/UI-only ใน milestone เก่าด้านล่างเป็นประวัติ ดู `demo-ready.md` สำหรับคำสั่งและผลทดสอบล่าสุด

## สถานะและตำแหน่งโค้ด (2026-10-05)

ตรวจ cwd, branch, git status และ worktree ก่อนแก้: workspace นี้อยู่บน `main` ที่ `47162c0` มี local branch/worktree เดียว และมีงานยังไม่ commit จำนวนมากซึ่งคงไว้ทั้งหมด ตรวจทั้งสอง commit (`47162c0`, `14944cf`) ไม่พบ auth implementation ที่ต้องนำเข้าจากที่อื่น จึงเพิ่มระบบบัญชีใน workspace นี้ ไม่ checkout/merge/reset/commit/push

- `src/lib/prisma.ts`: singleton เดิม ไม่เปลี่ยน schema/migration หรือ seed catalog
- `src/lib/account-security.ts`: scrypt hash, HMAC-SHA256 สำหรับค้นหาเลขบัตร, AES-256-GCM สำหรับเก็บเลขบัตรแบบเข้ารหัส
- `src/lib/account-session.ts`: encrypted HttpOnly session ผ่าน iron-session 8 (รองรับ Node 20), ตรวจบัญชี/role/is_active จาก PostgreSQL ทุกคำขอ และผูก session กับ password hash
- `src/lib/account-validation.ts`, `account-rate-limit.ts`, `account-http.ts`: validation, throttling และตรวจ Origin ของ mutation
- `src/app/api/auth/{login,logout,password,register}/route.ts`, `register/start/route.ts`: API บัญชี
- `src/app/api/patient/profile/route.ts`: GET/PATCH เฉพาะ profile ของบัญชีใน session ไม่รับ patient_id จากผู้เรียก
- `src/app/patient/[[...segments]]/page.tsx`: requirePatient ก่อน render ทุกหน้าผู้ป่วย; Profile และชื่อในหน้า Home/sidebar อ่านข้อมูลจริง
- ฟอร์มเดิมใน `src/components/auth/` และ `src/components/app/patient-views.tsx` เรียก API จริงแทน mock; `logout-button.tsx` ล้าง cookie และนำทางเต็มหน้าเพื่อล้าง client state

## กฎข้อมูลและ Flow

ยึด DBML: คนไข้มี `users.role=patient` จากเซิร์ฟเวอร์และ `login_name=NULL` เข้าสู่ระบบด้วยเลขบัตร 13 หลักผ่าน `national_id_lookup` ไม่เก็บเลขบัตรดิบใน login_name หรือ logs ไม่ตรวจ checksum/ยืนยันตัวบุคคลกับทะเบียนภายนอกในขอบเขตนี้

สมัครแบบตั้งรหัสใหม่อย่างน้อย 8 และไม่เกิน 128 ตัวอักษร: ข้อมูลบัญชี → ข้อมูลส่วนตัว → ข้อมูลสุขภาพ → ตรวจทาน → ยืนยันสร้างบัญชี → Login ไม่มีบัญชีถูกสร้างก่อนยืนยันขั้นสุดท้าย Credential draft เก็บเพียง hash/HMAC/เลขบัตรเข้ารหัสใน HttpOnly cookie อายุ 15 นาที ไม่เก็บรหัสผ่านหรือ token ใน localStorage ส่วน draft ส่วนตัว/สุขภาพยังอยู่ใน React memory เดิม การโหลดหน้าใหม่ระหว่างกรอกจึงอาจต้องกรอกใหม่

การสร้าง User + PatientProfile ใช้ transaction เดียวกัน และ unique constraint เดิมป้องกันบัญชีซ้ำพร้อม rollback บัญชีที่สร้างไม่สำเร็จ ไม่รับ role/HN/medical_notes/password_hash จาก browser

`full_name` เก็บครบสูงสุด 200 ตัวอักษรและเป็นชื่อหลักทุกหน้าที่เชื่อมแล้ว ส่วน `users.display_name` สร้างจาก 100 code points แรกเพื่อให้ตรงขนาดคอลัมน์เดิม ไม่ใช้ค่าที่ถูกย่อแทนชื่อเต็มของคนไข้

แก้ Profile ได้เฉพาะ full_name/date_of_birth/sex/phone/primary_doctor_name/other_conditions ของตนเอง ไม่แก้ HN เลขบัตร และ medical_notes ของผู้รักษา API เลือกฟิลด์ส่งกลับโดยไม่ส่ง hash/HMAC/เลขบัตรเข้ารหัส

### ข้อสรุปที่ยังรอ

UI มีตัวเลือกใช้รหัสเริ่มต้น 4 ตัวท้าย แต่เอกสารเดิมระบุว่าเป็น mock-only ยังไม่ได้รับการยืนยันนโยบายสำหรับบัญชีจริง จึงคงตัวเลือกเดิมไว้ แต่ API ปฏิเสธการสร้าง credential แบบนี้ด้วยข้อความให้ตั้งรหัสอย่างน้อย 8 ตัว ไม่เปิดบัญชีด้วยรหัสเดาง่ายโดยเงียบ ๆ มีคำถามให้เลือกว่าจะบังคับเปลี่ยนรหัสก่อนเข้าหน้าผู้ป่วย หรือบังคับตั้งรหัสใหม่ก่อนสมัครเสร็จ

ตรวจรายงาน `Term1 Final Project Report (1).docx` เพิ่มแล้ว: รายงานระบุ default เป็น 4 ตัวท้ายและแก้ภายหลังได้ ขณะที่ Markdown เดิมกำหนด mock-only และการป้องกันรหัสผ่านฝั่งจริงยังไม่สรุป นี่เป็นข้อขัดกันที่ต้องให้ผู้ใช้ตัดสิน ไม่อ้างว่านโยบายบังคับเปลี่ยนรหัสได้รับอนุมัติแล้ว

บัญชีที่มี `password_change_required=true` ตาม schema จะเข้าถึงได้เฉพาะหน้าเปลี่ยนรหัสในฝั่งผู้ป่วย ไม่อ่าน/แก้ Profile จนเปลี่ยนสำเร็จ Guard นี้มีแล้ว แต่ยังไม่ได้เปิดการสมัครด้วยรหัสเริ่มต้น 4 ตัว

## Setup สำหรับเครื่องอื่น

ใช้ `.env.example` เป็นรายการค่าและสร้าง `.env` ของเครื่องตนเอง คง DATABASE_URL ให้ตรงกับ Docker/พอร์ต 5434 ตาม `database-setup.md` สร้างกุญแจสามตัว **แยกกัน** ด้วยคำสั่งนี้หนึ่งครั้งต่อกุญแจ:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

กำหนด `AUTH_SESSION_SECRET`, `NATIONAL_ID_LOOKUP_KEY`, `NATIONAL_ID_ENCRYPTION_KEY` ฝั่ง server เท่านั้น ไม่มี NEXT_PUBLIC prefix ไม่แชร์ `.env` จริง เมื่อมีบัญชีแล้วห้ามเปลี่ยน lookup/encryption keys โดยไม่มีแผนย้ายข้อมูลและ backup เพราะจะค้นหา/ถอดรหัสข้อมูลเดิมไม่ได้ การเปลี่ยน session secret จะทำให้ session เดิมใช้ไม่ได้

Cookie `more_account` อายุ 7 วัน ใช้ HttpOnly, SameSite=Lax, Path=/ และ Secure เมื่อ NODE_ENV=production ต้องให้ production ใช้ HTTPS และกำหนด `AUTH_ORIGIN` เป็น origin สาธารณะจริง เช่น `https://more.example.com` Mutation ต้องส่ง JSON และ Origin ตรงกัน ไม่เปิด CORS ให้ origin อื่น

ใช้ `requirePatient()` หรือ `currentAccount()` แล้วตรวจ role ฝั่ง server เมื่อเชื่อมแผนฝึกต่อ ห้ามถือ role หรือ patient_id จาก browser เป็นสิทธิ์ หน้าผู้รักษาปฏิเสธ session คนไข้ แต่ยังไม่ได้ทำ clinician Login จริง

## วิธีทดสอบ

ใช้ฐานข้อมูลพัฒนาเท่านั้น ชุด smoke นี้สร้างบัญชีสังเคราะห์ใหม่สองบัญชีต่อครั้งและคงไว้เพื่อตรวจ DB ไม่ใช้ข้อมูลผู้ป่วยจริง ไม่ reset/ลบข้อมูลเดิม และไม่พิมพ์ credentials

```powershell
npm run dev
npx.cmd --yes --package @playwright/cli playwright-cli -s=more-auth open http://localhost:3000 --browser chrome
npx.cmd --yes --package @playwright/cli playwright-cli -s=more-auth run-code --filename scripts/test-accounts.js
node scripts/check-accounts.mjs
npx.cmd --yes --package @playwright/cli playwright-cli -s=more-auth close
npx tsc --noEmit
npm run lint
npm run build
```

ผลตรวจจริง: smoke ผ่าน 58 assertions ด้วยสองบัญชี ครอบคลุมสมัคร/Login/reload/Profile/edit/reload/Logout, duplicate, wrong password/unknown account, role injection, URL/payload targeting คนอื่น, CSRF, tampered cookie, throttling และเปลี่ยนรหัสพร้อมเพิกถอน session เก่า ตรวจ Profile 18 ชุด (390/820/1440px × light/dark × m/l/xl) ไม่พบ horizontal overflow และตรวจ screenshots ของขนาดใหญ่สุดแล้ว

Query อ่าน aggregate ยืนยัน 2 บัญชีสังเคราะห์เป็น patient/login_name NULL, hash รูปแบบ scrypt อยู่ในขนาดคอลัมน์, lookup เป็น hex 64 ตัว และเลขบัตรเก็บแบบเข้ารหัส Catalog เดิมยังมี 2 หมวด/5 ท่า

ตรวจ production response จริงจาก `next start --port=3002` ด้วย `node scripts/check-production-cookie.mjs` ได้ HTTP 200 และ cookie มี HttpOnly/Secure/SameSite=Lax ครบ ไม่สร้างบัญชีเพิ่ม ไม่พิมพ์ค่า cookie และปิด server ชั่วคราวแล้ว ส่วน dev server เดิมยังอยู่ที่ port 3000

## ข้อจำกัดก่อน Production

- Throttling อยู่ใน bounded in-memory map ต่อ process (บัญชี 10 ครั้ง/15 นาที พร้อม global cap และจำกัด scrypt พร้อมกัน 2 งาน) restart จะล้างตัวนับ และหลาย instance ต้องมี shared limiter/WAF ที่เหมาะสมก่อนเปิดบริการจริง
- Session เป็น stateless encrypted cookie: Logout ลบ cookie ของ browser นี้ แต่ cookie ที่ถูกขโมยก่อน Logout ยังไม่ถูกเพิกถอนเป็นราย session จนหมดอายุ เปลี่ยนรหัส หรือปิดบัญชี หากต้องการ immediate server-side revocation ต้องอนุมัติแนวทาง storage/schema เพิ่มก่อน
- อัปเดตงานต่อวันที่ 2026-10-05: แผนกลาง/เลือกแผนผู้ป่วย/รายการวันนี้/ความคืบหน้าจาก saved sets/ทางเข้ากล้องเชื่อมจริงแล้วด้วย session เดิม ดู `training-plans.md` ส่วน AI/บันทึกผลกล้องและหน้าประวัติแบบเต็มยังไม่เชื่อม ไม่เพิ่มแผนทางคลินิกหรือบัญชีหมอจริงโดยเดาข้อมูล
- Recovery และ clinician Login ยังเป็น UI-only ไม่อ้างว่าพร้อมใช้งานจริง
- ชุด UI เก่าที่คาดหวัง mock-success/เข้า Patient โดยไม่ Login ไม่ได้ถือว่าผ่านหลังเปลี่ยนระบบ ชุด auth smoke ใช้แทนการตรวจ acceptance ของบัญชี; regression hydration ที่บันทึกไว้ก่อนหน้านี้ยังไม่ได้ปิด
- npm รายงาน 9 high vulnerabilities ใน dependency tree และ warning ของ Prisma streams-local กับ Node 20; ไม่ใช้ audit fix --force หรือเปลี่ยนแพ็กเกจเดิมนอกขอบเขต ต้องตรวจแยกก่อน production

อ้างอิงการจัดการ session: [iron-session](https://github.com/vvo/iron-session/tree/v8.0.4) และค่า scrypt: [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) ใช้ N=131072, r=8, p=1 และ salt สุ่มต่อรหัส
