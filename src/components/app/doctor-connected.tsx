"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect, type FormEvent } from "react";
import { Plus, Save, Pencil, Search, ArrowRight, ChevronUp, ChevronDown } from "lucide-react";
import { PageHeading, EmptyState } from "./shell";
import type { staffPatientData, staffTemplates, staffCatalog } from "@/lib/doctor-service";
import { ResultsHistory } from "./results-views";
import { requestId as newRequestId } from "@/lib/request-id";
import { getPrototypeDoctorPatients } from "@/lib/prototype-doctor-patients";

async function submit(url: string, method: string, body: unknown) {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json(); if (!response.ok) throw new Error(data.error || "ดำเนินการไม่สำเร็จ"); return data;
}
type Templates = Awaited<ReturnType<typeof staffTemplates>>;
type Catalog = Awaited<ReturnType<typeof staffCatalog>>;
type PatientData = Awaited<ReturnType<typeof staffPatientData>>;
export type DoctorPatient = {
  patient_id: number;
  hn: string | null;
  full_name: string;
  sex: string | null;
  birthDate: string | null;
  age: number | null;
  phone: string | null;
  sessionCount: number;
  lastUpdated: string | null;
};

function formatThaiDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (!Number.isFinite(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    calendar: "buddhist",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const current = currentPage + 1;
  if (current <= 4) return [1, 2, 3, 4, "...", totalPages];
  if (current >= totalPages - 3) return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, "...", current - 1, current, current + 1, "...", totalPages];
}

const PAGE_SIZE_STORAGE_KEY = "more_doctor_page_size";

export function DoctorPatientList({ patients }: { patients: DoctorPatient[] }) {
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(9);
  const [pageSizeInput, setPageSizeInput] = useState("9");
  const [page, setPage] = useState(0);

  const displayPatients = useMemo(() => {
    return patients.length >= 9 ? patients : getPrototypeDoctorPatients(patients);
  }, [patients]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
    try {
      const saved = localStorage.getItem(PAGE_SIZE_STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 500) {
          setPageSize(parsed);
          setPageSizeInput(String(parsed));
        }
      }
    } catch {}
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  function updatePageSize(num: number) {
    const clamped = Math.min(Math.max(1, num), 500);
    setPageSize(clamped);
    setPageSizeInput(String(clamped));
    setPage(0);
    try {
      localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(clamped));
    } catch {}
  }

  function handlePageSizeChange(val: string) {
    setPageSizeInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      updatePageSize(num);
    }
  }

  function handleBlur() {
    const num = parseInt(pageSizeInput, 10);
    if (isNaN(num) || num < 1) {
      setPageSizeInput(String(pageSize));
    } else {
      updatePageSize(num);
    }
  }

  function handleIncrement() {
    updatePageSize(pageSize + 1);
  }

  function handleDecrement() {
    updatePageSize(pageSize - 1);
  }

  const q = query.trim().toLowerCase();
  const filtered = displayPatients.filter(patient => {
    if (!q) return true;
    return (
      patient.full_name.toLowerCase().includes(q) ||
      (patient.hn && patient.hn.toLowerCase().includes(q)) ||
      (patient.phone && patient.phone.toLowerCase().includes(q)) ||
      q.includes("demo") ||
      "more-demo-01".includes(q) ||
      "more-demo-02".includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const rows = filtered.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  return (
    <div className="doctor-overview">
      <header className="doctor-overview-header">
        <h1 aria-label="ผู้ป่วย">รายชื่อผู้ป่วย</h1>
        <p>ค้นหาและตรวจสอบข้อมูลผู้ป่วยที่อยู่ในการดูแล</p>
      </header>

      <section className="doctor-overview-card" aria-label="ตารางรายชื่อผู้ป่วย">
        <div className="doctor-overview-toolbar">
          <div className="doctor-overview-search">
            <Search size={18} className="search-icon" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={event => {
                setQuery(event.target.value);
                setPage(0);
              }}
              placeholder="ค้นหาด้วยชื่อ, Patient ID หรือเบอร์โทรศัพท์"
              aria-label="ค้นหาด้วยชื่อ, Patient ID หรือเบอร์โทรศัพท์"
            />
          </div>

          <div className="doctor-overview-pagesize">
            <label htmlFor="pageSizeInput">จำนวนรายชื่อต่อหน้า</label>
            <div className="pagesize-stepper-box">
              <input
                id="pageSizeInput"
                type="number"
                min={1}
                max={500}
                value={pageSizeInput}
                onChange={event => handlePageSizeChange(event.target.value)}
                onBlur={handleBlur}
                onKeyDown={event => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                }}
                className="pagesize-number-input"
                aria-label="จำนวนรายชื่อต่อหน้า"
              />
              <div className="pagesize-stepper-arrows">
                <button
                  type="button"
                  className="stepper-arrow-btn"
                  onClick={handleIncrement}
                  aria-label="เพิ่มจำนวนรายชื่อต่อหน้า"
                  tabIndex={-1}
                >
                  <ChevronUp size={12} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  className="stepper-arrow-btn"
                  onClick={handleDecrement}
                  aria-label="ลดจำนวนรายชื่อต่อหน้า"
                  tabIndex={-1}
                >
                  <ChevronDown size={12} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {!filtered.length ? (
          <EmptyState title="ไม่พบผู้ป่วยที่ค้นหา">
            {query && (
              <button
                type="button"
                className="command"
                style={{ marginTop: "12px" }}
                onClick={() => {
                  setQuery("");
                  setPage(0);
                }}
              >
                ล้างคำค้นหา
              </button>
            )}
          </EmptyState>
        ) : (
          <div className="doctor-overview-table" role="feed" aria-label="รายชื่อผู้ป่วย">
            {rows.map((patient, index) => {
              const sexLabel = patient.sex
                ? patient.sex.toLowerCase() === "male" || patient.sex === "ชาย"
                  ? "ชาย"
                  : patient.sex.toLowerCase() === "female" || patient.sex === "หญิง"
                  ? "หญิง"
                  : patient.sex
                : "-";
              const ageAndSex = patient.age !== null ? `${patient.age} ปี · ${sexLabel}` : sexLabel !== "-" ? sexLabel : "-";
              const sessionText = patient.sessionCount > 0 ? `กายภาพครั้งที่ ${patient.sessionCount}` : "ยังไม่มีประวัติกายภาพ";
              const lastUpdateText = patient.lastUpdated ? `อัปเดตล่าสุด ${formatThaiDate(patient.lastUpdated)}` : "-";

              return (
                <article className="doctor-overview-row patient-row" key={`${patient.hn}-${patient.full_name}-${index}`}>
                  <div className="row-col col-hn">
                    <span className="hn-text">{patient.hn || "-"}</span>
                  </div>
                  <div className="row-col col-name">
                    <h2 className="patient-name">{patient.full_name}</h2>
                  </div>
                  <div className="row-col col-age-sex">
                    <span>{ageAndSex}</span>
                  </div>
                  <div className="row-col col-session">
                    <span>{sessionText}</span>
                  </div>
                  <div className="row-col col-updated">
                    <span>{lastUpdateText}</span>
                  </div>
                  <div className="row-col col-action">
                    <Link
                      className="doctor-overview-action"
                      href={`/doctor/patients/${patient.patient_id}`}
                    >
                      <span>ตรวจสอบ</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="doctor-overview-footer">
          <div className="doctor-overview-pagination">
            <button
              type="button"
              className="page-nav-btn"
              disabled={currentPage === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              ก่อนหน้า
            </button>

            <div className="page-numbers">
              {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                typeof p === "number" ? (
                  <button
                    key={p}
                    type="button"
                    className={`page-num-btn ${p === currentPage + 1 ? "active" : ""}`}
                    onClick={() => setPage(p - 1)}
                    aria-current={p === currentPage + 1 ? "page" : undefined}
                  >
                    {p}
                  </button>
                ) : (
                  <span key={`ellipsis-${idx}`} className="page-ellipsis" aria-hidden="true">
                    ...
                  </span>
                )
              )}
            </div>

            <button
              type="button"
              className="page-nav-btn"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            >
              ถัดไป
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
export function ConnectedPatientTabs({ id }: { id: number }) { return <nav className="view-tabs" aria-label="ข้อมูลผู้ป่วย"><Link href={`/doctor/patients/${id}`}>ข้อมูลส่วนตัว</Link><Link href={`/doctor/patients/${id}/assessments`}>ประวัติผล</Link><Link href={`/doctor/patients/${id}/plan`}>แผนการฝึก</Link></nav>; }
export function DoctorPatientConnected({ data, templates, planOnly = false }: { data: PatientData; templates: Templates; planOnly?: boolean }) {
  const router = useRouter(); const profile = data.profile;
  const [notes, setNotes] = useState(profile.medical_notes || ""); const [templateId, setTemplateId] = useState(String(data.plan?.templateId || ""));
  const [status, setStatus] = useState(""); const [busy, setBusy] = useState(false);
  async function write(plan: boolean) {
    if (busy) return; setBusy(true); setStatus("");
    try { await submit(`/api/doctor/patients/${profile.patient_id}`, plan ? "POST" : "PATCH", plan ? { templateId: Number(templateId) } : { medicalNotes: notes }); setStatus("บันทึกแล้ว"); router.refresh(); }
    catch (error) { setStatus(error instanceof Error ? error.message : "เชื่อมต่อไม่ได้"); } finally { setBusy(false); }
  }
  return <><PageHeading title={profile.full_name} subtitle={`HN ${profile.hn || "-"}`} back="/doctor" /><ConnectedPatientTabs id={profile.patient_id} />
    {!planOnly && <><dl className="profile-grid">{[["วันเกิด", profile.date_of_birth], ["เพศ", profile.sex], ["โทรศัพท์", profile.phone], ["ชนิดโรคหลอดเลือดสมอง", profile.stroke_type], ["วันที่วินิจฉัย", profile.stroke_diagnosed_on], ["โรคอื่น", profile.other_conditions]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "-"}</dd></div>)}</dl><form className="form-stack" onSubmit={event => { event.preventDefault(); write(false); }}><label>บันทึกทีมรักษา<textarea value={notes} maxLength={10000} onChange={event => setNotes(event.target.value)} /></label><button className="command" disabled={busy}><Save size={18} />บันทึกข้อมูล</button></form></>}
    <section className="results-set"><h2>แผนการฝึก</h2>{data.plan ? <><h3>{data.plan.name}</h3>{data.plan.startsAt && <p>เริ่มใช้ {new Date(data.plan.startsAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}</p>}{data.plan.items.map(item => <p key={item.id}>{item.exercise.name} · {item.targetSets} เซต × {item.targetReps} ครั้ง · {item.sessionsPerDay} รอบ/วัน · {item.schedule === "daily" ? "ทุกวัน" : `วัน ${item.weekdays.join(", ")}`}</p>)}</> : <p>ยังไม่มีแผน</p>}
    <form className="form-stack" onSubmit={event => { event.preventDefault(); write(true); }}><label>เลือกแผนกลาง<select value={templateId} onChange={event => setTemplateId(event.target.value)} required><option value="">เลือกแผน</option>{templates.map(template => <option key={template.id} value={template.id}>{template.name_th} v{template.version_number}</option>)}</select></label><button className="command primary" disabled={busy || !templateId}><Save size={18} />ใช้แผนนี้</button></form><p className="muted">ถ้ามีรายการของวันนี้แล้ว แผนใหม่เริ่มวันถัดไป โดยไม่แก้เป้าหมายหรือผลเดิม</p></section>
    {status && <p role="status" className="notice">{status}</p>}{!planOnly && <ResultsHistory sessions={data.sessions} base={`/doctor/patients/${profile.patient_id}`} />}</>;
}
type Item = { exerciseId: number; side: string | null; sets: number; reps: number; frequency: number; schedule: string; weekdays: number[]; instructions: string };
export function DoctorTemplateEditor({ templates, catalog }: { templates: Templates; catalog: Catalog }) {
  const router = useRouter(); const [baseId, setBaseId] = useState<number | null>(null); const [name, setName] = useState(""); const [description, setDescription] = useState(""); const [items, setItems] = useState<Item[]>([]);
  const [requestId, setRequestId] = useState(""); const [busy, setBusy] = useState(false); const [uncertain, setUncertain] = useState(false); const [status, setStatus] = useState("");
  function edit(template?: Templates[number]) {
    setBaseId(template?.id ?? null); setName(template?.name_th.replace(/^DEMO /, "") || ""); setDescription(template?.description || "");
    setItems(template?.exercises.map(item => ({ exerciseId: item.exercise_id, side: item.selected_side, sets: item.target_sets, reps: item.target_reps_per_set, frequency: item.sessions_per_day, schedule: item.schedule_type, weekdays: item.weekdays.map(day => day.weekday), instructions: item.instructions || "" })) || []);
    setRequestId(newRequestId()); setStatus("");
  }
  function update(id: number, changes: Partial<Item>) { setItems(items.map(item => item.exerciseId === id ? { ...item, ...changes } : item)); }
  async function save(event: FormEvent) {
    event.preventDefault(); if (busy) return; setBusy(true); setUncertain(true); setStatus("");
    const identity = requestId || newRequestId(); setRequestId(identity);
    try { await submit("/api/doctor/templates", "POST", { requestId: identity, baseId, name, description, items }); setUncertain(false); setBaseId(null); setItems([]); setName(""); setDescription(""); setRequestId(""); setStatus("บันทึกเวอร์ชันแล้ว แผนผู้ป่วยเดิมไม่เปลี่ยน"); router.refresh(); }
    catch (error) { setStatus(`${error instanceof Error ? error.message : "เชื่อมต่อไม่ได้"} · ลองบันทึกคำขอเดิมอีกครั้ง`); } finally { setBusy(false); }
  }
  return <><PageHeading title="แผนกลาง" /><div className="exercise-list">{templates.map(template => <article className="exercise-row" key={template.id}><div><h2>{template.name_th} v{template.version_number}</h2>{template.exercises.map(item => <p key={item.id}>{item.exercise.name_th} · {item.target_sets} × {item.target_reps_per_set} · {item.sessions_per_day} รอบ/วัน</p>)}</div><button className="command" disabled={busy || uncertain} onClick={() => edit(template)}><Pencil size={18} />แก้ไขเป็นเวอร์ชันใหม่</button></article>)}</div>
    <button className="command" disabled={busy || uncertain} onClick={() => edit()}><Plus size={18} />แผนใหม่</button><form className="form-stack results-set" onSubmit={save}><h2>{baseId ? "แก้ไขแผน (สร้างเวอร์ชันใหม่)" : "สร้างแผนกลาง"}</h2><fieldset disabled={busy || uncertain}><label>ชื่อแผน<input required value={name} maxLength={145} onChange={event => setName(event.target.value)} /></label><label>รายละเอียด<textarea value={description} maxLength={5000} onChange={event => setDescription(event.target.value)} /></label>
    {catalog.map(exercise => { const item = items.find(row => row.exerciseId === exercise.id); return <section className="plan-exercise" key={exercise.id}><label><input type="checkbox" checked={!!item} onChange={event => setItems(event.target.checked ? [...items, { exerciseId: exercise.id, side: exercise.supports_side_selection ? "left" : null, sets: 1, reps: 1, frequency: 1, schedule: "daily", weekdays: [], instructions: "" }] : items.filter(row => row.exerciseId !== exercise.id))} />{exercise.name_th}</label>{item && <div className="form-grid">{([ ["sets", "เซต"], ["reps", "ครั้ง/เซต"], ["frequency", "รอบ/วัน"] ] as const).map(([key, label]) => <label key={key}>{label}<input type="number" min={1} max={32767} required value={item[key]} onChange={event => update(exercise.id, { [key]: Number(event.target.value) })} /></label>)}{exercise.supports_side_selection && <label>ข้าง<select value={item.side || ""} onChange={event => update(exercise.id, { side: event.target.value || null })}><option value="">เลือกก่อนฝึก</option><option value="left">ซ้าย</option><option value="right">ขวา</option></select></label>}<label>ตาราง<select value={item.schedule} onChange={event => update(exercise.id, { schedule: event.target.value })}><option value="daily">ทุกวัน</option><option value="weekly">เลือกวัน</option></select></label>{item.schedule === "weekly" && <fieldset><legend>วันฝึก</legend>{["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"].map((day, index) => <label key={day}><input type="checkbox" checked={item.weekdays.includes(index + 1)} onChange={event => update(exercise.id, { weekdays: event.target.checked ? [...item.weekdays, index + 1] : item.weekdays.filter(value => value !== index + 1) })} />{day}</label>)}</fieldset>}<label>คำแนะนำ<textarea value={item.instructions} maxLength={5000} onChange={event => update(exercise.id, { instructions: event.target.value })} /></label></div>}</section>; })}</fieldset>
    <button className="command primary" disabled={busy || !items.length}><Save size={18} />{busy ? "กำลังบันทึก" : uncertain ? "ลองบันทึกคำขอเดิม" : "บันทึกแผน"}</button>{uncertain && !busy && <button type="button" className="command" onClick={() => { setUncertain(false); setRequestId(newRequestId()); }}>แก้ข้อมูลเป็นคำขอใหม่</button>}{status && <p role="status" className="notice">{status}</p>}</form></>;
}
