# MoRe Demo ทั้งระบบ

อัปเดต 2026-10-05: ทำต่อเนื่องเพื่อทดสอบรวม ไม่แบ่ง Sprint ไม่ใช่ระบบพร้อมใช้รักษาคนไข้จริง เอกสารนี้แทนข้อความสถานะ mock-only เก่าเฉพาะส่วนที่เชื่อมแล้ว ไม่มีการแก้ schema/DBML

## เปิดระบบ

ครั้งแรกติดตั้ง dependencies ตาม lockfile และเตรียม root `.env` ตาม `.env.example` ให้ครบ DATABASE_URL และ auth keys โดยใช้ค่าของเครื่องตัวเอง ไม่แชร์ `.env` หรือ keys จากเครื่องอื่น

```powershell
npm run demo:setup
npm run demo
```

`demo:setup` เปิด PostgreSQL ด้วย `docker compose up -d db` ใช้ migration ที่มีผ่าน `migrate deploy` สร้าง Prisma Client รัน catalog seed เดิม ตามด้วย Demo seed และเตรียม MediaPipe assets ทุกคำสั่ง Prisma ระบุ `--config prisma7.config.ts` ไม่มี reset/drop/ลบ volume พอร์ต DB ในเครื่องปัจจุบัน 5434 ต้องตรงกับ DATABASE_URL และ POSTGRES_PORT

เว็บ: `http://localhost:3001` / บุคลากร: `http://localhost:3001/doctor/login` เปลี่ยนพอร์ตด้วย DEMO_PORT และปรับ AUTH_ORIGIN หากกำหนดไว้ เซิร์ฟเวอร์ Demo ใช้ `.next-demo` ไม่ชน dev server เดิมที่ 3000

หยุดเว็บด้วย Ctrl+C และหยุด DB ด้วย `docker compose stop db` ข้อมูลยังอยู่ เปิดใหม่ด้วยคำสั่งข้างต้น ห้ามใช้ `down -v` เพื่อนต้องสร้าง DB/keys/บัญชี Demo แยกบนเครื่องตัวเอง ไม่ส่ง credential files ขึ้น Git

## บัญชีทดสอบ

- บุคลากรสังเคราะห์: `more-demo-doctor`
- คนไข้สังเคราะห์ 1: HN `MORE-DEMO-01`
- คนไข้สังเคราะห์ 2: HN `MORE-DEMO-02`
- เลขเข้าสู่ระบบสังเคราะห์และรหัสผ่านสุ่มอยู่ใน `.demo/accounts.json` บนเครื่องเท่านั้น ไม่แสดงรหัสในเอกสาร/logs/Git
- `.demo/manifest.json` ผูกสิทธิ์กับ DB IDs/HN/HMAC ไม่ใช้ชื่อที่คนไข้แก้ได้เป็นหลักฐานสิทธิ์ เก็บสองไฟล์นี้คู่กัน ห้ามลบทิ้งเพื่อให้ seed เขียนทับบัญชีเดิม หากมี reserved namespace ชน seed จะหยุด ไม่ takeover/เปลี่ยนรหัสบัญชีเดิม

Demo seed เพิ่มท่า `demo-knee-extension` แยกจาก 5 ท่า catalog จริง มีแผนทดลอง 2 เซต × 3 ครั้ง และประวัติวันก่อนที่ติดป้ายสังเคราะห์ ไม่มีการสร้างแผนที่อ้างว่าหมอยืนยัน รันซ้ำใช้รายการเดิม ไม่ทับการแก้แผน/โปรไฟล์/ผลที่บันทึก

## ลำดับทดลองคนไข้

1. Login ด้วยบัญชีสังเคราะห์ เปิด Profile แก้ข้อมูล แล้วโหลดใหม่
2. เลือกแผน DEMO จากหน้าแผน กดซ้ำ/โหลดใหม่ต้องไม่เพิ่มแผนซ้ำ
3. เปิดแผนวันนี้ → คู่มือ → หน้ากล้อง เลือก “รอบจำลอง (ไม่ใช่ AI)” แล้วกดเริ่ม
4. กด “รอบจำลอง” รอครบหนึ่งรอบ หยุดพัก → เปิดการแสดงผล → ปิด ต้องยังพักและจำนวนครั้งเท่าเดิม → ทำต่อ
5. บันทึกได้แม้ไม่ถึงเป้าหมาย ดูกล่อง MAX/AVG → เซตถัดไป ลองเริ่มใหม่/ออก: ทิ้งเฉพาะเซตที่ยังไม่บันทึก
6. ดูประวัติ ปฏิทิน และรายละเอียดเซต/ครั้ง โหลดใหม่แล้วผลยังอยู่ ความคืบหน้าวันนี้อ่านเซตที่บันทึกจริง
7. Login บัญชีที่สองต้องไม่เห็นผลของบัญชีแรก ลอง URL ผล/รายการของบัญชีแรกต้องไม่เปิดข้อมูล Logout แล้วหน้าที่ป้องกันกลับ Login และ API ไม่ให้เข้าถึง

เซตที่บันทึกครบเป้าหมายวันนี้จะเริ่มซ้ำไม่ได้ เป็นกฎจริง ไม่ใช่ข้อผิดพลาด Demo แผนใหม่หลังมี snapshot วันนี้เริ่มวันถัดไป Asia/Bangkok ไม่ลบผลวันก่อน หากต้องลองฝึกต่อวันนี้ใช้บัญชีอีกคนที่ยังมีเซตเหลือ ห้าม reset ฐานข้อมูล

## ลำดับทดลองบุคลากร

1. Login ที่ `/doctor/login` ด้วยบัญชีบุคลากรสังเคราะห์
2. ค้นหาชื่อ/HN เปิดข้อมูลคนไข้และบันทึกทีมรักษา โหลดใหม่ตรวจข้อมูล
3. ดูประวัติ → รายละเอียดผล ต้องเป็นเซตและมุมเดียวกับที่คนไข้บันทึก ดูรายครั้ง/ข้าง/นิยามเวอร์ชัน/จุดตรวจ MAX/AVG แยก metric และข้าง ไม่รวมตัวชี้วัดต่างชนิด
4. หน้าแผนกลางสร้างแผน หรือแก้แผนเป็นเวอร์ชันใหม่ ระบุเซต/ครั้ง/ความถี่/ข้าง/ทุกวันหรือวันในสัปดาห์ ไม่มีการคัดลอกเกณฑ์รักษาจากค่า default
5. เปิดแผนของคนไข้แล้วเลือกแผนกลาง กดซ้ำต้อง reuse และไม่เปลี่ยนเป้าหมายรายวันที่สร้างแล้ว

บุคลากร Demo เห็นเฉพาะคนไข้/ท่า/แผน Demo ไม่เห็นข้อมูลคนไข้จริง บุคลากรปกติไม่เห็น Demo ใน catalog/แผน/รายชื่อ และผู้สมัครไม่สามารถกำหนด role เอง

## กล้องจริง

ใช้เครื่องที่เปิด `localhost` หรือ HTTPS ที่เชื่อถือได้ บนมือถือ/iPad URL แบบ HTTP ผ่าน LAN มักเปิดกล้องไม่ได้เพราะ secure-context requirement อนุญาตกล้อง เลือก “กล้องทดลอง” จัดภาพด้านข้างให้เห็นสะโพก เข่า และข้อเท้าของข้างที่เลือก โหลดโมเดลสำเร็จก่อนเริ่ม

นิยามทดลองเป็นมุมสะโพก–เข่า–ข้อเท้าใน image-2d แก้สัดส่วนภาพ เริ่ม/กลับ 75–105°, ออกจากเริ่มตั้งแต่ 120°, peak ทดลอง 140–180°, stable 200ms, max gap 1000ms, visibility 0.6 เป็น **engineering fixture เท่านั้น** ไม่ใช่เกณฑ์ความถูกต้องทางคลินิก ต้องกลับเริ่มครบจึงนับ ไม่บันทึกวิดีโอหรือข้อมูลรายเฟรม

MORE_DEMO_MODE เปิดเฉพาะ script Demo; ค่าเริ่มต้น off แม้เปิด flag คนไข้จริงก็ใช้เกณฑ์นี้ไม่ได้ เพราะตรวจ manifest/เจ้าของรายการ/ท่า Demo ฝั่งเซิร์ฟเวอร์ทุกครั้ง Approved clinical registry ยังว่าง

## ตรวจสถานะจากโค้ดจริง

| กลุ่ม | ก่อนทำ | สิ่งที่เชื่อมในรอบนี้ |
| --- | --- | --- |
| บัญชีคนไข้/โปรไฟล์ | เชื่อมจริงแล้ว | ใช้ระบบเดิม ไม่สร้างซ้ำ |
| แผนกลาง/แผนคนไข้/รายวัน | คนไข้เชื่อมแล้ว ไม่มีข้อมูลแผนที่ยืนยัน | แยกแผน Demo และเพิ่มการกำหนดแผนฝั่งหมอ |
| คู่มือ | อ่าน DB มี missing-media state | เติมคำแนะนำสังเคราะห์ ไม่แต่งวิดีโอรักษา |
| กล้อง/นับ/บันทึก | runtime+logic+API มีแล้ว clinical gate ปิด | เปิดเกณฑ์เฉพาะ Demo และรอบจำลองผ่าน counter/API เดิม |
| ประวัติ/ปฏิทิน/รายละเอียด | mock | อ่าน saved-only sessions/sets/reps/metrics/checkpoints จริง |
| Login หมอ | mock | ตรวจ hash/role/session/CSRF/throttle จริง |
| รายชื่อ/บันทึกคนไข้/ผลหมอ | mock | เชื่อม Prisma และสิทธิ์ Demo isolation |
| จัดการแผนกลาง/ค่าฝึก | mock | transaction/version/retry identity/side/schedule/targets จริง |
| สมัครแบบรหัสผ่านกำหนดเอง | เชื่อมจริงแล้ว | คงเดิม |
| สมัครด้วยรหัสตั้งต้น 4 หลัก/กู้รหัส | ยังรอนโยบาย | ไม่เปิดนโยบายอ่อนแอเอง ใช้บัญชี seed ทดลองได้ |
| ผลรักษา 5 ท่าจริง/วิดีโอหมอ | ยังขาดนิยามที่ยืนยัน | ไม่อ้างว่าพร้อมรักษา; Demo ทดลองเฉพาะ synthetic knee |

## ผลตรวจ

**พร้อมให้ผู้ใช้เริ่มเทส Demo** สำหรับ flow ทดลองท่า knee สังเคราะห์ ไม่ใช่การรับรองพร้อมรักษาคนไข้จริง

- `npm run demo:setup` ผ่านครบ: DB เดิมทำงาน migration ไม่มีค้าง generate/catalog seed/Demo seed/MediaPipe assets สำเร็จ ไม่มีการ reset/แก้ schema
- Integrated browser: 373 assertions ผ่าน ใช้สองบัญชี Demoและหมอ ครอบคลุม persistent session/plan, concurrent plan reuse, positive partial save/retry/conflicting retry, actual history/per-repetition MAX/AVG, cross-owner/role denial, pause/continue/reset/exit, doctor notes/template retry/version/assignment และ Logout ทั้งสองฝั่ง
- Responsive: 24 viewport/theme/font combinations × 7 หน้า ที่ 390×844, 820×1180, 1180×820 และ 1440×1180; ตรวจ root preference จริงและไม่มี page horizontal overflow ตารางรายละเอียดเลื่อนภายในกรอบ ไม่ตัดข้อมูลทิ้ง ตรวจ screenshots ของมือถือ/iPad/desktop ขนาดตัวอักษรใหญ่สุด
- Account regression เดิม: 58 assertions ผ่านอีกครั้งด้วยบัญชีสังเคราะห์ใหม่ 2 บัญชี รวม Register/Login/Profile/Password/CSRF/throttle/role injection/Logout และ responsive 18 ชุด; DB aggregate ยืนยัน hash/HMAC/encrypted ID ไม่พิมพ์ข้อมูลลับ การทดสอบ throttle เปลี่ยนเป็น identity สังเคราะห์แยกเพื่อไม่ล็อกบัญชี Demo
- MediaPipe runtime: 10 checks ผ่านด้วยโมเดลจริงบนวิดีโอว่างสังเคราะห์ ไม่พบท่าไม่เพิ่มครั้ง, permission/model failure, active no-settings, settings while paused, worker/tracks cleanup และ nonblank pixels ไม่ใช่กล้องคนจริง
- Demo policy/seed/logic: 14 checks ผ่าน identity/flag isolation, ห้ามบัญชีปกติเลือกหรือใช้เกณฑ์ Demo, seed รันซ้ำจำนวนรายการ/hash/การแก้โปรไฟล์/แผน/ผลไม่เปลี่ยน, nullable-date regression, completed-cycle/tracking/pause และ landmark shape จริงของ MediaPipe 1.0.1 (visibility โดยไม่ต้องมี presence ที่ API ไม่ส่ง)
- Focused final layout: 76 checks ผ่านที่ 320px และ iPad landscape 1180×820 ทั้งสองสี/สามขนาดตัวอักษร รวม UUID fallback บน HTTP LAN และพื้นที่กดปุ่มกลับอย่างน้อย 48px; inspected final screenshots ไม่มีข้อความ/ปุ่มล้นหน้า
- TypeScript, full lint, production build และ `git diff --check` ผ่าน; `.env`, private Demo files และ generated Demo build ถูก Git ignore

คำสั่งตรวจซ้ำ (เปิด Demo server ก่อน):

```powershell
npx.cmd --yes --package @playwright/cli playwright-cli -s=more-demo open http://localhost:3001
node scripts/test-demo.mjs
node scripts/test-demo.mjs --camera
node scripts/test-demo.mjs --accounts
node scripts/test-demo.mjs --layout
node scripts/test-demo-policy.mjs
npx.cmd --yes --package @playwright/cli playwright-cli -s=more-demo close
npx --no-install tsc --noEmit
npm run lint
npm run build
```

การทดสอบรวมซ้ำใช้เซตสังเคราะห์ที่บันทึกไว้เพื่อตรวจอ่าน/retry และไม่ใช้เซตที่เหลือจนหมดหรือยกเลิก daily cap การบันทึกใหม่และ retry หลัง committed response สูญหายตรวจในรอบแรกแล้ว ผล PostgreSQL ถูกคงไว้เพื่อตรวจจากหน้าหมอ ไม่ลบประวัติเพื่อให้ผลทดสอบผ่าน ณ หลังทดสอบ บัญชี Demo ทั้งสองมีผลของวันนี้แล้วและเหลือเซตให้ทดลองต่อ หากคงข้อมูลไว้จนเป้าหมายครบต้องรอวันใหม่หรือใช้บัญชีอีกคน ไม่ reset

ยังไม่ได้ทดลองคนทำท่าจริง, physical iPad/มือถือ, ความแม่นยำทางคลินิก, HTTPS deployment หรือ distributed limiter; ค่า Demo ทุกค่าไม่ถือว่าหมอยืนยัน

## ไฟล์หลักที่เชื่อม

- `src/lib/doctor-service.ts`, `src/app/api/auth/doctor/login/route.ts`, `src/app/api/doctor/*`: staff auth, permissions, patient data/notes, transactional templates and assignment
- `src/lib/results-service.ts`, `src/app/api/patient/results/route.ts`, `src/components/app/results-views.tsx`: owned saved-only history/calendar/set/rep/metric/checkpoint details
- `src/lib/demo-policy.ts`, `src/lib/demo-seed.ts`, `scripts/seed-demo.mjs`: private DB-bound identity, isolated temporary criteria and additive seed
- `src/lib/training-service.ts`, patient templates API and Patient/Doctor catch-all pages: template isolation, real connected routes and actual configuring staff ID
- `src/components/app/knee-camera.tsx`, `src/lib/recording-service.ts`, `src/lib/pose/cycle.ts`: Demo source, true cycle counting, pause/retry, server criteria gate and installed landmark API compatibility
- `src/components/app/doctor-connected.tsx`, `src/lib/request-id.ts`, `other-auth.tsx`, shared shell/logout/error/loading/CSS: existing UI connected to actual persistence and safe retry states
- `package.json`, `scripts/setup-demo.mjs`, `scripts/start-demo.mjs`, `next.config.ts`, `tsconfig.json`, `.gitignore`, `.env.example`, lint ignores: startup and separate generated Demo output, without changing root `.env` or packages
- `scripts/test-demo*.mjs/js`, existing `test-accounts.js`: synthetic integrated/policy/camera/layout/account checks; temporary credential-injected browser files are ignored and removed after use
- `docs/demo-ready.md`, `checklist.md`, `more.md`, `ui-map.md`, `accounts-setup.md`, `training-plans.md`, `camera-recording.md`: actual status and test evidence supersede historical mock-only milestones

## ต้องยืนยันก่อนใช้รักษาจริง

- ท่านั่งเหยียดขากับ `seated-leg-raise` เป็นท่าเดียวกันหรือไม่ นิยามมุม 2D/3D, landmarks, ข้าง/มุมกล้อง และเกณฑ์ start/departure/return/correctness/tracking/stability ที่หมอยืนยัน
- เป้าหมาย เซต/ครั้ง/ความถี่/วัน และคำแนะนำ/วิดีโอของแผนจริง พร้อมวิธีทดสอบความปลอดภัยกับผู้ป่วย
- นโยบายรหัสผ่านตั้งต้น 4 หลัก การเปลี่ยนรหัสบุคลากรและการกู้คืนบัญชี
- การ deploy HTTPS, distributed rate limits, ขอบเขตบุคลากรต่อผู้ป่วยตามหน่วยงาน (schema ปัจจุบันไม่มีตาราง assignment)

ข้อจำกัดการค้นหา/อ่านผล Demo: รายชื่อสูงสุด 500 คน ค้นหาชื่อ/HN; history สูงสุด 200 sessions ล่าสุด ไม่มีกราฟคะแนนทางคลินิกหรือเฉลี่ยรวมต่าง metric ข้อมูลที่เป็น Demo ติดชื่อ/ป้ายชัด ไม่ใช้กับคนไข้จริง
