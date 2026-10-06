# MoRe

ระบบฟื้นฟูผู้ป่วยโรคหลอดเลือดสมองสำหรับผู้ป่วยและแพทย์/นักกายภาพ ใช้ Next.js App Router, TypeScript, PostgreSQL, Prisma และ MediaPipe รองรับมือถือ, iPad และ desktop

คู่มือนี้ใช้สำหรับ Clone และเปิดระบบบนเครื่องพัฒนาใหม่ อ่าน [AGENTS.md](AGENTS.md) ก่อนแก้โค้ด และดูสถานะล่าสุดใน [docs/checklist.md](docs/checklist.md)

## 1. ติดตั้งเครื่องมือก่อน

- Git และสิทธิ์เข้าถึง repository
- Node.js สาย 22 รุ่น 22.12 ขึ้นไป พร้อม npm (dependency ปัจจุบันรองรับ Node 20.19+, 22.12+ หรือ 24+)
- Docker Desktop: เปิดโปรแกรมและรอ engine พร้อม บน Windows ใช้ Linux containers/WSL 2
- Browser; หากทดสอบกล้องต้องอนุญาต camera permission

ตรวจใน Terminal:

```powershell
git --version
node --version
npm.cmd --version
docker --version
docker compose version
docker info
```

ตัวอย่างใช้ Windows PowerShell บน macOS/Linux เปลี่ยน `npm.cmd`/`npx.cmd` เป็น `npm`/`npx` และใช้ `cp .env.example .env` แทน `Copy-Item` โดยไม่ทับไฟล์เดิม

## 2. Clone และติดตั้ง dependencies

```powershell
git clone https://github.com/Krittheekachon/MoRe.git
cd MoRe
npm.cmd ci
```

เปิดโฟลเดอร์ `MoRe` เป็น workspace ใน IDE รันทุกคำสั่งจาก root นี้ ใช้ `npm ci` ตาม `package-lock.json` ไม่อัปเกรด Prisma/Next.js เพื่อ setup เครื่องใหม่

## 3. ตั้งค่า environment ของเครื่องตัวเอง

สำหรับ Clone ใหม่ที่ยังไม่มี `.env`:

```powershell
Copy-Item .env.example .env
```

ถ้ามี `.env` แล้วให้แก้ไฟล์เดิม ไม่ copy ทับ ไฟล์นี้อยู่ข้าง `package.json` ไม่ใช่ใน `docs/` หรือ `src/app/`

แก้ค่าใน `.env` ให้ครบ:

```dotenv
POSTGRES_USER=more_dev
POSTGRES_PASSWORD=YOUR_LOCAL_DB_PASSWORD
POSTGRES_DB=more
POSTGRES_PORT=5434
DATABASE_URL="postgresql://more_dev:YOUR_LOCAL_DB_PASSWORD@localhost:5434/more?schema=public"

AUTH_SESSION_SECRET=YOUR_FIRST_GENERATED_KEY
NATIONAL_ID_LOOKUP_KEY=YOUR_SECOND_GENERATED_KEY
NATIONAL_ID_ENCRYPTION_KEY=YOUR_THIRD_GENERATED_KEY

MORE_DEMO_MODE=0
DEMO_PORT=3001
```

แทน placeholder ทุกค่าก่อนเริ่ม ชื่อผู้ใช้/รหัสผ่าน/ชื่อฐานข้อมูล/พอร์ตใน URL ต้องตรงกับค่าข้างบน อักขระพิเศษในรหัสผ่านต้อง URL-encode ใน URL; เลือกรหัสพัฒนาที่ไม่มี `$` เพื่อลดปัญหาการตีความ environment

สร้างกุญแจด้วยคำสั่งนี้ **3 ครั้งแยกกัน** แล้วนำผลแต่ละครั้งใส่คนละช่อง:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

แต่ละค่าจะเป็น hexadecimal 64 ตัว ใช้ค่าต่างกันทั้งสามช่อง ห้าม commit หรือส่ง `.env`/กุญแจจริงให้เพื่อน อย่าเปลี่ยน lookup/encryption keys หลังมีบัญชีโดยไม่มีแผนย้ายข้อมูล

สำหรับ localhost คง `AUTH_ORIGIN` เป็น comment ตาม `.env.example` ระบบจะตรวจ origin ตาม request ถ้ากำหนดเองต้องตรงกับ URL ที่เปิด เช่น `http://localhost:3001` ต่างจาก `http://127.0.0.1:3001` และ `https://localhost:3001`

## 4. เตรียมระบบครั้งแรก — เลือกวิธี

### วิธี A: Demo สำหรับทดลองผู้ป่วยและหมอครบ flow

เหมาะสำหรับเพื่อนที่ต้องการลองทันที เปิด Docker Desktop ก่อน แล้วรัน:

```powershell
npm.cmd run demo:setup
npm.cmd run demo
```

`demo:setup` เปิด PostgreSQL → ใช้ migrations เดิม → generate Prisma Client → seed catalog → สร้างบัญชี/แผน/ผลสังเคราะห์ Demo → เตรียม MediaPipe WASM และดาวน์โหลด model ที่ตรวจ checksum ต้องมีอินเทอร์เน็ตสำหรับดาวน์โหลด

`npm run demo` เปิด Demo mode ให้ process นี้และใช้ `.next-demo` เว็บปกติใช้ `.next` ไม่ต้องเปลี่ยน `MORE_DEMO_MODE=0` ใน `.env`

| หน้า | URL เริ่มต้น |
| --- | --- |
| Login ผู้ป่วย | http://localhost:3001/ |
| Login หมอ | http://localhost:3001/doctor/login |

หมอ Demo ใช้ username `doctor` **รหัสเครื่องใหม่ถูกสุ่ม** ดูจาก `.demo/accounts.json` ใน IDE ภายในมีบัญชีหมอและผู้ป่วยสังเคราะห์สองคน ใช้เลขเข้าสู่ระบบและรหัสตามไฟล์นั้น

รหัส `12345678` ที่เปลี่ยนในเครื่องผู้พัฒนาเป็นการอัปเดตฐานข้อมูลเครื่องนั้น ไม่ส่งมากับ Git และไม่ใช่รหัสเริ่มต้นของ Clone ใหม่ การแก้ `.demo/accounts.json` อย่างเดียวไม่เปลี่ยน password hash ในฐานข้อมูล

เก็บ `.demo/accounts.json` และ `.demo/manifest.json` คู่กันในเครื่องเดิม ทั้งสองไฟล์ถูก ignore ไม่แชร์ข้ามฐานข้อมูล และไม่ลบทิ้งเพื่อ seed ทับ หมอ Demo ใช้เฉพาะเซิร์ฟเวอร์ Demo และข้อมูลสังเคราะห์ ดู flow ใน [docs/demo-ready.md](docs/demo-ready.md)

### วิธี B: Development ปกติ ไม่สร้างบัญชี Demo

ใช้แทน A หากต้องการเริ่มด้วย schema และ catalog เท่านั้น:

```powershell
docker compose config --quiet
docker compose up -d db
docker compose ps db
```

รอ container `db` เป็น `healthy` ก่อนรันต่อ:

```powershell
npx.cmd --no-install prisma migrate deploy --config prisma7.config.ts
npx.cmd --no-install prisma generate --config prisma7.config.ts
npx.cmd --no-install prisma db seed --config prisma7.config.ts
node scripts/setup-pose-assets.mjs
npm.cmd run dev
```

เปิด http://localhost:3000/ สมัครผู้ป่วยผ่าน `/register` ยืนยันข้อมูลเสร็จกลับ Login รหัสตั้งต้นเป็นเลข 4 ตัวท้ายของบัตร หรือเลือกตั้งเองอย่างน้อย 8 ตัว

วิธี B ไม่สร้างบัญชีหมอหรือแผนรักษาอัตโนมัติ จึงอาจเห็นหน้าว่างเมื่อยังไม่มีแผนจากผู้รักษา บัญชีหมอ Demo เข้าโหมดปกติไม่ได้ หากต้องการทดลองหมอให้ใช้วิธี A

คำสั่ง Prisma ต้องระบุ `--config prisma7.config.ts` generated client และ model assets ไม่อยู่ใน Git ต้องเตรียมบนแต่ละเครื่อง ดู [docs/database-setup.md](docs/database-setup.md)

## 5. เปิดครั้งถัดไป และดึงโค้ดใหม่

เปิด Docker Desktop แล้วรัน `docker compose up -d db` จากนั้นเลือก `npm.cmd run dev` หรือ `npm.cmd run demo` ไม่ต้อง setup/seed ทุกครั้ง หยุดเว็บด้วย `Ctrl+C` และหยุดฐานข้อมูลด้วย `docker compose stop db` ซึ่งรักษาข้อมูลใน volume

หลังดึงโค้ดใหม่ หาก dependencies/migrations/schema เปลี่ยน:

```powershell
git pull
npm.cmd ci
npx.cmd --no-install prisma migrate deploy --config prisma7.config.ts
npx.cmd --no-install prisma generate --config prisma7.config.ts
```

## 6. ตรวจ setup และทดลองใช้งาน

```powershell
docker compose ps db
npx.cmd --no-install prisma migrate status --config prisma7.config.ts
npx.cmd --no-install tsc --noEmit
npm.cmd run lint
npm.cmd run build
```

ฐานข้อมูลควร healthy, migrations เป็นปัจจุบัน และ checks ไม่มี error สำหรับ Demo ลอง Login ทั้งผู้ป่วย/หมอและทดสอบตาม [demo-ready.md](docs/demo-ready.md)

Camera ต้องใช้ secure context (`localhost` หรือ HTTPS) เปิดเว็บจาก IP เครื่องบน iPad ผ่าน HTTP อาจใช้กล้องไม่ได้; URL localhost บน iPad หมายถึง iPad เอง หากทดสอบผ่านเครือข่ายให้ใช้ IP ของเครื่องพัฒนาและตั้ง HTTPS ที่ browser เชื่อถือ หน้าเว็บที่ไม่ใช้กล้องตรวจ layout ผ่าน HTTP ได้ Demo เป็นข้อมูล/เกณฑ์สังเคราะห์ ไม่ใช่ระบบที่รับรองพร้อมรักษาผู้ป่วยจริง

## 7. ปัญหาที่พบบ่อย

| อาการ | ตรวจและแก้ |
| --- | --- |
| “ระบบไม่พร้อมใช้งาน” ตอนยืนยันสมัคร/Login | เปิด Docker Desktop, `docker compose up -d db`, ตรวจสถานะ healthy และ `DATABASE_URL` ให้ตรง |
| Docker daemon ไม่พร้อม / pipe not found | รอ Docker Desktop engine พร้อม |
| password authentication failed | รหัสใน URL ต้องตรงกับ volume ที่ initialize ไว้; แก้ `.env` ไม่เปลี่ยนรหัส PostgreSQL ใน volume เดิม |
| พอร์ต PostgreSQL ชน | เปลี่ยนทั้ง `POSTGRES_PORT` และพอร์ตใน `DATABASE_URL`, รัน compose ใหม่ แล้ว restart เว็บ |
| Prisma Client หาไม่พบ | รัน `prisma generate --config prisma7.config.ts` |
| ตารางยังไม่มี | ตรวจ `prisma migrate status` และใช้ `migrate deploy`; ไม่ใช้ reset/drop |
| หมอ Demo เข้าไม่ได้ | ใช้ `npm run demo` และรหัสของเครื่องนี้จาก `.demo/accounts.json` |
| “ไม่อนุญาตคำขอนี้” | ตรวจ `AUTH_ORIGIN` ให้ตรง protocol/host/port หรือคงเป็น comment บน localhost |
| สมัครหมดอายุ / ฟอร์มหายหลัง reload | เริ่มสมัครใหม่ draft บัญชีมีอายุ 15 นาที ส่วนข้อมูลฟอร์มอยู่ใน memory |
| model/WASM โหลดไม่ได้ | รัน `node scripts/setup-pose-assets.mjs` ใหม่ ต้องมีอินเทอร์เน็ต |
| มี dev server อีกตัว / พอร์ตเว็บชน | ใช้ตัวที่เปิดอยู่หรือหยุดตัวเดิม; เปลี่ยนพอร์ตปกติด้วย `node node_modules/next/dist/bin/next dev --port 3002` หรือแก้ `DEMO_PORT` สำหรับ Demo |

ห้ามใช้ `docker compose down -v`, `prisma migrate reset` หรือ drop ฐานข้อมูลเพื่อแก้ setup บนเครื่องที่มีข้อมูลแล้ว

## Antigravity และ AI coding agents

เปิด root `MoRe` เป็น workspace เอกสารใช้ UTF-8 และ path ภายใน repo ไม่ผูกกับ path ส่วนตัวของเครื่องผู้พัฒนา:

- [AGENTS.md](AGENTS.md): กฎหลักร่วมกันของทุก agent
- [GEMINI.md](GEMINI.md): จุดเริ่มต้นสำหรับ Antigravity/Gemini
- [CLAUDE.md](CLAUDE.md): อ้างกฎหลักเดียวกันสำหรับ Claude
- [docs/more.md](docs/more.md), [docs/ui-map.md](docs/ui-map.md), [docs/checklist.md](docs/checklist.md): scope, UI และสถานะล่าสุด
- [DBML](docs/MoRe_Database_scope_1_3%20%281%29.dbml): อำนาจหลักของข้อมูล/สิทธิ์ อ่านก่อนแก้งานข้อมูล
- [.agents/skills](.agents/skills): skills ใน repo ใช้เฉพาะที่ตรงกับงานและเครื่องมือใน editor พร้อม

Antigravity รองรับ `AGENTS.md`/`GEMINI.md` ตาม [เอกสาร Rules ของ Google](https://www.antigravity.google/docs/rules/) หาก agent ยังไม่อ่าน ให้เริ่มด้วย “อ่าน GEMINI.md และ AGENTS.md รวมถึง docs/more.md, docs/ui-map.md, docs/checklist.md ก่อนทำงาน”

หมายเหตุสถานะเก่าในเอกสารเป็นประวัติ ให้ใช้ข้อสรุปล่าสุดและโค้ดจริง เมื่อมีข้อขัดกันที่ยังไม่สรุปให้ถามผู้ดูแลก่อนแก้ และก่อนเขียน Next.js อ่านคู่มือของเวอร์ชันที่ติดตั้งใน `node_modules/next/dist/docs/`
