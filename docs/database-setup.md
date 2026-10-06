# การตั้งค่าฐานข้อมูล MoRe

สำหรับ Clone ครั้งแรก ให้เริ่มที่ [README.md](../README.md) ซึ่งรวมการติดตั้ง dependencies, root `.env`, auth keys, การเลือก Demo/โหมดปกติ และการเตรียม model assets เอกสารนี้อธิบายฐานข้อมูลเพิ่มเติม; ไม่ copy credentials ของเครื่องผู้พัฒนาไปเครื่องเพื่อน

## โครงสร้างและขอบเขต

- ใช้ `docs/MoRe_Database_scope_1_3 (1).dbml` เป็นแหล่งอ้างอิง ไม่ใช่ `docs/database.dbml` หรือไฟล์ `.cbml`
- PostgreSQL 17 ผ่าน service `db` ใน `compose.yml`; เครื่องพัฒนาใช้พอร์ต `5434` ต่อไปยังพอร์ต `5432` ใน container
- Prisma CLI, Client และ `@prisma/adapter-pg` ที่ตรวจจริงเป็น `7.10.0`; ไม่ต้องเปลี่ยนเวอร์ชันเพื่อทำ setup นี้
- config คือ `prisma7.config.ts`, schema คือ `prisma/schema.prisma`, migrations อยู่ที่ `prisma/migrations`
- generated client อยู่ที่ `src/generated/prisma` และไม่ส่งขึ้น Git; ต้อง generate บนเครื่องของผู้ใช้งานแต่ละคน
- `src/lib/prisma.ts` เป็น singleton ฝั่งเซิร์ฟเวอร์ มี `server-only` ป้องกันการ import จาก Client Component และใช้ PostgreSQL adapter ไม่ใช้ URL ใน browser
- งานนี้ตั้งค่า schema และการเชื่อมต่อเท่านั้น ไม่ได้เชื่อมหน้าจอ, สร้างบัญชี, seed ข้อมูลผู้ป่วย, ทำ authentication หรือ MediaPipe

## ให้เพื่อนตั้งค่าบนเครื่องตัวเอง

ใช้ Node.js/npm และ Docker Desktop ที่เปิดใช้งานอยู่ รันคำสั่งจาก root ของ repo ตัวอย่างด้านล่างใช้ PowerShell; บน macOS/Linux ใช้ `npm`/`npx` แทน `npm.cmd`/`npx.cmd`

```powershell
npm.cmd ci
Copy-Item .env.example .env
```

คำสั่ง copy ใช้เฉพาะเมื่อตนเองยังไม่มี `.env` อย่าทับไฟล์เดิม เพื่อนต้องตั้งรหัสผ่านพัฒนาใหม่ใน `.env` ของตนเอง ไม่ต้องรับไฟล์ `.env` จริงจากผู้พัฒนาอีกคน และไม่ต้องใช้ฐานข้อมูลเดียวกัน

แก้ `POSTGRES_PASSWORD` และรหัสผ่านใน `DATABASE_URL` ให้ตรงกัน ตัวอย่างใน `.env.example` ไม่ใช่ secret สำหรับใช้งานจริง อย่าใช้กับ production และอย่าตั้งชื่อ credentials ขึ้นต้นด้วย `NEXT_PUBLIC_`

```powershell
docker compose config --quiet
docker compose up -d db
docker compose ps db
```

ใช้ `config --quiet` เพื่อตรวจรูปแบบโดยไม่พิมพ์ค่ารหัสผ่าน จากนั้นใช้ migration และ generate:

```powershell
npx.cmd --no-install prisma migrate deploy --config prisma7.config.ts
npx.cmd --no-install prisma generate --config prisma7.config.ts
npx.cmd --no-install prisma migrate status --config prisma7.config.ts
npx.cmd --no-install tsc --noEmit
npm.cmd run dev
```

เครื่องใหม่จะได้ 20 ตารางตาม DBML พร้อม `_prisma_migrations` สำหรับประวัติของ Prisma แต่ยังไม่มีข้อมูล application ถ้าฐานข้อมูลมีตารางเดิมที่ไม่อยู่ในประวัติ migration ให้หยุดตรวจ schema และวางแผน baseline ก่อน ไม่ใช้ reset หรือเดาว่าลบได้

## เปิดและหยุดโดยรักษาข้อมูล

ข้อมูลอยู่ใน named volume `more_pgdata` ซึ่ง Compose อาจเติมชื่อโปรเจกต์ไว้ด้านหน้า ใช้ repo/ชื่อ Compose project เดิมเพื่อให้ mount volume เดิม

```powershell
# เปิดหรือเริ่ม container เดิม
docker compose up -d db

# หยุด container โดยไม่ลบข้อมูล
docker compose stop db

# เริ่ม container ที่หยุดไว้
docker compose start db
```

ไม่ลบ volume ไม่ใช้คำสั่ง reset/drop และไม่ตอบรับข้อความที่เสนอให้ลบข้อมูล ควรสำรองข้อมูลก่อนเปลี่ยน schema หรือย้าย volume

## พอร์ตและ environment

`.env` ต้องอยู่ที่ root ไม่ใช่ `docs/` หรือ `src/app/` ทั้ง Next.js และ Prisma config ใช้ไฟล์นี้ หากมี environment variable จาก shell อยู่แล้ว ค่านั้นอาจมีลำดับความสำคัญสูงกว่าไฟล์; อย่าพิมพ์ URL จริงออกมาระหว่าง debug

ตัวอย่างค่าพัฒนา:

```dotenv
POSTGRES_USER=more_dev
POSTGRES_PASSWORD=replace_with_your_own_dev_password
POSTGRES_DB=more
POSTGRES_PORT=5434
DATABASE_URL="postgresql://more_dev:replace_with_your_own_dev_password@localhost:5434/more?schema=public"
```

ถ้าพอร์ตชน ให้เปลี่ยนทั้ง `POSTGRES_PORT` และพอร์ตใน `DATABASE_URL` เป็นค่าเดียวกัน แล้วรัน `docker compose up -d db` และ restart Next.js พอร์ตภายใน container ยังเป็น `5432` เสมอ ตัวอย่าง URL นี้ใช้เมื่อ Next.js รันบนเครื่อง host ไม่ใช่ใน container

ชื่อผู้ใช้ รหัสผ่าน และชื่อฐานข้อมูลใน URL ต้องตรงกับ PostgreSQL ที่ initialize ไว้แล้ว อักขระพิเศษใน credentials ต้อง URL-encode เช่น `@` เป็น `%40` ควรใช้รหัสผ่านพัฒนาที่ไม่มี `$` เพื่อหลีกเลี่ยงการตีความ environment expansion ต่างกัน

เปลี่ยน `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB` ใน `.env` ไม่ได้เปลี่ยนบัญชีหรือฐานข้อมูลใน volume ที่ initialize ไปแล้ว ต้องเปลี่ยนผ่านผู้ดูแล PostgreSQL อย่างรักษาข้อมูล ห้ามลบ volume เพื่อแก้รหัสผ่าน

`.env` และไฟล์ environment จริงถูก ignore; แชร์เฉพาะ `.env.example` ที่ไม่มี secret และ migration/schema/config เท่านั้น

## Seed รายการท่า MVP

หลังใช้ migration แล้ว รันจาก root:

```powershell
npx.cmd --no-install prisma db seed --config prisma7.config.ts
```

`prisma/seed.mjs` เพิ่มเฉพาะ 2 หมวดและ 5 ท่าที่ระบุในข้อกำหนด โดยใช้ชื่อ/รหัสจาก UI เดิม รันซ้ำไม่สร้างรายการซ้ำและไม่ทับข้อมูลเดิม ทั้งหมดอยู่ใน transaction เดียว ใช้ `pg` ที่ติดตั้งอยู่เพื่อรัน standalone Node script โดยไม่ต้องเพิ่มตัวรัน TypeScript; application ยังใช้ Prisma singleton เดิม

ค่าจำนวนเซต/ครั้งเริ่มต้นใช้ defaults จาก DBML ไม่ใช่แผนที่กำหนดให้คนไข้ ไม่มีข้อมูลผู้ป่วย/บัญชีหมอ แผนกลาง แผนคนไข้ สื่อสอน การตั้งกล้อง สูตรคะแนน หรือเกณฑ์การเคลื่อนไหวเพิ่มเติม แผนกลางต้องมีผู้สร้างที่มีสิทธิ์จริงและเป้าหมาย/ตารางฝึกที่ระบุชัดก่อน seed ดูสถานะที่ `docs/training-plans.md`

## ผู้แก้ Schema

อ่าน DBML ก่อน และขออนุมัติเมื่อจำเป็นต้องเปลี่ยนแบบฐานข้อมูล ตรวจ migration status ก่อน:

```powershell
npx.cmd --no-install prisma migrate status --config prisma7.config.ts
npx.cmd --no-install prisma format --config prisma7.config.ts
npx.cmd --no-install prisma validate --config prisma7.config.ts
npx.cmd --no-install prisma migrate dev --name describe_change --create-only --config prisma7.config.ts
```

ตรวจ SQL ที่สร้างขึ้นก่อนใช้งาน โดยเฉพาะคำสั่งที่อาจทำให้ข้อมูลสูญหาย และเพิ่ม SQL สำหรับข้อจำกัดที่ Prisma schema แสดงไม่ได้ จากนั้น:

```powershell
npx.cmd --no-install prisma migrate dev --config prisma7.config.ts
npx.cmd --no-install prisma generate --config prisma7.config.ts
```

`migrate dev` ใช้ shadow database; บัญชีพัฒนาต้องมีสิทธิ์สร้างฐานข้อมูลหรือมี shadow database แยกที่ตั้งค่าอย่างเหมาะสม ห้ามใช้ฐานข้อมูลจริงเป็น shadow database ถ้า Prisma ขอ reset ให้หยุดและรายงาน drift/ประวัติ migration ไม่ยอมรับการลบข้อมูล

ส่ง schema และโฟลเดอร์ migration ใหม่ขึ้น Git พร้อมกันเมื่อผู้ใช้อนุญาต ไม่แก้ migration ที่ใช้ไปแล้ว: สร้าง migration ใหม่สำหรับการเปลี่ยนถัดไป

## ผู้ดึง Migration จาก Git

ไม่ใช้ `migrate dev` เพื่อสร้าง migration ใหม่ซ้ำกับของเพื่อน ใช้:

```powershell
npm.cmd ci
npx.cmd --no-install prisma migrate deploy --config prisma7.config.ts
npx.cmd --no-install prisma generate --config prisma7.config.ts
npx.cmd --no-install prisma migrate status --config prisma7.config.ts
```

`migrate deploy` ใช้เฉพาะ migration ที่มีอยู่ ไม่แทนการตรวจ SQL หรือการสำรองข้อมูล ทุกคำสั่ง Prisma ต้องระบุ `--config prisma7.config.ts` เพราะชื่อ config นี้ไม่ใช่ชื่อที่ CLI ค้นหาอัตโนมัติ

## ข้อจำกัดของการแปลง

- ชื่อ model ใช้ PascalCase และ `@@map` ไปชื่อ table เดิม ส่วน scalar fields คงชื่อคอลัมน์ snake_case จึงไม่จำเป็นต้องเพิ่ม `@map` ซ้ำ
- คง `INTEGER`, `SMALLINT`, `VARCHAR(n)`, `DECIMAL(p,s)`, `DATE`, `TIMESTAMPTZ(6)`, PK/FK/unique/composite keys และ defaults ตาม DBML ไม่เพิ่ม enum, `now()` หรือ `@updatedAt` ที่ต้นฉบับไม่ได้ระบุ
- DBML ไม่กำหนด delete/update actions จึงใช้ PostgreSQL `NO ACTION` ทั้งคู่ ไม่เพิ่ม cascade และ nullable FK ไม่ถูกล้างอัตโนมัติ
- เพิ่ม 11 SQL `CHECK` จากกฎที่มีใน DBML: เป้าหมาย/ความถี่/ลำดับเซตและครั้งเป็นบวก, weekday 1-7, confidence 0-1 และ effective_to มากกว่า effective_from เมื่อไม่เป็น NULL กฎเหล่านี้อยู่ใน migration ไม่ใช่ Prisma schema ต้องรักษาไว้ใน migration ถัดไป; `migrate diff` เพียงอย่างเดียวไม่ตรวจ CHECK ครบ
- กฎข้ามแถว/ตารางยังเป็นงาน API ถัดไป: สิทธิ์และความเป็นเจ้าของ, HMAC/encryption/password hashing, เลือกข้างตามท่าที่รองรับ, ช่วงเวลาแผนไม่ซ้อน, snapshot ไม่เปลี่ยนย้อนหลัง, บันทึกแบบ transaction/idempotent และล็อกรายการรายวันเพื่อไม่เกินเป้าหมาย ไม่เพิ่ม trigger/extension/ข้อจำกัดใหม่ที่เดาพฤติกรรมเกินขอบเขตงานนี้
- คะแนน สูตร และเกณฑ์การฝึกไม่ถูกสร้างขึ้นเอง ไม่มีวิดีโอหรือ pose รายเฟรม และไม่มีข้อมูลผู้ป่วยตัวอย่างในฐานข้อมูล

## ผลตรวจจริง (2026-10-04)

อัปเดต 2026-10-05: ระบบบัญชีแบบตั้งรหัสใหม่และ Profile เชื่อมแล้วโดยไม่เปลี่ยน schema/migration มีสองบัญชีสังเคราะห์จาก acceptance test ในฐานข้อมูลพัฒนา Catalog ยังคง 2 หมวด/5 ท่า กุญแจบัญชีสามตัวและวิธีตั้งค่าของแต่ละเครื่องอยู่ใน `accounts-setup.md` ข้อความจำนวนบัญชี 0 ด้านล่างเป็นผลก่อนเชื่อมบัญชี ไม่ใช่จำนวนปัจจุบัน

- ก่อน migration: `more` ที่ `localhost:5434` ไม่มี application tables หรือ migration history
- สร้าง migration `20261004095304_init` ด้วย `migrate dev --create-only`, ตรวจ/เพิ่ม CHECK และใช้ `migrate deploy` สำเร็จ ไม่ reset/drop
- ตรวจ 20 ตาราง 175 คอลัมน์กับ DBML: ชนิด/ขนาด/nullable/defaults ตรงกัน ตรวจ 29 FK และ 35 PK/unique keys ตรงกัน และมี 11 CHECK
- `format`, `validate`, `generate`, `migrate status` และ `migrate diff` ผ่าน; schema ที่ Prisma แสดงได้ไม่มี drift
- query ผ่าน server singleton และ PostgreSQL adapter: `SELECT 1` ได้ `ok=1`, ฐานข้อมูล `more`, PostgreSQL `17.11`; query model `user.count()` ได้ 0 และ import ซ้ำใช้ client เดิม การทดสอบนอก Next ใช้ตัวโหลด TypeScript ที่ติดตั้งมากับเครื่องมือและ Next server marker แบบว่างสำหรับ process ทดสอบเท่านั้น
- TypeScript `tsc --noEmit`, `npm run lint`, production `npm run build` และ `git diff --check` ผ่าน ไม่มีการนำ credentials ไปแสดงในผลตรวจ
