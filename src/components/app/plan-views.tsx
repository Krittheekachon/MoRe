"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Info, LockKeyhole, Save, Search } from "lucide-react";
import { exercises, initialPlan, type PlanItem, type ExerciseId } from "@/lib/demo-data";
import { useDemo } from "./demo-provider";
import { PageHeading } from "./shell";

// Add exercise IDs here when additional exercises are ready for selection.
const selectableExerciseIds: readonly ExerciseId[] = ["seated-leg-raise"];

export function PlanSelection({ registration = false }: { registration?: boolean }) {
  const { setPlans } = useDemo();
  const router = useRouter();
  const [selected, setSelected] = useState<ExerciseId[]>([]);
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const moduleTitles: Record<number, string> = {
    1: "การควบคุมลำตัวและการทำงานของขาเบื้องต้น",
    2: "การควบคุมลำตัวและการเคลื่อนไหวของขา",
    3: "การยืนและการเริ่มเดิน",
    4: "การเดินและการทรงตัวขั้นสูง",
    5: "การเดินขั้นสูงและเคลื่อนไหวคล่องตัว",
  };
  const enabledModules = [2];
  const modules = Object.keys(moduleTitles).map(Number).map(module => ({
    id: module,
    enabled: enabledModules.includes(module),
    title: moduleTitles[module] ?? "ท่ากายภาพบำบัด",
    exercises: exercises.filter(exercise => exercise.module === module && (
      !normalizedQuery ||
      exercise.name.toLowerCase().includes(normalizedQuery) ||
      (exercise.id === "seated-leg-raise" && "นั่งเหยียดขาบนเก้าอี้".includes(normalizedQuery)) ||
      exercise.english.toLowerCase().includes(normalizedQuery) ||
      (moduleTitles[module] ?? "").toLowerCase().includes(normalizedQuery)
    )),
  })).filter(module => module.enabled
    ? module.exercises.length > 0
    : !normalizedQuery || module.title.toLowerCase().includes(normalizedQuery) || `module ${module.id}`.includes(normalizedQuery));
  const toggleExercise = (id: ExerciseId, checked: boolean) => {
    if (!selectableExerciseIds.includes(id)) return;
    setSelected(current => checked ? [...current, id] : current.filter(item => item !== id));
  };
  return (
    <div className="exercise-picker">
      <PageHeading title="เลือกท่าการทำกายภาพบำบัด" subtitle={`เลือกอยู่ ${selected.length} ท่า`} back={registration ? "/register/medical" : "/patient"} backLabel="กลับสู่แผนการฝึก" />
      <p className="exercise-picker-notice"><Info size={20} aria-hidden="true" />กรุณาเลือกท่าให้ตรงตามที่แพทย์ได้แนะนำไว้</p>
      <label className="exercise-picker-search">
        <Search size={22} aria-hidden="true" />
        <span className="sr-only">ค้นหาท่ากายภาพบำบัด</span>
        <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="ค้นหาชื่อท่าหรือส่วนของร่างกาย" />
      </label>
      <div className="exercise-picker-modules">
        {modules.map(module => module.enabled ? (
          <details className="exercise-picker-module" key={module.id}>
            <summary>
              <span><b>Module {module.id}</b> {module.title}</span>
              <ChevronDown size={24} aria-hidden="true" />
            </summary>
            <div className="exercise-picker-options">
              {module.exercises.map(exercise => (
                <label className="exercise-picker-option" key={exercise.id}>
                  <input type="checkbox" disabled={!selectableExerciseIds.includes(exercise.id)} checked={selected.includes(exercise.id)} onChange={event => toggleExercise(exercise.id, event.target.checked)} />
                  <span>
                    <strong>{exercise.id === "seated-leg-raise" ? "นั่งเหยียดขาบนเก้าอี้" : exercise.name}</strong>
                    <small>{exercise.english}{!selectableExerciseIds.includes(exercise.id) && " · ยังไม่เปิดใช้งาน"}</small>
                  </span>
                </label>
              ))}
            </div>
          </details>
        ) : (
          <div className="exercise-picker-module exercise-picker-module-disabled" key={module.id}>
            <button type="button" className="exercise-picker-module-heading" disabled>
              <span><b>Module {module.id}</b> {module.title}<small>เปิดใช้งานในเฟสถัดไป</small></span>
              <LockKeyhole size={22} aria-hidden="true" />
            </button>
          </div>
        ))}
        {!modules.length && <p className="empty-state">ไม่พบท่าที่ตรงกับคำค้น</p>}
      </div>
      <div className="exercise-picker-actions">
        <button className="command primary" disabled={!selected.length} onClick={() => {
          const items = selected.filter(id => selectableExerciseIds.includes(id)).map(exerciseId => {
            const exercise = exercises.find(item => item.id === exerciseId)!;
            return { exercise_id: exercise.id, target_sets: 3, target_reps_per_set: 10, selected_side: exercise.side ? "left" : "none", schedule_type: "daily" as const, weekdays: [] };
          });
          setPlans(current => ({ ...current, "1": items }));
          router.push(registration ? "/register/review" : "/patient");
        }}>บันทึกท่าที่เลือก</button>
      </div>
    </div>
  );
}

export function PlanEditor({ patientId, template = false }: { patientId?: string; template?: boolean }) {
  const { plans, setPlans, templates, setTemplates } = useDemo();
  const [items, setItems] = useState<PlanItem[]>(patientId ? plans[patientId] || [] : initialPlan);
  const [sourceId, setSourceId] = useState(templates[0].id);
  const [name, setName] = useState(templates[0].name);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  function update(id: ExerciseId, patch: Partial<PlanItem>) {
    setStatus("");
    setItems(current => current.map(item => item.exercise_id === id ? { ...item, ...patch } : item));
  }
  function save(event: FormEvent) {
    event.preventDefault();
    if (!items.length) return setStatus("เลือกอย่างน้อยหนึ่งท่าฝึก");
    if (items.some(i => i.target_sets < 1 || i.target_reps_per_set < 1 || !Number.isInteger(i.target_sets) || !Number.isInteger(i.target_reps_per_set) || (i.schedule_type === "weekly" && !i.weekdays.length))) {
      return setStatus("จำนวนเซต/ครั้งต้องเป็นจำนวนเต็มมากกว่า 0 และแผนรายสัปดาห์ต้องเลือกวัน");
    }
    if (patientId) setPlans(current => ({ ...current, [patientId]: items }));
    if (template) {
      const newId = `DEMO-T${Date.now()}`;
      // Keep assigned plan copies intact; replace only the available template version.
      setTemplates(current => [...current.filter(t => t.id !== sourceId), {
        id: newId, name: name.trim(), items: items.map(i => ({ ...i, weekdays: [...i.weekdays] })),
      }]);
      setSourceId(newId);
    }
    setStatus(template ? "สร้างรุ่นแผนกลางตัวอย่างใหม่แล้ว" : "ปรับแผนตัวอย่างแล้ว เป้าหมายประจำวันคงเดิม");
  }
  return (
    <>
      <PageHeading title={template ? "จัดแผนกลาง" : "จัดแผนฝึกผู้ป่วย"} back={patientId ? `/doctor/patients/${patientId}` : "/doctor"} />
      <div className="filter-bar"><label><span><Search size={16} className="inline" /> ค้นหาท่าฝึก</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="ชื่อท่าฝึก" /></label></div>
      <form onSubmit={save}>
        {template && <div className="form-stack">
          <label htmlFor="template-source">แผนกลาง</label>
          <select id="template-source" value={sourceId} onChange={e => {
            setSourceId(e.target.value); setStatus("");
            const selected = templates.find(t => t.id === e.target.value);
            setName(selected?.name || "");
            setItems(selected?.items.map(i => ({ ...i, weekdays: [...i.weekdays] })) || []);
          }}>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            <option value="new">สร้างแผนใหม่</option>
          </select>
          <label htmlFor="template-name">ชื่อแผน</label>
          <input id="template-name" required maxLength={150} value={name} onChange={e => setName(e.target.value)} />
        </div>}
        <div className="plan-list">
          {[1, 2].map(module => <details key={module} open>
            <summary>หมวด {module}</summary>
            {exercises.filter(e => e.module === module && (e.name.includes(query) || e.english.toLowerCase().includes(query.toLowerCase()))).map(e => {
              const item = items.find(i => i.exercise_id === e.id);
              return <div className="plan-row" key={e.id}>
                <label><input type="checkbox" checked={!!item} onChange={event => setItems(current => event.target.checked ? [...current, { exercise_id: e.id, target_sets: 3, target_reps_per_set: 10, selected_side: e.side ? "left" : "none", schedule_type: "daily", weekdays: [] }] : current.filter(i => i.exercise_id !== e.id))} />{e.name}</label>
                {item && <>
                  <label>เซต<input type="number" min={1} max={20} required value={item.target_sets || ""} onChange={event => update(e.id, { target_sets: Number(event.target.value) })} /></label>
                  <label>ครั้ง / เซต<input type="number" min={1} max={100} required value={item.target_reps_per_set || ""} onChange={event => update(e.id, { target_reps_per_set: Number(event.target.value) })} /></label>
                  <div className="plan-options">
                    {e.side && <label>ข้าง<select value={item.selected_side} onChange={event => update(e.id, { selected_side: event.target.value })}><option value="left">ซ้าย</option><option value="right">ขวา</option><option value="both">สองข้าง</option></select></label>}
                    <label>ตารางฝึก<select value={item.schedule_type} onChange={event => update(e.id, { schedule_type: event.target.value as "daily" | "weekly" })}><option value="daily">ทุกวัน</option><option value="weekly">ตามวันในสัปดาห์</option></select></label>
                  </div>
                  {item.schedule_type === "weekly" && <div className="weekday-options">
                    {["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."].map((day, index) => <label key={day}><input type="checkbox" checked={item.weekdays.includes(index + 1)} onChange={event => update(e.id, { weekdays: event.target.checked ? [...item.weekdays, index + 1] : item.weekdays.filter(d => d !== index + 1) })} />{day}</label>)}
                  </div>}
                </>}
              </div>;
            })}
          </details>)}
        </div>
        <div className="action-row"><button className="command primary"><Save size={18} />{template ? "บันทึกแผนกลางตัวอย่าง" : "บันทึกแผนตัวอย่าง"}</button></div>
        {status && <p className="notice" role="status">{status}</p>}
      </form>
    </>
  );
}
