"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Plus, Save, Pencil } from "lucide-react";
import { PageHeading, EmptyState } from "./shell";
import type { staffPatientData, staffTemplates, staffCatalog } from "@/lib/doctor-service";
import { ResultsHistory } from "./results-views";
import { requestId as newRequestId } from "@/lib/request-id";

async function submit(url: string, method: string, body: unknown) {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json(); if (!response.ok) throw new Error(data.error || "ดำเนินการไม่สำเร็จ"); return data;
}
type Templates = Awaited<ReturnType<typeof staffTemplates>>;
type Catalog = Awaited<ReturnType<typeof staffCatalog>>;
type PatientData = Awaited<ReturnType<typeof staffPatientData>>;
type Patient = { patient_id: number; hn: string | null; full_name: string; sex: string | null; birthDate: string | null };
export function DoctorPatientList({ patients }: { patients: Patient[] }) {
  const [query, setQuery] = useState(""); const [page, setPage] = useState(0);
  const rows = patients.filter(patient => `${patient.full_name} ${patient.hn || ""}`.toLowerCase().includes(query.toLowerCase()));
  return <><PageHeading title="ผู้ป่วย" /><label className="filter-bar">ค้นหาชื่อ / HN<input type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} /></label><p>{rows.length} คน · สูงสุด 500 รายการ</p>
    {!rows.length ? <EmptyState title="ไม่พบผู้ป่วย" /> : <div className="exercise-list">{rows.slice(page * 10, page * 10 + 10).map(patient => <article className="exercise-row" key={patient.patient_id}><div><h2>{patient.full_name}</h2><p>HN {patient.hn || "-"} · วันเกิด {patient.birthDate || "-"}</p></div><Link className="command" href={`/doctor/patients/${patient.patient_id}`}>ดูข้อมูล</Link></article>)}</div>}
    <div className="action-row"><button className="command" disabled={!page} onClick={() => setPage(page - 1)}>ก่อนหน้า</button><span>{page + 1} / {Math.max(1, Math.ceil(rows.length / 10))}</span><button className="command" disabled={(page + 1) * 10 >= rows.length} onClick={() => setPage(page + 1)}>ถัดไป</button></div></>;
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
    {!planOnly && <><dl className="profile-grid">{[["วันเกิด", profile.date_of_birth], ["เพศ", profile.sex], ["โทรศัพท์", profile.phone], ["แพทย์หลัก", profile.primary_doctor_name], ["ชนิดโรคหลอดเลือดสมอง", profile.stroke_type], ["วันที่วินิจฉัย", profile.stroke_diagnosed_on], ["โรคอื่น", profile.other_conditions]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "-"}</dd></div>)}</dl><form className="form-stack" onSubmit={event => { event.preventDefault(); write(false); }}><label>บันทึกทีมรักษา<textarea value={notes} maxLength={10000} onChange={event => setNotes(event.target.value)} /></label><button className="command" disabled={busy}><Save size={18} />บันทึกข้อมูล</button></form></>}
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
