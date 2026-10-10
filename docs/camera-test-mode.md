# โหมดทดสอบกล้องและ MediaPipe (2026-10-07)

ข้อกำหนดล่าสุดเป็น Mock criteriaVersion 3: ท่าเตรียม, start 80–90°, return 80–92°, departure 110°, target 160–170° และสองมุม realtime ดู [knee-preparation-test.md](knee-preparation-test.md) รุ่น 1/2 ด้านล่างเป็นประวัติที่ยังคง checkpoints/results เดิม

## ข้อกำหนดล่าสุด: viewport และ Mock v2

Mock ใช้เป้าหมายสูงสุด 160–170° ตามคำขอล่าสุดใน `exercises/camera-knee-extension.ts` criteriaVersion=2; คำอธิบาย 140–180° ด้านล่างเป็นประวัติ v1 ที่ถูกแทนที่แล้ว รัน `npm.cmd run demo:seed` เพื่อเพิ่ม checkpoint v2 แบบ idempotent โดยไม่แก้ v1 หรือผลฝึกเก่า ไม่มี schema/migration ใหม่ เกณฑ์ของท่าจริงและ approved registry คงเดิม Legacy Demo ที่ไม่เปิด camera test ยังใช้ v1

กล้องใช้ 100dvh เป็นพื้นที่พื้นหลังซ้อน header/counters/control card ไม่ใช้ Fullscreen API ปุ่มหลัก/ตัวนับอยู่ใน viewport และข้อมูลรอง/การตั้งค่าขณะพักเลื่อนภายในการ์ดบนจอเตี้ย เมนูข้างตามแผนเดิมและล็อกหลังเริ่มเซต ปุ่มหยุดกลับเป็น “เริ่ม” ซึ่งทำต่อโดยรอท่าเริ่ม ไม่เชื่อมรอบที่ค้าง

ออกหรือรีเซ็ตเซตที่เริ่มแล้วต้องยืนยันก่อนทิ้ง การยกเลิก dialog คงการพัก ไม่เริ่มเอง รีเซ็ตล้างเฉพาะ draft/current angle/counters/engine และปิดสิทธิ์บันทึกจนเริ่มใหม่ ไม่ลบ saved set การปิดกล้อง/รายละเอียดพักผลไว้ การเปิดกล้องใหม่หรือปิดรายละเอียดไม่เริ่มเอง

หากมี draft ค้างจากเกณฑ์ v1 ให้รีเซ็ต draft ก่อนเริ่ม v2; ผลที่บันทึกแล้วคง checkpoint/version เดิม ไม่แปลงย้อนหลัง ช่วง 160–170° เป็นค่า engineering mock ไม่ใช่เกณฑ์ทางการแพทย์

หน้าฝึกใหม่: กล้องเป็นพื้นหลังเต็ม viewport ชื่อท่า/เซตอยู่ซ้ายบน ปุ่มกล้อง/รายละเอียดอยู่ขวาบน (รายละเอียดเป็นไอคอนบนมือถือ) เมนูด้านล่างรวมข้างที่ฝึก จำนวนครั้งครบ/จำนวนครั้งที่ถูกตาม engine ปุ่มเริ่ม→หยุด→ทำต่อ ปุ่มบันทึก disabled ก่อนเริ่ม ปุ่มออกขนาดเล็ก และรีเซ็ตแบบไอคอน รายละเอียดเปิด dialog และพักการนับก่อนเปิด ไม่ออกจากหน้ากล้อง

จำนวนครั้งที่ถูกคำนวณจาก peak ของแต่ละรอบที่ engine ยืนยันครบ ใช้ correctPeak เดิมและปัด peak แบบเดียวกับ server ไม่ใช้สีหรือมุมปัจจุบันเป็นผลที่ถูก ไม่เพิ่มฟิลด์ DB ช่วง 160–170° ที่ยกตัวอย่างยังไม่ได้แทนเกณฑ์ท่าจริง/ทดสอบ: หน้าจออ่านช่วงจริงจาก criteria (Mock ปัจจุบัน 140–180°) การเปลี่ยนช่วงต้องเปลี่ยน config และ checkpoint/version ใน DB ให้ตรงกันตามเอกสารเดิม

สีจุดในกล้องใช้สถานะ engine: แดงเฉพาะเตรียมท่าเริ่มไม่ถูก เหลืองเมื่อพร้อม/ยังไม่ถึงเป้า เขียวเมื่อถึงเป้านิ่งและค้างจนกลับจบรอบ เทาเมื่อข้อมูลวัดไม่ได้ มี state แสดงผลแยก ไม่เปลี่ยนจำนวนครั้งหรือการบันทึก ปรับสีได้ใน overlay-config.ts.statusColors ดูรายละเอียด [pose-exercise-architecture.md](pose-exercise-architecture.md)

โครงสร้างรายท่าปัจจุบัน: config ทดสอบอยู่ที่ `src/lib/pose/exercises/camera-knee-extension.ts` ส่วน `camera-test-adapter.ts` bind ข้อมูล DB เท่านั้น กล้องและ server เรียก engine กลาง ดูขั้นตอนเพิ่มท่า/engine และข้อจำกัดที่ [pose-exercise-architecture.md](pose-exercise-architecture.md)

ใช้ flow แผน/รายวัน/บันทึกเดิม ไม่ใช่การ์ดลัดไปกล้อง และไม่ใช้เกณฑ์นี้ประเมินผู้ป่วยจริง ไม่แก้ schema, migration หรือ registry ท่าจริงของเพื่อน

## แผนกลางสำหรับทุกบัญชีคนไข้ (อัปเดต)

ตามคำขอล่าสุด แผน `DEMO-MOCK-KNEE` เป็นแผนกลางที่คนไข้ทั่วไปเลือกได้ ไม่จำกัดบัญชี Demo/manifest อีกต่อไป ใน `npm.cmd run dev` เปิดไว้โดยค่าเริ่มต้น เข้า `/patient/plan` ด้วยบัญชีคนไข้เดิม → เลือกแผนทดลองนั่งเหยียดขา → ตรวจ Module จากข้อมูลเดิม → ตั้งเซต/ครั้ง/ข้าง → บันทึก → แผนวันนี้ → คู่มือ → กล้อง ค่าเริ่มต้น 1 เซต × 5 ครั้ง มีท่าทดสอบเพียงท่าเดียวในแผนนี้ และไม่ซ่อนแผนจริงอื่นที่พร้อมใช้งาน

ปิดโดยตั้ง `MORE_CAMERA_TEST_MODE=0` แล้วเริ่ม server ใหม่ เปิดชัดเจนด้วย `MORE_CAMERA_TEST_MODE=1` (production ปิดโดยค่าเริ่มต้น) ไม่จำเป็นต้องเปิด `MORE_DEMO_MODE` สำหรับแผนกลาง หากฐานข้อมูลเครื่องใหม่ยังไม่มีแผนนี้ ใช้ seed ด้านล่างซึ่งรันซ้ำได้และไม่ลบข้อมูลเดิม บัญชี Demo เพิ่มเติมเป็นตัวเลือก ไม่ใช่ข้อบังคับการใช้งาน

การเลือกใช้ logic เปลี่ยนแผนปัจจุบันเดิม: แผนเดิมถูกปิดสถานะ ไม่ลบประวัติ ถ้าวันนี้มี snapshot แล้ว แผนใหม่เริ่มวันถัดไป ไม่เขียนทับรายการและผลของวันนี้ ผลทดสอบมีรหัสท่าแยกและ source template Mock; ประวัติ/ปฏิทินมีตัวเลือกผลฝึกจริงกับผลทดสอบ แสดงและนับแยกกัน หน้าแรกแสดงประวัติกลุ่มเดียวกับรายการวันนี้พร้อมป้ายโหมดทดสอบ ไม่มีการเพิ่มผลทดสอบลงแผนจริง

ตรวจเพิ่มด้วย `node scripts/test-shared-camera-plan.mjs`: สร้างบัญชีชั่วคราวสองบัญชีนอก manifest ทดสอบเลือกแผน/ข้าง/เป้าหมาย/สิทธิ์กล้อง/adapter/partial save/ประวัติ/ปิดโหมด แล้วลบเฉพาะ fixtures ของสคริปต์ ไม่อ้างว่าทดสอบกล้องคนจริงหรือ iPad จริง

## วิธีเดิมสำหรับบัญชี Demo แยก (ข้อมูลการทดสอบก่อนเปิดแผนกลาง)

```powershell
npm.cmd run demo:seed
# เตรียม assets บนเครื่องใหม่เท่านั้น (เครื่องนี้มีแล้ว)
node scripts/setup-pose-assets.mjs
npm.cmd run camera:test
```

เปิด `http://localhost:3001` แล้วใช้บัญชี HN `MORE-DEMO-CAMERA` จาก `.demo/accounts.json` (รายการคนไข้ที่สาม) รหัสเป็นข้อมูล private ของเครื่อง ไม่ commit ไฟล์นี้ Seed เพิ่มบัญชีนี้โดยไม่มอบหมายแผนอัตโนมัติ ไม่สร้างประวัติสำเร็จปลอมให้บัญชีนี้ และรันซ้ำไม่เพิ่มบัญชี/ท่า/แผนกลางซ้ำ ไม่เปลี่ยนบัญชีหมอเดิมหรือแผนคนไข้เดิม

`camera:test` ตั้ง `MORE_DEMO_MODE=1` และ `MORE_CAMERA_TEST_MODE=1` เฉพาะ process ที่เริ่ม บัญชี Demo มีข้อมูล Demo เพิ่มเติม แต่แผนกลางทดสอบและ target override ของแผนนี้เปิดให้คนไข้ทุกบัญชีตามนโยบายล่าสุด

หากต้องการปิดแผนกลาง ให้ตั้ง `MORE_CAMERA_TEST_MODE=0` และปิด `MORE_DEMO_MODE` แล้วเริ่ม server ใหม่ การใช้ `npm.cmd run dev` โดยไม่ตั้ง flags จะเปิดแผนกลางใน development ตามคำขอปัจจุบัน ข้อมูลที่บันทึกแล้วไม่ถูกลบ

## Flow ทดสอบ

1. Login → จัดการแผน `/patient/plan` → เปิด Module 2 → เลือก “นั่งเหยียดขา — ทดสอบกล้อง” เพียงท่าเดียว
2. ค่าเริ่มต้น 1 เซต × 5 ครั้ง เลือกขาซ้าย/ขวาได้ ใช้ข้อจำกัด form เดิม: เซตจำนวนเต็ม 1–20, ครั้ง 1–100; server ตรวจซ้ำและอนุญาต override เฉพาะแผน `DEMO-MOCK-KNEE` เมื่อเปิดโหมด
3. ยืนยันและบันทึก → แผนวันนี้ → คำแนะนำทดสอบ → ไปหน้ากล้อง → เปิดกล้อง → รอ “MediaPipe พร้อมใช้งาน” → เริ่ม
4. จัดกล้องด้านข้างให้เห็น hip/knee/ankle ของข้างที่เลือก จุดบนภาพมาจากโมเดลจริง ภาพและ canvas กลับซ้ายขวาด้วย CSS เดียวกัน; มุมคำนวณจาก normalized landmarks พร้อมแก้อัตราส่วนภาพ ไม่ปลอมภาพ/landmarks/มุม/จำนวนครั้ง
5. เริ่มมุม 75–105° นิ่ง 200 ms → เหยียด ≥120° นิ่ง 200 ms → กลับ 75–105° นิ่ง 200 ms จึงนับ 1 ครั้ง visibility ≥0.6, gap ไม่เกิน 1000 ms; ถ้าหาย/หลุดเฟรมให้กลับเริ่มใหม่ เป็นค่าทดสอบซอฟต์แวร์ ไม่ใช่คำแนะนำทางการแพทย์
6. พักหยุดนับและเก็บรอบครบ; ทำต่อไม่ต่อรอบที่ค้าง บันทึกก่อนครบได้ รวมศูนย์ครั้งโดยไม่สร้างมุมปลอม ออก/เริ่มใหม่ทิ้งเฉพาะเซตที่ยังไม่บันทึก ผลที่บันทึกสะท้อนแผนวันนี้และประวัติของบัญชีทดสอบ

รหัสทดสอบ `demo-knee-extension` แยกจาก `seated-leg-raise` ของจริง Reuse รหัส Demo ที่มีอยู่ ไม่สร้างท่าทดสอบซ้ำ Seed อ่าน module ผ่าน `seated-leg-raise.module_id` และ UI อ่านชื่อ module จาก DB; เอกสาร catalog ระบุ Module 2 ไม่ตีความว่าท่า Seated Leg Raise จริงได้รับการยืนยันว่าเป็น knee extension

แผนเดิม/รายวันเป็นสำเนาคงที่: ถ้าวันนี้มี snapshot แล้ว การเปลี่ยนเป้าหมายใช้วันถัดไปตามเวลาไทย ไม่ reset ข้อมูลเพื่อทดสอบใหม่ บัญชี CAMERA ที่เตรียมใหม่ยังไม่มี snapshot จึงเลือกครั้งแรกแล้วฝึกวันนี้ได้ หลังรันทดสอบ browser ในเครื่องนี้ มีแผน 2 × 5 ขาขวาและผลศูนย์ครั้ง 1 เซตสำหรับตรวจ partial save เหลืออีก 1 เซตให้ทดลองกล้องจริง; วันถัดไปเริ่มเป้าหมายตามแผนอีกครั้ง

## มือถือและ iPad ผ่าน HTTPS

HTTP ผ่าน IP เช่น `http://192.168.1.92:3001` ไม่ใช่ secure context กล้องจะอธิบายให้ใช้ HTTPS บนเครื่องเดียวกัน `http://localhost:3001` ใช้ได้ สำหรับ localhost HTTPS ใช้ `npm.cmd run camera:test:https` (Next.js สร้างใบรับรองพัฒนา)

สำหรับอุปกรณ์อีกเครื่อง ให้ใช้ใบรับรองที่มี IP LAN ของเครื่องนี้และให้อุปกรณ์เชื่อถือ CA ด้วย เครื่องนี้ตรวจพบ LAN IP `192.168.1.92` แต่ IP อาจเปลี่ยน ให้ตรวจ `ipconfig` ก่อน ใช้ mkcert ตามเครื่องมือที่ Next.js CLI รองรับ:

```powershell
# ต้องมี mkcert ใน PATH ก่อน; รันโดยผู้ใช้เพื่อจัดการ trust ของเครื่อง
mkcert -install
New-Item -ItemType Directory -Force certificates
mkcert -key-file certificates/camera-key.pem -cert-file certificates/camera.pem localhost 127.0.0.1 192.168.1.92
$env:CAMERA_TEST_KEY='certificates/camera-key.pem'
$env:CAMERA_TEST_CERT='certificates/camera.pem'
npm.cmd run camera:test:https
mkcert -CAROOT
```

บน iPhone/iPad ติดตั้งเฉพาะ `rootCA.pem` จาก CAROOT เป็น profile และเปิด trust ใน Settings → General → About → Certificate Trust Settings; อย่านำ `rootCA-key.pem` หรือ `camera-key.pem` ไปเครื่องอื่น จากนั้นเปิด Safari `https://192.168.1.92:3001` บนอุปกรณ์ที่อยู่เครือข่ายเดียวกัน อนุญาตกล้อง และทดสอบทั้งแนวตั้ง/แนวนอน Windows Firewall ต้องอนุญาต Node/port 3001 ในเครือข่าย private; ใช้ IP ที่เข้าถึงได้จริง ไม่ใช้ IP virtual adapter `192.168.56.1`

ถ้า browser เก่าไม่รองรับ Worker/OffscreenCanvas/createImageBitmap จะแจ้งให้อัปเดต ถ้าสิทธิ์กล้องถูกปฏิเสธ ให้เปิดสิทธิ์ของเว็บไซต์ ถ้ากล้องถูกแอปอื่นใช้ ให้ปิดแอปนั้น; รอสิทธิ์/โมเดลเกิน 30 วินาที หรือ inference ไม่ตอบเกิน 15 วินาทีจะหยุดรอและแจ้งข้อผิดพลาด ไม่โหลดค้าง โมเดลเสิร์ฟจาก `public/mediapipe` ภายในเว็บ หาก assets หายให้รัน setup script ข้างต้น

## ขอบเขต mock และจุดต่อท่าจริง

- `src/components/app/training-views.tsx`: หน้าเลือกแผนปกติพร้อมตัวเลือก targets/ข้างเฉพาะแผนกลาง Mock ส่งไป plan API เดิม (`camera-test-plan.tsx` เป็น component เดิมที่ route ไม่ได้ใช้แล้ว)
- `src/lib/pose/camera-test-adapter.ts`: factory ของ PoseCriteria และ thresholds ทดสอบ v1 ไม่มี clinical registry; เปลี่ยน thresholds ที่เกี่ยวกับ checkpoint ต้องสร้าง criteria/checkpoint รุ่นใหม่ให้ตรงกัน ไม่แก้รุ่นที่ผลเดิมอ้างอยู่
- `src/lib/demo-policy.ts`: flag เปิดแผนกลางทุกบัญชี ตรวจ template/รหัสท่าที่เผยแพร่จาก DB ก่อนเรียก adapter; manifest ยังใช้เฉพาะข้อมูล Demo เดิม
- `src/lib/demo-seed.ts`: seed additive/idempotent; `scripts/start-camera-test.mjs`: เปิด flags/HTTPS
- `training-service.ts` และ plan API: validation และคัดลอกเป้าหมายทดสอบเข้า plan_exercises เดิม ไม่แก้ template/แผนจริง ไม่แก้ snapshot เดิม
- `knee-camera.tsx` และ `pose/runtime.ts`: ใช้กล้อง/worker/cycle/save/retry เดิม เพิ่มมุมปัจจุบัน, ตรวจหลุดเฟรม, timeout และซ่อนแหล่งข้อมูลจำลองในโหมดนี้

เพื่อนสามารถส่ง implementation ผ่านสัญญา `PoseCriteria`/provider ที่ `recording-service.ts` ใช้อยู่ และ `approved-criteria.ts` ของท่าจริงเมื่อทีมยืนยันเกณฑ์และ metric/checkpoint รุ่นเดียวกับ DB ได้ ตัวกล้องยังส่ง `PoseFrame` จริงและบันทึก `CompletedRep[]` ตามเดิม หาก logic ของท่าจริงต้องมี state อื่น ให้ต่อ counter adapter ที่จุด `cycle.current` ใน KneeCamera โดยคง runtime/กล้อง/plan/session/save flow ไม่เอา test thresholds ไปใส่ registry จริง งานครั้งนี้ไม่แก้ `cycle.ts`, `worker.ts`, `approved-criteria.ts` หรือ implementation ท่าจริงของเพื่อน

## ผลตรวจ

Label Tracking และตัวกรองห้องแคบ: [pose-tracking.md](pose-tracking.md) ระบุ config ส่วนกลาง วิธีอ่าน vis/รอนิ่ง การกรอง jump/visibility, display-only smoothing, ผล checks และสิ่งที่ต้องตรวจกับกล้องจริง ทดสอบคน/เฟอร์นิเจอร์จริงยังไม่ได้ทำ จึงไม่รับประกันว่าจะจับเฟอร์นิเจอร์ผิดไม่ได้

ชื่อแสดงของ mock ใน camera test mode เปลี่ยนเป็น “นั่งเหยียดขา - Seated Knee Extension” ผ่าน exercise DTO เดิม ไม่เปลี่ยน code/ข้อมูล DB/เกณฑ์ ท่าจริงยังแยกเหมือนเดิม หน้ากล้องมีการ์ดคำแนะนำบนภาพเมื่อ tracking เดิมแจ้งจุดวัดไม่ชัดเจนหรือไม่พบร่างกาย แสดงหลัง MediaPipe ready และซ่อนเมื่อ tracking ใช้ได้/ปิดกล้อง ใช้สีอำพัน+ไอคอน+ข้อความชัดเจน มี live announcement และไม่รับ pointer events เพื่อไม่ขวางปุ่ม การ์ดควบคุมและข้อความโหมดทดสอบเดิมยังอยู่

คำสั่งล่าสุดให้กลับเป็นกล้องหลักเต็มจอ + การ์ดควบคุมลอยด้านล่างทั้งสองแนว: คืน preview เป็นขนาด viewport, ชื่อท่าซ้ายบนและปุ่มกล้องขวาบน ลบ frameRatio/metadata sizing และกฎการ์ดด้านข้าง Video/canvas ยังคง contain/center ไม่ยืดหรือครอป การ์ดสามารถบังส่วนล่างของภาพตาม composition ที่ผู้ใช้เลือกครั้งนี้ ผ่าน 225 browser checks / 30 responsive combinations และ lint/typecheck; ไม่ได้ตรวจ physical iPad

ปรับกรอบตามสัดส่วนภาพจริง: `.pose-camera-stage` เป็นพื้นที่ว่างสำหรับจัดภาพ และ `.pose-camera-frame` ขยายให้ใหญ่ที่สุดภายในพื้นที่นั้นตาม width/height ของวิดีโอจริง (ค่า SSR/initial client 4:3 เหมือนกัน แล้วเปลี่ยนเมื่อ metadata/pose frame มาถึง) ชื่อท่าและปุ่มยึดมุมกรอบภาพ Video/canvas ยังคง contain/center ไม่ครอป ไม่เพิ่มความละเอียดกล้อง ไม่เปลี่ยน MediaPipe/เกณฑ์/ผลบันทึก เบราว์เซอร์ไม่มี container units ใช้ contain ในพื้นที่เดิม ผ่าน 225 browser checks / 30 responsive combinations รวมทดสอบ video 16:9 เปลี่ยนจากค่าเริ่มต้น 4:3 และ lint/typecheck ยังไม่ได้ตรวจ iPad จริง

ปรับแยกพื้นที่กล้องกับการ์ดควบคุม: preview ไม่เป็นพื้นหลังใต้การ์ดอีกต่อไป ใช้คนละ grid area การ์ดอยู่ด้านล่าง หรือด้านข้างใน landscape ที่เตี้ย ชื่อท่า/เซตและเครื่องมือยังอยู่บนพื้นที่กล้อง เปลี่ยน video/canvas เป็น contain/center เพื่อแสดงเฟรมครบ ไม่ตัดขอบ ผ่าน 224 browser checks / 30 responsive combinations พร้อมตรวจ non-overlap จริงและภาพ mobile/tablet/desktop ยังไม่ได้ตรวจ physical iPad การนับ/มุม/การบันทึกไม่เปลี่ยน

แก้ layout ตามภาพ iPad 2026-10-09: ภาพผู้ใช้มี preview ตาม style เก่า แต่ชื่อท่า/side/control card ไหลใน normal document flow; ภาพเพียงอย่างเดียวไม่ยืนยันสาเหตุที่ stylesheet ไม่ถูกใช้บนเครื่องนั้น ย้าย layout หน้ากล้องออกจากท้าย `system.css` เป็น `src/components/app/pose-camera.css` และ import โดยตรงจาก `knee-camera.tsx` เพื่อโหลดพร้อม component ใช้ route class `camera-workspace` แทน `:has(.pose-session)` สำหรับซ่อน shell header/sidebar และเพิ่ม fallback `100vh` ก่อน `100dvh` กล้องเป็นพื้นที่หลักกลางจอ ชื่อท่า/เซตซ้ายบน ปุ่มกล้อง/รายละเอียดขวาบน เมนูเดิมด้านล่าง ไม่มีการเปลี่ยน camera runtime/counting/DB

ผ่าน Chromium recording regression 224 browser checks / 30 responsive combinations โดยเพิ่มการตรวจ computed style ที่โหลดจริง, title bounds, header visibility และ video/canvas fit ตรงกัน ผ่าน lint/typecheck/build ตรวจภาพ mobile/tablet/desktop แล้ว ยังไม่ได้ตรวจ Chrome/Safari บน physical iPad โดยตรง Dev server ที่ใช้ตรวจรอบนี้อยู่ port 3001; server เดิม port 3000 ตอบ ERR_EMPTY_RESPONSE ระหว่างตรวจ จึงไม่อ้างว่าได้ยืนยันผลจาก instance ในภาพผู้ใช้

ปรับภาพกล้อง 2026-10-08: ภาพสดขยายเต็มพื้นที่หน้าจอและอยู่กึ่งกลางด้วย `object-fit: cover`; canvas Skeleton ใช้ crop/ตำแหน่งเดียวกัน ชื่อท่าและเซตอยู่ซ้ายบน เมนูและ logic เดิมไม่เปลี่ยน อัตราส่วนภาพต่างจากจอจะตัดขอบภาพบางส่วน ต้องตรวจการจัดตัวให้อยู่ในเฟรมบนกล้องจริงเพิ่มเติม ผ่าน recording regression 194 browser checks / 30 responsive combinations และ lint

- Flow ใหม่ 15 checks: Login จริง, module/ท่าเดียว, ค่าเริ่มต้น, เซต/ครั้ง/ข้าง, normal plan/day/guide/camera, MediaPipe จริงบนวิดีโอว่างสังเคราะห์, permission denial, ไม่เพิ่มครั้งเอง, pause/resume, zero-rep partial save และอ่าน progress/history
- Camera policy 12 checks: validation, module เดิม, ปิด flags ซ่อนแผน/ท่า, ปฏิเสธ override และคง saved results
- Demo policy/seed ซ้ำผ่าน (13–14 checks ตามว่ามี normal fixture ใน DB หรือไม่), ไม่เปลี่ยน catalog/ข้อมูลเดิม
- Recording regression: logic 11, service 26, HTTP 5, browser 46 checks / 18 viewport/theme/font combinations; positive partial save, retry, AVG/MAX จาก peak รายครั้ง, ownership, cancelled sets และ progress
- Camera lifecycle 10 checks: MediaPipe จริงบน blank video, permission/model failure, ไม่มี phantom reps, pause และคืน worker/tracks เมื่อออก
- ภาพหน้าเลือกแผน 390/820/1440px ตรวจด้วยตาและไม่มี horizontal overflow; build, TypeScript และ lint ผ่านก่อนรอบตรวจสุดท้าย

ยังไม่ตรวจคนจริงทำท่า, ความตรงของ landmarks/มุมบนภาพคนจริง, กล้อง physical iPad/iPhone/desktop และ LAN HTTPS/certificate trust จริง ผล blank-video ยืนยันการโหลด/ประมวลผลโมเดล ไม่ใช่ความแม่นยำทางการแพทย์ ก่อนใช้ท่าจริงต้องตรวจ implementation และเกณฑ์ของเพื่อนแยกต่างหาก

คำสั่งตรวจซ้ำ (เปิด CLI sessions และ server ก่อน):

```powershell
npx.cmd --yes --package @playwright/cli playwright-cli -s=more-camera open http://localhost:3001
node scripts/test-camera-flow.mjs
node scripts/test-camera-policy.mjs
node scripts/test-demo-policy.mjs
npx.cmd --yes --package @playwright/cli playwright-cli -s=more-recording open http://localhost:3001
$env:MORE_TEST_ORIGIN='http://localhost:3001'
node scripts/test-recording.mjs
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd run build
```

Flow browser script ใช้บัญชี CAMERA และบันทึกหนึ่งเซตจริงสำหรับทดสอบ; ไม่ลบผลเพื่อรันซ้ำ ต้องมีเซตวันนี้เหลือและตรวจ snapshot ก่อน ส่วน recording regression สร้าง fixture ชั่วคราวและ cleanup เฉพาะของตน
- Current landmark/angle filtering and device-verification limits: [pose-smoothing.md](pose-smoothing.md). One quality-gated EMA supplies both counts and rendering; no additional angle filter or changed target ranges.

- Current model: `public/mediapipe/pose_landmarker_full.task`, Full float16 v1, CPU. `node scripts/setup-pose-assets.mjs` downloads the official pinned artifact and checks SHA256; fresh installs and runtime use Full. Filter/angle/counter settings are unchanged. After switching, close and reopen the camera (or reload) to replace the previous worker. Physical iPad speed/accuracy remains to test.

- Current mock preparation/counting thresholds and opt-in **Debug ท่าทดสอบ**: [mock-readiness-v4.md](mock-readiness-v4.md). Run the additive seed to provision v4; historic criteria/results remain unchanged.
