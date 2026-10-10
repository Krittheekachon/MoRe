---
name: "playwright"
description: "Use when the task requires automating a real browser from the terminal (navigation, form filling, snapshots, screenshots, data extraction, UI-flow debugging) via `playwright-cli` or the bundled wrapper script."
---


# Playwright CLI Skill

Drive a real browser from the terminal using `playwright-cli`. Prefer the bundled wrapper script so the CLI works even when it is not globally installed.
Treat this skill as CLI-first automation. Do not pivot to `@playwright/test` unless the user explicitly asks for test files.

## Prerequisite check (required)

Before proposing commands, check whether `npx` is available (the wrapper depends on it):

On Windows PowerShell, use `Get-Command npx.cmd -ErrorAction SilentlyContinue`.
Use the POSIX check below on macOS/Linux or Git Bash.

```bash
command -v npx >/dev/null 2>&1
```

If it is not available, pause and ask the user to install Node.js/npm (which provides `npx`). Provide these steps verbatim:

```bash
# Verify Node/npm are installed
node --version
npm --version

# If missing, install Node.js/npm, then:
npm install -g @playwright/cli@latest
playwright-cli --help
```

Once `npx` is present, proceed with the wrapper script. A global install of `playwright-cli` is optional.

## Skill path (set once)

This copy is installed in the repository at `.agents/skills/playwright/`.
When using this copy, resolve scripts and references relative to this skill folder,
not a hardcoded user home directory. From the repository root in Bash:

```bash
export PWCLI="$PWD/.agents/skills/playwright/scripts/playwright_cli.sh"
```

On Windows PowerShell, invoke the CLI directly without the Bash wrapper:

```powershell
npx.cmd --yes --package @playwright/cli playwright-cli --help
npx.cmd --yes --package @playwright/cli playwright-cli open http://localhost:3000 --headed
npx.cmd --yes --package @playwright/cli playwright-cli snapshot
```

The first invocation may download the CLI; follow the environment's network and
approval requirements. For a user-scoped installation instead, use:

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"
```

User-scoped skills install under `$CODEX_HOME/skills` (default: `~/.codex/skills`).

## Quick start

Use the wrapper script:

```bash
"$PWCLI" open https://playwright.dev --headed
"$PWCLI" snapshot
"$PWCLI" click e15
"$PWCLI" type "Playwright"
"$PWCLI" press Enter
"$PWCLI" screenshot
```

If the user prefers a global install, this is also valid:

```bash
npm install -g @playwright/cli@latest
playwright-cli --help
```

## Core workflow

1. Open the page.
2. Snapshot to get stable element refs.
3. Interact using refs from the latest snapshot.
4. Re-snapshot after navigation or significant DOM changes.
5. Capture artifacts (screenshot, pdf, traces) when useful.

Minimal loop:

```bash
"$PWCLI" open https://example.com
"$PWCLI" snapshot
"$PWCLI" click e3
"$PWCLI" snapshot
```

## When to snapshot again

Snapshot again after:

- navigation
- clicking elements that change the UI substantially
- opening/closing modals or menus
- tab switches

Refs can go stale. When a command fails due to a missing ref, snapshot again.

## Recommended patterns

### Form fill and submit

```bash
"$PWCLI" open https://example.com/form
"$PWCLI" snapshot
"$PWCLI" fill e1 "user@example.com"
"$PWCLI" fill e2 "password123"
"$PWCLI" click e3
"$PWCLI" snapshot
```

### Debug a UI flow with traces

```bash
"$PWCLI" open https://example.com --headed
"$PWCLI" tracing-start
# ...interactions...
"$PWCLI" tracing-stop
```

### Multi-tab work

```bash
"$PWCLI" tab-new https://example.com
"$PWCLI" tab-list
"$PWCLI" tab-select 0
"$PWCLI" snapshot
```

## Wrapper script

The wrapper script uses `npx --package @playwright/cli playwright-cli` so the CLI can run without a global install:

```bash
"$PWCLI" --help
```

Prefer the wrapper unless the repository already standardizes on a global install.

## References

Open only what you need:

- CLI command reference: `references/cli.md`
- Practical workflows and troubleshooting: `references/workflows.md`

## Guardrails

- Always snapshot before referencing element ids like `e12`.
- Re-snapshot when refs seem stale.
- Prefer explicit commands over `eval` and `run-code` unless needed.
- When you do not have a fresh snapshot, use placeholder refs like `eX` and say why; do not bypass refs with `run-code`.
- Use `--headed` when a visual check will help.
- When capturing artifacts in this repo, use `output/playwright/` and avoid introducing new top-level artifact folders.
- Default to CLI commands and workflows, not Playwright test specs.

## การป้องกันและตรวจสอบ Hydration Mismatch

### ตรวจหน้ากล้องที่มี preparation gate และ labels

- เมื่อทดสอบ mock ของ MoRe ให้แยก test thresholds จาก clinical definition และใช้ engine เดิม ห้ามใช้ “ท่าเตรียมผ่าน” เป็นหลักฐานว่าตรวจพบเก้าอี้จริง หรือใช้ visibility ตัดสินข้างใกล้กล้อง
- ท่าด้านข้างต้องทดสอบกรณีขาอีกข้างถูกบังเป็นสถานการณ์ปกติ: mock นั่งเหยียดขาใช้ hip–knee–ankle ของข้างที่เลือกเพื่อวัด/นับ และ shoulder–hip–knee เพื่อเตรียมลำตัว ไม่ใช้ opposite-side visibility/presence เป็น permission นับ ทดสอบเต็มรอบผ่าน quality/EMA/gate/counter ทั้งสองข้าง รวมอีกข้างเห็นชัดกว่าแต่ข้างที่เลือกหายต้องหยุด ห้ามสลับ index ตาม CSS mirror ผล depth ที่ข้อมูลไม่ครบต้องเป็น “ไม่สามารถยืนยัน” แยกจาก direction lock; แม้ข้อมูลสองข้างชี้ข้างใกล้กว่า ก็ไม่อ้างว่าเป็น identity/depth ที่ยืนยันทางกายภาพ ต้นเหตุที่พบในโค้ดคือ bilateral gate และ snapshot mock เก่า; ยังไม่ได้ตรวจ iPad จริง ดู [mock-readiness-v4.md](../../../docs/mock-readiness-v4.md)
- เมื่อ readiness/counter ไม่คืบหน้า ให้แยก gate จาก state machine และดู test-only debug ก่อนปรับค่า ตรวจ timer ด้วย timestamp และ invalid intervals: grace ต้องไม่สะสมเวลาที่ไม่ผ่านหรือใช้ค่าค้าง ตรวจ orientation lock หลังเตรียมผ่านและ reset หลังพัก/long loss เพิ่ม criteria version/checkpoints แบบ additive พร้อมรักษานิยามเก่า หลักฐาน v4: fixture เข่า 95° ถูก v3 ปฏิเสธ, ขอบมุมทำ timer reset; ไม่ถือว่าเป็นหลักฐานว่าทราบ root cause บน iPad จริง ดู [mock-readiness-v4.md](../../../docs/mock-readiness-v4.md)
- ตรวจทั้งสองข้างด้วย raw-frame direction/depth หลายจุด แล้วตรวจ mirrored preview แยกกัน Index ซ้าย/ขวาต้องไม่เปลี่ยนตาม CSS mirror มุม 2D ต้องใช้ intrinsic width/height ไม่ใช่ CSS viewport
- ตรวจ label/two-angle alignment, non-overlap กับ header/card และ stale-angle removal เมื่อจุดหาย ตรวจ pipeline ปัจจุบันก่อนเพิ่ม filter: หลังงาน 2026-10-09 MoRe ใช้ EMA ชั้นเดียวหลัง quality gate สำหรับทั้งการวาด/มุม/counter/recorded peaks ไม่ใช่ display-only อีกแล้ว ห้ามซ้อน filter โดยไม่วัด lag ทดสอบ timestamp sequences สองข้าง prepare→departure→return, jitter, short suspension/long interruption และ pause/reset/save ผ่าน shared counter ดู [pose-smoothing.md](../../../docs/pose-smoothing.md) สำหรับ config และข้อจำกัดอุปกรณ์จริง
- เปิด camera URL ตรงและ reload/navigation พร้อม console ทุกครั้งที่เปลี่ยน initial display state: gate/ref/angle เริ่มว่างเหมือน SSR ไม่อ่าน browser API ระหว่าง initial render ไม่เพิ่ม suppression เพื่อกลบ mismatch
- ใช้ [knee-preparation-test.md](../../../docs/knee-preparation-test.md) สำหรับ mock v3 และ scripts ที่อ้างในนั้น ตัวเลขเป็น fixture ปรับได้ ห้ามนำไปบังคับทุกท่า รายงาน synthetic landmarks/blank video/physical iPad แยกตามหลักฐานจริง เก็บ skill ใน repo นี้ตาม workflow เดิม ไม่สร้าง global copy ซ้ำ

### ตัวเลือกสองค่าและกรณีหน้ากล้อง

- ตัวเลือกสองค่า เช่น ซ้าย/ขวา ใช้ segmented control เมื่อเหมาะกับ UX: group มี accessible name, ปุ่ม `type="button"` พร้อม `aria-pressed`, focus indicator และแสดงการเลือกด้วยเครื่องหมาย/ขอบร่วมกับสี ข้างว่างต้องไม่เลือกทั้งสองปุ่มและมีคำแนะนำ ใช้ state/handler และเงื่อนไขล็อกเดิม รวมข้างที่แผนกำหนด ห้ามสร้าง state ซ้ำหรือเปลี่ยน payload
- ตรวจ server response เทียบ DOM ก่อน hydration รวม initial render, direct URL, refresh หลายครั้ง และ internal navigation พร้อม console ก่อนรายงานผล ห้ามใช้ suppression เพื่อกลบ diff นี้ หรือถือว่าการเปลี่ยน element ยืนยันต้นเหตุได้
- หลักฐานหน้ากล้อง 2026-10-07: native select มี HTML/DOM ตรงกันและไม่เตือนใน Chromium profile สะอาดทั้งข้างที่กำหนดและข้างว่าง; controlled external `__gCrUniqueID` บน select ก่อน hydration ทำให้เกิด warning ทั้งสองกรณี หลังเปลี่ยนเป็นปุ่มไม่มี native select เป้าหมายและ regression ไม่เตือน ไม่พบหลักฐาน value/disabled เป็นสาเหตุ ต้นทางและเวลา injection บน iPad จริงยังไม่ได้ยืนยัน อ่าน [camera-hydration.md](../../../docs/camera-hydration.md)
- เก็บและแก้ skill ฉบับ repository นี้โดยตรง ไม่สร้าง skill ซ้ำหรือคัดลอกไป global โดยพลการ ตรวจ workflow sync ของ repository ก่อนเสมอ; การตรวจครั้งนี้ไม่พบคำสั่ง sync skill จึงไม่อ้างว่าซิงก์สำเนาภายนอกแล้ว

ใช้หัวข้อนี้กับการพัฒนาและตรวจ UI ของ MoRe เมื่อแก้ component, form, theme, font size หรือหน้ากล้อง อ่าน `AGENTS.md`, เอกสารที่เกี่ยวข้อง และคู่มือ Next.js เวอร์ชันที่ติดตั้งก่อนแก้ ไม่ถือว่าบั๊ก hydration ทุกครั้งมีสาเหตุเดียวกับตัวอย่างด้านล่าง

### ป้องกันก่อนแก้และตรวจ initial render

- ทุกครั้งที่แก้ส่วนเหล่านี้ ให้ตรวจว่า HTML จาก server และ client render ครั้งแรกตรงกัน ทั้งโครงสร้างและ attributes ก่อน lifecycle ฝั่ง client อัปเดต state
- ห้ามอ่าน `window`, `navigator`, `localStorage` หรือ `matchMedia` ระหว่าง render เพื่อสร้างผลลัพธ์ที่ต่างจาก server รวมถึง lazy initializer ของ state ใช้ค่าเริ่มต้นที่ตรงกัน เช่นค่าจาก server/cookie ที่ส่งผ่าน props แล้วอัปเดต browser preferences ใน `useEffect` หรือ lifecycle ฝั่ง client ที่เหมาะสม ใช้ CSS breakpoint สำหรับ responsive composition
- ตรวจ `Date.now()`, `Math.random()`, ID ที่สร้างใหม่ และการจัดรูปแบบวันที่/เวลาที่ขึ้นกับ locale/timezone ใช้ข้อมูลเริ่มต้นที่ส่งจาก server และ locale/timezone ที่ระบุชัดเมื่อแสดงผล ห้ามแก้ด้วยการสร้างค่าที่ไม่แน่นอนซ้ำบน client
- ตรวจ HTML nesting ที่ browser อาจจัดโครงสร้างใหม่ เช่น nested button/link หรือ block element ใน paragraph ตรวจค่าเริ่มต้น form โดยเฉพาะ `value`, `checked`, `disabled`, options ของ select และ controlled/uncontrolled state ให้ตรงกันบน server/client

### แยกบั๊กแอปจาก DOM ที่ถูกแทรก

- เมื่อพบ attribute ที่ไม่รู้จัก เช่น `__gcruniqueid` ให้ค้นหาใน source และ dependency ก่อน เทียบ document response จาก server กับ DOM ก่อน hydration หากเครื่องมือรองรับ อาจพัก client scripts เพื่อจับ DOM ก่อน React ทำงาน บันทึกความแตกต่างของ application-owned attributes แยกจาก attributes ภายนอก ไม่เก็บ HTML/credentials ของผู้ป่วยลง log หรือ artifact ที่เผยแพร่
- ทดสอบ browser profile สะอาดที่ปิด extensions และการแปลหน้าเว็บ แล้วเปรียบเทียบ Chrome/Safari ตามอุปกรณ์ที่เข้าถึงได้ ก่อนสรุปว่าเกิดจาก browser injection; browser เองอาจแทรก attribute ได้แม้ไม่มี extension การจำลอง injection ยืนยันกลไกได้ แต่ไม่ยืนยันว่าอุปกรณ์จริงแทรก attribute ด้วยเวลา/วิธีเดียวกัน
- ห้ามเพิ่ม attribute ภายนอกลง JSX หรือใช้ script ลบ attributes ทั่ว DOM เพื่อกลบความต่าง
- ไม่ใช้ `suppressHydrationWarning`, ปิด SSR ทั้งหน้า หรือซ่อน error overlay/`console.error` เป็นวิธีแก้เริ่มต้น หากหลักฐานยืนยันว่าหลีกเลี่ยงความต่างภายนอกไม่ได้และจำเป็นต้อง suppress ให้จำกัดเฉพาะ element ที่ได้รับผล ตรวจ mismatch อื่นบน element นั้นก่อน และใส่ comment อธิบายหลักฐาน/เหตุผล เพราะ suppression ครอบคลุม mismatch บน element นั้น ไม่ได้กรองเฉพาะชื่อ attribute หรือแก้ HTML ให้ตรงกัน ห้ามขยายไปทั่วแอป

### ตรวจใน browser และรายงานผล

- เปิด URL โดยตรง, refresh และเข้าหน้าผ่าน navigation ภายในแอป ตรวจ console/React hydration warnings ประกอบกับ DOM และการใช้งานจริง รวม theme/font sizes และการเลือก/ค้นหา/บันทึก form ที่เกี่ยวข้อง ผล lint/typecheck/build อย่างเดียวไม่ยืนยันว่า hydration ผ่าน
- หากมี suppression ให้ตรวจ application-owned attributes แยกต่างหาก และใช้ negative control เมื่อเหมาะสมเพื่อยืนยันว่าคำเตือนบน element อื่นยังแสดง ห้ามใช้การไม่มี warning หลัง suppression เป็นหลักฐานเพียงอย่างเดียว
- หน้ากล้องต้องเริ่มในสถานะปิดเหมือนกันบน server/client การแก้ต้องไม่เปิดกล้องเอง ไม่โหลด MediaPipe/สร้าง worker ซ้ำ ไม่รีเซ็ตเซตหรือผลฝึก ตรวจเปิด–ปิด, พัก–ทำต่อ, navigation และการคืน camera tracks/worker ตาม lifecycle เดิม
- รายงาน browser/engine, อุปกรณ์จริงหรือ viewport จำลอง, วิธีเทียบ SSR/DOM และสิ่งที่ตรวจแล้วตามจริง Desktop WebKit และ viewport ขนาด iPad ไม่เท่ากับทดสอบ Safari/Chrome บน iPad จริง ระบุรายการที่ผู้ใช้ต้องตรวจต่อบน iPad

### ตัวอย่าง MoRe: หน้าเลือกแผน (2026-10-07)

**ข้อค้นพบที่ยืนยันได้จากการตรวจครั้งนั้น**

- ในเส้นทาง root/theme/font/search ของ `/patient/plan` ไม่พบ runtime app/dependency ที่สร้าง attributes ดังกล่าว ค่าเริ่มต้น theme/font มาจาก cookie/props และ search เริ่มเป็นค่าว่าง การเทียบ server response กับ DOM ก่อนปล่อย client scripts ใน Chromium profile สะอาดพบ attributes ของ `<html>` และ search input ตรงกัน และไม่มี attributes Chrome ใน server HTML
- Chromium iOS Autofill source ที่อ้างอิงใน [หลักฐานการตรวจ](../../../docs/plan-hydration.md) สร้าง `__gCrUniqueID` บน field และ `__gCrRemoteFrameToken` บน root HTML ชื่อใน HTML DOM ถูกแปลงเป็นตัวพิมพ์เล็ก: `__gcruniqueid` และ `__gcrremoteframetoken` (มี `r` ติดกันสองตัว)
- การแทรก root token/field ID แบบควบคุมก่อน hydration ทำให้เกิดสอง warnings ตามตำแหน่งที่รายงาน ขณะที่ clean light/dark/system ไม่เกิด warning จึงยืนยันกลไก external attribute mismatch โดยไม่พบหลักฐานว่า theme/font/search initial render ของแอปเป็นสาเหตุ
- ใช้ suppression เฉพาะ `<html>` และ search input พร้อม comment หลังตรวจ attributes อื่นแล้ว Historical regression ผ่าน Chromium 66 checks และ desktop WebKit 66 checks; negative control ที่ search label ยังให้ warning ตามคาด ไม่ปิด SSR หรือซ่อน console/error overlay ของแอป

**ข้อสันนิษฐานและส่วนที่ยังไม่ยืนยัน**

- Chrome iPad Autofill เป็นคำอธิบายที่สอดคล้องกับ source และการจำลอง แต่ไม่ได้เข้าถึง DOM/เวลา injection บน iPad เครื่องที่เกิดบั๊ก จึงไม่อ้างว่ายืนยัน root cause บนอุปกรณ์นั้นครบถ้วนหรือทดสอบ iPad แล้ว
- ชื่อที่ผู้ใช้พิมพ์ `__gcremoteframetoken` ขาด `r` หนึ่งตัว ทั้งสองสะกดถูกใช้ในการจำลอง แต่ไม่ยืนยันว่า Chromium สร้างชื่อแบบย่อ หรือว่า extension/translation เป็นสาเหตุบนเครื่องจริง
- บน iPad จริงต้องเทียบ Chrome/Safari โดยปิด extensions/translation ตรวจ direct URL, refresh, navigation, search/plan save และ theme/font พร้อมเก็บ exact attribute diff หากยังมี warning อย่าขยาย suppression ตามข้อสันนิษฐาน

อ่านขั้นตอนและข้อจำกัดเพิ่มเติมใน [docs/plan-hydration.md](../../../docs/plan-hydration.md) และ regression scripts `scripts/test-plan-hydration.mjs` / `scripts/test-plan-hydration-browser.js` จาก repo root รายการผลข้างต้นเป็นหลักฐานย้อนหลัง ไม่ใช่ผลตรวจใหม่ทุกครั้งที่ใช้ skill

### Mock readiness regression: matched displayed angles do not imply permission

For the MoRe mock, trace assignment exercise code through demoCriteria, DB metric/checkpoints and recording-service validation to the actual bound criteria before changing thresholds. Debug must identify exercise/definition/criteria versions, raw versus filtered values, inclusive checks, every readiness blocker, stable time and camera/start state. Test 90-degree knee/105-degree torso on both sides, exact bounds, opposite occlusion and source-image reflection. Anatomical side does not fix image-facing direction; optional heel/toe or ambiguous depth must not veto a reliable selected measurement chain. Posture tilt guidance must not silently become an extra readiness gate. Latest confirmed code issues were a 35-degree thigh hard gate and signed/auxiliary-foot direction veto; DB v4/v5 ranges matched their definitions. This does not prove the original iPad's loaded version or model accuracy. Do not claim seated-chair detection from two angles. Keep real-exercise definitions separate, and check direct URL/reloads/console after camera UI changes. See docs/mock-readiness-v4.md for evidence and device limits.
## MoRe: ตรวจ conflict ก่อน Commit / Merge

เมื่อผู้ใช้สั่ง commit, push หรือ merge งาน MoRe ให้ตรวจ branch ปัจจุบัน, working tree, staged diff และไฟล์ unresolved (`git ls-files -u`) ก่อนดำเนินการ ห้าม commit conflict markers หรือไฟล์ที่ยังแก้ conflict ไม่ครบ ตรวจว่าไม่มี environment secrets หรือข้อมูลบัญชีส่วนตัวติดไปด้วย

เมื่อทราบกิ่งปลายทาง ให้ fetch remote ล่าสุดและตรวจ merge ก่อน เช่น `git merge-tree --write-tree origin/main HEAD` ซึ่งไม่เปลี่ยน working tree หากยังมีงานที่ไม่ commit ให้ตรวจฐานปัจจุบันก่อน แล้วตรวจซ้ำกับ commit สุดท้ายที่จะ merge จริง อย่าอ้างว่าการตรวจ HEAD ครอบคลุม diff ที่ยังไม่ commit

ถ้าพบ conflict ให้รายงานชื่อไฟล์ ประเภทการชน และส่วนที่ต้องตัดสินใจก่อน merge/push ผลที่ยัง unresolved; ห้ามเลือกทับงานของอีกฝ่ายแบบเหมารวม แก้ conflict ที่อยู่ในขอบเขตที่ได้รับอนุญาต ตรวจ checks ที่เกี่ยวข้อง แล้วตรวจซ้ำก่อนทำขั้นตอนต่อไป

หากไม่มี conflict ให้ดำเนินการตามคำสั่งที่ได้รับอนุญาตโดยไม่ถามย้ำ; คำสั่ง commit อย่างเดียวไม่อนุญาต merge เข้า main ใช้ fast-forward เมื่อทำได้ ห้าม force push เพื่อหลีกเลี่ยง conflict หาก push ถูกปฏิเสธเพราะ remote เปลี่ยน ให้ fetch และตรวจ merge ใหม่

หลังดำเนินการ รายงาน source/target branch, commit, ผล conflict ที่ตรวจจริง และสถานะ push แยก “จำลอง merge” ออกจาก “merge แล้ว” และแยก conflict ทาง Git ออกจากความเข้ากันได้ของ runtime/tests เก็บ skill ฉบับ repository นี้โดยตรงตามขั้นตอนเดิม ไม่สร้างสำเนา global ใหม่