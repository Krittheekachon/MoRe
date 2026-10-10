# กล้องและการบันทึกผลรายเซต MoRe

2026-10-07: โหมดทดสอบกล้องเลือกผ่าน module และ plan API เดิมได้แล้ว ค่าเริ่มต้น 1 × 5, ข้างที่เลือกส่งผ่านแผนไปกล้อง, แสดงมุมจาก landmarks จริง และซ่อนปุ่มจำลองรอบ ใช้ test adapter แยกจาก registry ท่าจริง รายละเอียดการเปิด/ปิด บัญชี seed, LAN HTTPS และผลตรวจล่าสุดอยู่ที่ [camera-test-mode.md](camera-test-mode.md) งานนี้ไม่เปิดเกณฑ์ทางคลินิกหรือแก้ logic ท่าจริงของเพื่อน

## สถานะ 2026-10-05

### Demo Exception ที่ผู้ใช้อนุญาตล่าสุด

Compatibility note: installed Tasks Vision 1.0.1 `Landmark`/`NormalizedLandmark` exposes `visibility` but not per-point `presence`. Shared `pointConfidence()` now accepts this real API shape, still rejects missing/poor visibility and honors explicit presence when supplied. The previous default-zero presence check would reject all real landmarks; corrected and covered by synthetic angle/cycle tests. This is API compatibility, not confirmation of clinical thresholds or human-camera accuracy.

ผู้ใช้เปลี่ยนเป้าหมายเป็น Demo ครบ flow และอนุญาต engineering criteria ชั่วคราวเฉพาะ Demo โค้ด `demo-policy.ts` จึงเพิ่มเกณฑ์ให้ท่าใหม่สังเคราะห์ `demo-knee-extension` โดยต้องเปิด MORE_DEMO_MODE และตรวจเจ้าของรายการกับบัญชีใน private manifest ผ่าน DB ก่อน ไม่ใส่เกณฑ์ใน approved registry และไม่เปิดให้คนไข้จริง ท่า `seated-leg-raise` จริงยังรอการยืนยันเหมือนเดิม

KneeCamera ใช้ worker/cycle/state/save/retry เดิมทั้งกล้องทดลองและรอบจำลองแบบติดป้ายไม่ใช่ AI การจำลองป้อนตัวอย่างมุมผ่าน state machine ตามเวลาจริง ไม่เพิ่มครั้งตรง ๆ ไม่ส่งรายเฟรมไป DB Pause invalidates งานจำลองและรอบค้าง พร้อมเก็บรอบที่ทำครบไว้; reset/exit ทิ้งเฉพาะเซตที่ยังไม่บันทึก

ตรวจใหม่ใน Demo: positive partial HTTP save/retry หลัง committed response สูญหายผ่านแล้ว ผลอ่านกลับจาก PostgreSQL; flow รวมเพิ่มเติมอ่านผลทั้งคนไข้และหมอได้ พร้อมตรวจเวอร์ชันแผน/notes/permissions ผลกล้องแยกต่างหาก: 10 checks ผ่านด้วย MediaPipe จริงบนวิดีโอว่างสังเคราะห์ รวม permission/model failure, no phantom reps, pause/display state, worker/track cleanup และ nonblank video pixels **ยังไม่ทดสอบคนทำท่าจริงหรือ physical iPad** ตัวเลข acceptance เดิมด้านล่างเป็น milestone ก่อนหน้า ดู `demo-ready.md` สำหรับผลปัจจุบัน

ทำส่วนที่ไม่ติดข้อมูลทางคลินิกแล้ว: MediaPipe runtime/worker, state machine นับรอบแบบรับเกณฑ์ที่ระบุรุ่น, API จัดการเซตและบันทึกผลด้วย Prisma transaction, สรุป MAX/AVG และเชื่อมความคืบหน้ารายวัน ใช้ session และ Prisma singleton เดิม ไม่เปลี่ยน schema/DBML/migration ไม่ reset/commit/push

ยังไม่เปิดประเมินคนไข้จริง: Catalog มี `seated-leg-raise` (ยกขาขณะนั่ง) ไม่มี `seated-knee-extension` ต้องยืนยันว่าเป็นท่าเดียวกันก่อน รายงานกล่าวถึงมุมเข่าสูงสุดและเฉลี่ยใน Seated Leg Raise แต่ไม่ได้ระบุ landmarks/นิยามมุม/เกณฑ์เริ่ม–ออก–กลับ/เกณฑ์ถูกต้อง ฐานข้อมูลจริงมี angle metrics/checkpoints เป็นศูนย์ และยังไม่มีแผนที่ทีมรักษายืนยัน จึงไม่เดาเกณฑ์หรือเพิ่มท่าใหม่

หน้าเดิมของ `seated-leg-raise` ใช้กล้องและแสดงจุดร่างกายได้ พร้อมข้อความรอยืนยัน แต่ปุ่มเริ่ม/บันทึกการประเมินถูกปิด ไม่ตีความ landmarks ว่าท่าถูกต้อง ท่าอื่นยังคงกล้องตัวอย่างเดิม งานนี้ไม่ขยายการประเมินไปท่าอื่น

`src/lib/pose/approved-criteria.ts` เป็น registry ฝั่ง server ที่ยังว่าง การมี record/รุ่นใน DB เพียงอย่างเดียวไม่ใช่การอนุมัติ API เริ่มและบันทึกปฏิเสธ 422 หากยังไม่มีการยืนยันใน registry และข้อมูล DB ที่ตรงกัน ห้ามใช้ environment flag, browser payload หรือ fixture เพื่อข้ามการอนุมัติในแอปจริง

## ไฟล์หลัก

- `src/lib/pose/types.ts`, `cycle.ts`: ชนิดข้อมูล มุมเรขาคณิต และ state machine เฉพาะรอบที่ครบ
- `src/lib/pose/worker.ts`, `runtime.ts`: MediaPipe VIDEO ใน worker, หนึ่ง frame ที่กำลังประมวลผลและหนึ่ง RAF loop ต่อกล้อง
- `src/components/app/knee-camera.tsx`: กล้อง/หยุด/ทำต่อ/บันทึก/ออก/เริ่มใหม่ โดยคง component language และแผงพักเดิม
- `src/lib/recording-service.ts`: ownership, row lock ของ daily item, transaction, validation และ idempotency ใช้ unique(session_id, set_number) เดิม
- `src/app/api/patient/training/daily/[id]/recording/route.ts`: GET เกณฑ์ตาม `?side=left|right`; POST `{side}` จอง session/เซตเดิมที่ยังไม่จบ
- `src/app/api/patient/training/sets/[id]/route.ts`: PATCH `{action, elapsedSeconds}` (pause/resume/restart/exit); POST บันทึกผล
- `src/app/api/patient/training/sets/[id]/state/route.ts`: POST สำหรับ pagehide/sendBeacon โดยตรวจ Origin/session/เจ้าของเหมือน PATCH
- `scripts/setup-pose-assets.mjs`: เตรียม WASM จากแพ็กเกจที่ติดตั้งและโมเดล Lite float16 รุ่น 1 พร้อม SHA256 check
- `scripts/test-recording.mjs`, `test-recording-browser.js`: fixture สังเคราะห์แยกจาก registry/ข้อมูลใช้จริง และล้างเฉพาะข้อมูลที่สร้างในรอบนั้น

## กล้องและทรัพยากร

เพิ่ม dependency ที่จำเป็นเพียง `@mediapipe/tasks-vision` รุ่น stable 1.0.1 ไม่อัปเกรดแพ็กเกจเดิม โมเดล/WASM เสิร์ฟจาก `/mediapipe/` ภายในเว็บ ไม่ใช้ CDN ตอนเปิดกล้อง ภาพ/landmarks รายเฟรมอยู่ในหน่วยความจำ browser ไม่ส่งไป API และไม่เก็บวิดีโอ

การประมวลผล synchronous ของ MediaPipe อยู่ใน worker ไม่บล็อก UI worker โหลดโมเดลแบบ CPU มีสถานะ loading/ready/error และใช้ SDK detection/tracking defaults ซึ่งไม่ใช่เกณฑ์ทางคลินิก จำกัดส่งประมาณ 10 fps และไม่ส่ง frame ซ้ำของ video เดิม ขณะ busy ไม่สร้าง frame ค้างสะสม bitmap ทุกชิ้นถูก close หลังใช้งาน เมื่อปิด/ออกยกเลิก RAF, ปิด MediaPipe, terminate worker และหยุด tracks รวมถึงกรณีปิดหน้าระหว่างรออนุญาตกล้อง/โหลดโมเดล

อ้างอิง API: [Google MediaPipe Pose Landmarker for Web](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js) รองรับ normalized image landmarks และ world landmarks โหมด image-2d ของ logic คูณ x/y ตามขนาดภาพก่อนหามุม ป้องกันอัตราส่วนภาพทำให้มุมผิด โหมด world-3d ใช้พิกัดเมตร การเลือกโหมด/จุดวัดยังต้องยืนยัน ไม่เลือกแทนหมอ

## รอบฝึกและปุ่ม

เมื่อได้รับเกณฑ์ที่ยืนยัน: เริ่มจากจุดเริ่มที่นิ่งตาม stableMs → ออกจากช่วงเริ่มผ่าน departureMin → กลับช่วงเริ่มที่นิ่ง → เพิ่มหนึ่งครั้ง เก็บ peak ของรอบที่ครบ ไม่เก็บค่าเฉลี่ยทุก frame ตัว engine ปัจจุบันรองรับมุมที่เพิ่มเมื่อเหยียดเท่านั้น ต้องยืนยันนิยามและทิศทางก่อนอนุมัติ ไม่ใช้ค่าทดสอบเป็น clinical threshold

- Tracking ไม่ชัด/หาย, gap เกินเกณฑ์, หยุดพัก หรือทำต่อ: ทิ้งเฉพาะรอบที่ยังไม่ครบและต้องกลับจุดเริ่มใหม่ รอบที่ครบแล้วคงอยู่ frame ซ้ำ/ย้อนเวลาไม่เพิ่มผล
- หยุด: timer และ counter หยุดทันที เก็บรอบที่ครบ/มุม/เวลาสะสมใน memory แจ้ง session=paused และ set=paused ผลยังไม่อยู่ในรายงาน
- ทำต่อ: ตรวจสิทธิ์และเกณฑ์อีกครั้ง เปลี่ยน session=in_progress/set=draft ต่อเวลาจากเดิม ไม่รวมเวลาพัก ไม่ต่อรอบที่ค้างก่อนพัก การเปลี่ยนการแสดงผลไม่สร้าง worker หรือเริ่มนับใหม่
- บันทึก: หยุดรอบค้าง ส่งเฉพาะ CompletedRep แม้จำนวนครั้งไม่ถึงเป้าหมาย รองรับศูนย์ครั้งตาม schema โดยไม่สร้าง repetition หรือมุมปลอม รอ server ยืนยันก่อนทิ้ง local draft และเปิดสรุปที่ไม่มีปุ่มตั้งค่า
- ถ้ายังยืนยัน save ไม่ได้: คงผลและ payload เดิมไว้ กด retry ไป setId เดิม ระหว่างนี้ไม่ให้ทำต่อ/reset จนยืนยันผล เพื่อหลีกเลี่ยงการเปลี่ยน payload หลัง server อาจ commit แล้ว
- เริ่มใหม่/ออก: ยกเลิกเซตที่ยังไม่บันทึก ล้าง local draft เท่านั้น เซต saved ใน session เดิมยังคงอยู่ กดย้อนหน้า/ปิดแท็บพยายามแจ้ง exit แบบ sendBeacon แต่ browser ไม่รับประกันส่งถึง server จึงอาจเหลือ metadata draft/cancelled โดยไม่มีผลการเคลื่อนไหว ไม่มี draft ใดถูกนับใน progress

Local draft ไม่เก็บใน localStorage การ reload/ปิด browser ก่อนบันทึกทำให้ draft หายตาม flow ออกก่อนบันทึก แต่ผล saved ยังคงอยู่ Server ไม่สามารถพิสูจน์การเคลื่อนไหวจริงจาก client summaries เพียงอย่างเดียว จึงไม่อ้างผลทดสอบซอฟต์แวร์ว่าเป็นความแม่นยำทางคลินิก

## API และการบันทึก

POST save รับเฉพาะ side, metricId, definitionVersion, criteriaVersion, elapsedSeconds และ repetitions (startedAt/completedAt/startAngle/peakAngle/endAngle/confidence) ไม่รับ patient_id, role, score, is_correct หรือผล checkpoints จาก browser Body cap ตาม helper เดิมคือ 20 KB หากเป้าหมายสูงจน payload เกินขนาดต้องปรับขีดจำกัดด้านเทคนิคอย่างมีการตรวจสอบก่อนใช้ ไม่ใช่การจำกัดจำนวนครั้งทางการแพทย์

Server ตรวจ session คนไข้จริง เจ้าของ daily/set วันที่ไทย วันยังไม่ปิด ท่า/หมวดยังเปิด และเซต saved ยังไม่เกิน daily target ตรวจข้าง/metric/definition/checkpoint/criteria version ให้เป็นของท่าเดียวกันและตรง registry ตรวจ finite/range, timestamps ไม่ย้อน/ทับกัน, รอบกลับถึงช่วงเริ่มแล้ว, จำนวนไม่เกินเป้าหมาย และเวลาสอดคล้องกัน ไม่เชื่อ correctness จาก browser

Server คำนวณ is_correct ตาม peak range ที่ได้รับอนุมัติเท่านั้น เก็บ checkpoint results ของ start/peak/return ไม่มีสูตร quality/score หรือ angular_excursion ที่ยังไม่ตกลง หากหมอต้องการเกณฑ์อื่น เช่น ลำตัว/สะโพก/ความถูกต้องหลายจุด engine ปัจจุบันยังไม่พอและต้องขยายตามนิยามที่ยืนยันก่อนเปิดใช้

บันทึก exercise_set, repetitions, repetition_metrics, repetition_checkpoint_results และสถานะรายวันร่วม transaction เดียว ล็อก daily row เพื่อป้องกันเกินเป้าหมายแม้หลาย session/tab บันทึกพร้อมกัน คำขอซ้ำอ่าน set ที่ saved แล้วหลัง lock และเทียบผลที่เก็บจริง ถ้าตรงกันคืนผลเดิม ถ้าต่างตอบ 409 การ retry เดิมหลัง daily completed ยังทำได้ ไม่เปิด session ใหม่เมื่อครบเป้าหมาย

สรุป MAX/AVG ด้วย aggregate ของ peak_angle_deg ที่อ่านจาก saved set จริง แยก metric_id และ selected_side ไม่เพิ่มคอลัมน์สรุปหรือรวมมุมคนละข้าง หลัง save หน้า Home/วันนี้อ่าน saved sets จริง และหน้ากล้องอัปเดตจำนวนเซตจาก response/refresh

## Setup และตรวจซ้ำ

```powershell
npm.cmd ci
node scripts/setup-pose-assets.mjs
npm.cmd run dev
npx.cmd --yes --package @playwright/cli playwright-cli -s=more-recording open http://localhost:3000
node scripts/test-recording.mjs
npx.cmd --yes --package @playwright/cli playwright-cli -s=more-recording close
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd run build
```

Generated assets อยู่ใน public/mediapipe และถูก ignore ให้รัน setup ก่อน dev/build/deploy เครื่องเพื่อน โมเดล SHA256: `59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a` ไม่มี raw patient ID/password/cookie ในผลลัพธ์ทดสอบ Fixtures สร้างบัญชีสังเคราะห์สองบัญชี ท่าสำหรับทดสอบและเกณฑ์สมมติแยกต่างหาก ไม่เพิ่มลง seed/registry ไม่แก้ catalog ใช้จริง และล้างใน finally ตาม ID/ชื่อที่เป็นเจ้าของ หาก cleanup failed ให้ตรวจเฉพาะ MoRe Recording Test ก่อนรันซ้ำ

## ผลตรวจแยกตามประเภท

**Logic:** 11 checks ผ่าน: debounce/หนึ่งรอบ/peak/ไม่ซ้ำ, tracking loss/gap, หยุด–ทำต่อไม่ต่อรอบค้าง, ไม่เก็บรอบค้าง, reset, มุมตาม aspect ratio และ visibility ตัวเลขเกณฑ์ทั้งหมดเป็น fixture สำหรับทดสอบอัลกอริทึม ไม่ใช่เกณฑ์ที่หมอยืนยัน

**Prisma service กับ PostgreSQL จริง:** 26 checks ผ่าน: จองเซตพร้อมกันได้ ID เดียว, คนไข้สองบัญชีแยกสิทธิ์, ปฏิเสธ correctness/metric injection และรอบค้าง, pause/resume metadata, partial save 2/10 ครั้ง, retry พร้อมกันไม่ซ้ำ, MAX=150/AVG=142.5 ของ fixture, ผลผิด peak ยังนับเป็นรอบครบ, changed retry 409, reset/exit ไม่ลบ saved, cancelled resume/save ถูกปฏิเสธ, zero-rep ไม่สร้างมุม, ไม่เกิน daily target และ progress จาก DB จริง Provider เกณฑ์ fixture inject เฉพาะใน test process ไม่เข้า API แอปจริง

**HTTP API จริง:** 5 checks ผ่าน: Login fixture, ต้องมี session, cross-owner 404, cross-origin 403 และเกณฑ์ยังไม่อนุมัติ 422 HTTP positive save ครบ flow ยังตรวจไม่ได้ เพราะ production registry ยังว่าง ไม่ bypass gate เพื่ออ้างว่าผ่าน

**Browser/โมเดลจริงกับกล้องจำลอง:** 46 checks ผ่าน รวม responsive 18 ชุด (390/820/1440px × light/dark × m/l/xl โดยตรวจ dataset ยืนยัน preference จริง) ไม่มี horizontal overflow ตรวจ screenshots ใหญ่สุด โหลดโมเดลจริงแล้ว detect วิดีโอว่างจำลองไม่เกิด rep ทดสอบ permission denied/model download failure, ปิด/เปิดใหม่/ออกมี worker เดียวและคืน worker/tracks

**กล้องคนทำท่าจริง:** ยังไม่ได้ตรวจ ไม่ได้ใช้ผู้ป่วยจริง ยังไม่ยืนยันความแม่นยำ 2D/3D, ความเสถียรบน iPad/มือถือจริง, มุมกล้อง/ข้างที่บัง, feedback ถูกต้อง หรือ flow นับ→พัก→partial save ของท่าที่หมอยืนยัน TypeScript/lint/build ผ่านไม่ใช่การรับรอง clinical readiness

Regression แผนฝึกเดิมผ่านอีกครั้ง: 28 service/123 browser checks และ 96 responsive combinations หลังเพิ่มระบบกล้อง Aggregate หลัง cleanup ยืนยัน 2 หมวด/5 ท่าเดิม และ metrics/checkpoints/templates/sets = 0 ไม่มี fixture criteria หรือผลฝึกสมมติหลงเหลือ `git diff --check` ผ่าน

ข้อสังเกต toolchain: npm install รายงาน Node engine warning ของ @prisma/streams-local และ 9 high vulnerabilities; ไม่อัปเกรดแพ็กเกจหรือรัน audit fix --force ในงานนี้ ระหว่างทดสอบ concurrent transactions มี pg deprecation warning เรื่อง client.query ขณะมี query ทำงานอยู่ แม้ assertions ผ่าน ไม่อ้างว่า warnings เหล่านี้ถูกแก้หรือพร้อม production ด้านความปลอดภัยแล้ว

## ข้อมูลที่ต้องขอทีมรักษา

1. ยืนยัน seated knee extension ตรงกับ seated-leg-raise ใน catalog หรือเป็นคนละท่า หากเป็นท่าใหม่ ต้องอนุมัติข้อมูล catalog/ขอบเขตก่อนเพิ่ม
2. จุด landmark ของข้างซ้าย/ขวา นิยามมุม interior/มุมอื่น แกนอ้างอิง 2D/3D และทิศทางที่มุมเพิ่ม/ลด
3. ช่วงจุดเริ่ม, departure threshold, ช่วงกลับ และช่วง peak ที่ถือว่าถูกต้อง พร้อม checkpoint codes/phases และ definition/criteria version
4. เกณฑ์การ tracking/visibility, เวลานิ่ง, gap และเกณฑ์ความถูกต้องเพิ่มเติมหรือเงื่อนไขหยุดที่ต้องตรวจ หากใช้มากกว่า peak range ต้องทำตามนั้นก่อนเปิด
5. ข้างที่ฝึก/กติกา both, มุมกล้องและการเห็นจุดครบ, วิธีจัดกล้อง/สื่อแนะนำที่ยืนยัน
6. แผนกลางที่หมอเป็นผู้สร้างจริง พร้อมเซต/ครั้ง/ความถี่/วันฝึก และวิธีรับรองข้อมูล/เวอร์ชันก่อนใส่ registry

หลังได้ข้อมูลจึงเพิ่ม definition/checkpoint ที่ยืนยันใน schema เดิมและ registry อ้าง IDs/รุ่นตรงกัน แล้วตรวจด้วยวิดีโอที่ได้รับอนุญาตและกล้องอุปกรณ์จริงก่อนเปิดให้คนไข้ ไม่ใช้ค่าจาก fixture เป็น prescription

## Repetitions beyond the target (2026-10-10)

PoseCamera no longer auto-pauses at target repetitions, for live camera or the existing Demo simulation. The target is a display goal; the completed count can show 7 / 5. Stop or Save still uses the existing pause/save lifecycle. Recording validation no longer rejects repetitions solely for exceeding exercise_sets.target_reps; elapsed time, completed-round validation, ownership, correctness, retry idempotency and cancelled-set protections remain unchanged. All accepted repetitions are stored through the existing schema without truncation; saved-set progress is unchanged.

Shared-plan recording regression now saves seven repetitions for a five-repetition target and confirms all seven stored rows. Passed 17 checks plus lint/typecheck. Actual camera motion and physical iPad review remain pending.
## Reset retains camera/model and correctness diagnostics (2026-10-10)

Confirmed Reset issue: discard(false) cleared both active criteria and measurement preview criteria. The stream/worker were not explicitly closed, but losing the definition stopped angle/skeleton processing until another Start. Reset now retains the existing preview criteria while clearing the draft counter, countdown/preparation and local result; camera stream and model worker remain unchanged. Exit still closes resources. Camera debug shows the latest completed repetition peak rounded to the same two decimals as save correctness, plus its actual correct/incorrect decision and target bounds; unfinished/cancelled repetitions do not become correct repetitions.

Confirmed semantic distinction: feedback can turn green at 160–170 before an eventual peak above 170; current correctness evaluates the maximum of a completed round, not merely passing through the target. A clarification is pending before changing this accepted criterion. No correctness thresholds/schema/real-exercise implementation were changed in this update. Feedback 79 and readiness 259 tests pass, as do lint/typecheck. Physical iPad/human motion remains pending.
- Reset preview fix verified: Chromium camera hydration/lifecycle 56 checks passed, including unchanged worker count (1), live original track and continued blank-frame guidance after Reset; zero hydration warnings. Shared recording 17 plus lint/typecheck passed. Correctness semantic clarification remains pending; last-completed peak/decision debug added. Physical iPad pending.
