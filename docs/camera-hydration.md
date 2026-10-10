# Hydration ของช่องเลือกข้างหน้ากล้อง (2026-10-07)

## หลักฐานและขอบเขตข้อสรุป

ตรวจ Next.js 16.3.8 / React 19.2.8 ค้นใน app runtime, scripts และ JS ของ Next/React/MediaPipe ไม่พบ runtime ที่สร้าง `__gcruniqueid`; scripts ที่มีชื่อนี้เป็น controlled regression เท่านั้น ไม่ได้ส่งให้หน้าแอป

Chromium profile สะอาด: กั้น client scripts แล้วเทียบ HTML document response กับ DOM ของช่องเลือกข้างก่อน hydration พบ markup ตรงกันทั้งแผนกำหนดข้างขวาและแผนข้างว่าง ไม่มี attribute นี้ใน response และไม่มี warning เมื่อปล่อย scripts ตามปกติ ไม่พบหลักฐานว่า value/disabled หรือ HTML nesting เป็นสาเหตุของ diff นี้

ก่อนแก้ การเติม `__gCrUniqueID="1"` บน native select ก่อน hydration ทำให้เกิด warning ตามชื่อ attribute ทั้งสองประเภทแผน (baseline 25 browser checks) ยืนยันกลไก attribute ภายนอก แต่ไม่ยืนยันต้นทาง/เวลา injection บน iPad เครื่องผู้ใช้ ดูหลักฐาน Chromium iOS Autofill ใน [plan-hydration.md](plan-hydration.md)

## การแก้

`src/components/app/knee-camera.tsx` เปลี่ยน select เป็น group ชื่อ “ข้างที่ฝึก” และปุ่ม type=button สองตัว ใช้ aria-pressed, เครื่องหมายถูกและขอบหนาแสดงข้างที่เลือก ข้างว่างแสดง “เลือกข้างที่ฝึก” ใช้ side/setSide และเงื่อนไข disabled เดิมทั้งหมด ไม่เพิ่ม state ใหม่ ไม่เปลี่ยน engine, มุม, การนับ, payload หรือ DB ไม่เพิ่ม suppression หรือ script ลบ attribute

`src/app/system.css` เพิ่มเฉพาะรูปแบบปุ่มเลือกข้างและ focus indicator ขนาดสัมผัสขั้นต่ำ 44px รักษา layout กล้องและการ์ดเดิม

หลังแก้ controlled native-select injection ไม่พบเป้าหมาย select แล้ว และไม่มี warning ทั้งสี่กรณี; ไม่ใช่หลักฐานว่า browser ภายนอกจะไม่เปลี่ยน element อื่น ตรวจ HTML/DOM และ console แยกต่างหากด้วย

## รันทดสอบซ้ำ

ใช้ dev server ที่เปิด camera test mode และ PostgreSQL ของโปรเจกต์ เปิด Chromium session `more-recording` ตาม `.agents/skills/playwright/SKILL.md` ก่อน แล้วรัน PowerShell:

```powershell
$env:MORE_TEST_ORIGIN='http://localhost:3001'
$env:MORE_CAMERA_HYDRATION='1'
$env:MORE_HYDRATION_BASELINE='0'
node scripts/test-recording.mjs
```

`scripts/test-camera-hydration-browser.js` ตรวจ server/pre-hydration DOM, เปิด URL ตรง, network reload สองครั้งต่อกรณี และ navigation; ตรวจแผนกำหนดข้าง/ข้างว่าง การเลือกซ้าย–ขวา และไม่เปิดกล้องอัตโนมัติ ใช้บัญชี/แผนชั่วคราวของ recording runner ล้างเฉพาะ fixtures ของตัวเองใน finally

เพิ่ม lifecycle test โดยใช้ canvas stream ว่างแทนกล้องอุปกรณ์ แต่โหลดและประมวลผล MediaPipe จริง: ตรวจล็อกข้าง เปิดกล้อง worker เดียว เริ่ม/หยุด/ทำต่อ รีเซ็ต บันทึก partial 0 ครั้งด้วยข้างซ้าย และคืน tracks/worker ไม่มี landmarks หรือ rep ปลอม

## สิ่งที่ต้องตรวจบนอุปกรณ์จริง

ผลตรวจหลังแก้: 50 browser checks ผ่าน และ 11 logic / 26 service / 5 API checks ผ่าน ไม่มี hydration warnings ในสี่กรณี ไม่มี unexpected console/page errors ใน lifecycle (MediaPipe มี INFO XNNPACK initialization ทาง stderr ซึ่งชุดทดสอบจำแนกเฉพาะบรรทัดนี้ ไม่ซ่อน console ของแอป) บัญชีชั่วคราวถูกล้างแล้ว Lint, TypeScript noEmit, production build และ skill validator ผ่าน

ชุด recording regression เดิมผ่านอีก 194 browser checks รวม 30 responsive combinations ของ mobile/tablet/desktop, light/dark และ font sizes โดยใช้ MediaPipe จริงบน synthetic blank video

ยังไม่ได้ทดสอบกล้องคนจริงหรือ Chrome/Safari บน iPad จริง เปิด URL camera ของแผนที่กำหนดข้างและแผนข้างว่างใน Chrome แล้ว Safari ปิด translation/extensions ระหว่างเปรียบเทียบ เปิดตรงและ hard refresh หลายครั้ง พร้อมดู console ตรวจเลือกข้าง ล็อกข้าง เปิดกล้อง เริ่ม–หยุด–ทำต่อ รีเซ็ต บันทึก และออก หากยังมี warning เก็บ exact diff ของ element/attribute ที่เหลือ ไม่ขยาย suppression
