"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CalendarDays, ChevronDown, Info, Save, Search, Video } from "lucide-react";
import { accountRequest } from "@/lib/account-client";
import { dateInThailand } from "@/lib/birth-date";
import { dateLabel, type PatientProfile } from "@/lib/demo-data";
import { trainingHref, type DailyTraining, type DailyTrainingItem, type PatientTrainingPlan, type TrainingHistory, type TrainingItem, type TrainingTemplate } from "@/lib/training-types";
import { PatientBanner } from "./patient-views";
import { EmptyState, PageHeading } from "./shell";

const weekdays = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];
const sides: Record<string, string> = { left: "ซ้าย", right: "ขวา", both: "สองข้าง", none: "ไม่แยกข้าง" };
function schedule(item: TrainingItem) {
  return item.schedule === "weekly" ? item.weekdays.map(day => weekdays[day - 1]).join(" / ") : "ทุกวัน";
}
function SnapshotNotice({ today }: { today: DailyTraining }) {
  const future = today.activePlan?.startsAt && dateInThailand(new Date(today.activePlan.startsAt)) > today.date;
  return today.snapshotFromPreviousPlan || future ? <p className="notice">เลือกแผนใหม่แล้ว เป้าหมายของวันนี้คงเดิม แผนใหม่เริ่มใช้วันถัดไป</p> : null;
}
export function TrainingCards({ today }: { today: DailyTraining }) {
  if (!today.items.length) return <EmptyState title="ยังไม่มีรายการฝึกวันนี้"><Link className="command primary" href="/patient/plan">ดูแผนฝึก <ArrowRight size={18} /></Link></EmptyState>;
  return <div className="exercise-grid">{today.items.map(item => <article className="exercise-item" key={item.id}>
    <div className="exercise-title-row"><span className="tag">หมวด {item.exercise.module}</span><span className={`exercise-status ${item.status === "completed" ? "complete" : item.status === "in_progress" ? "active" : "pending"}`}>{item.status === "completed" ? "เสร็จสิ้น" : item.status === "in_progress" ? "กำลังดำเนินการ" : "ยังไม่ดำเนินการ"}</span></div>
    <h2>{item.exercise.name}</h2><p>{item.targetSets} เซต · {item.targetReps} ครั้ง / เซต</p>
    <progress value={Math.min(item.savedSets, item.targetSets)} max={item.targetSets} aria-label={`ความก้าวหน้า ${item.exercise.name}`} /><p>{item.savedSets} / {item.targetSets} เซตที่บันทึก</p>
    <div className="action-row"><Link className="command primary" href={trainingHref(item, "guide")}>{item.canStart ? "เริ่มฝึก" : "ดูคู่มือ"}<ArrowRight size={18} /></Link></div>
  </article>)}</div>;
}
export function TrainingExercises({ patient, today }: { patient: PatientProfile; today: DailyTraining }) {
  return <><PageHeading title="แผนการฝึก" subtitle={dateLabel(today.date)}><Link className="command" href="/patient/plan">จัดการแผน</Link></PageHeading><PatientBanner accountProfile={patient} /><SnapshotNotice today={today} /><div className="section-heading"><h2>เป้าหมายวันนี้</h2></div><TrainingCards today={today} /></>;
}
export function TrainingHome({ patient, today, history }: { patient: PatientProfile; today: DailyTraining; history: TrainingHistory }) {
  const next = today.items.find(item => item.canStart);
  const completed = today.items.filter(item => item.status === "completed").length;
  return <>
    <PageHeading title="หน้าหลัก" subtitle={dateLabel(today.date)} /><PatientBanner accountProfile={patient} /><SnapshotNotice today={today} />
    <div className="dashboard-grid"><section className="daily-overview" aria-label="สรุปการฝึกวันนี้">
      <div className="daily-meter" role="meter" aria-label="ความก้าวหน้ารายวัน" aria-valuemin={0} aria-valuemax={100} aria-valuenow={today.percent}>
        <svg viewBox="0 0 120 120" aria-hidden="true"><circle className="meter-track" cx="60" cy="60" r="52" /><circle className="meter-value" cx="60" cy="60" r="52" pathLength="100" strokeDasharray={`${today.percent} 100`} /></svg><div><strong>{today.percent}%</strong><span>ความคืบหน้าวันนี้</span></div>
      </div><dl className="daily-kpis"><div><dt>เซตที่บันทึก</dt><dd>{today.savedSets} / {today.totalSets} เซต</dd></div><div><dt>ท่าที่บันทึกครบ</dt><dd>{completed} / {today.items.length} ท่า</dd></div><div><dt>เหลืออีก</dt><dd>{Math.max(0, today.totalSets - today.items.reduce((sum, item) => sum + Math.min(item.savedSets, item.targetSets), 0))} เซต</dd></div></dl>
    </section><div className="dashboard-followup"><section className="next-exercise">
      <span className="info-badge">{next ? "ท่าถัดไป" : today.items.length ? "แผนวันนี้" : "ไม่มีรายการวันนี้"}</span>
      <h2>{next?.exercise.name || (today.items.length ? completed === today.items.length ? "บันทึกครบตามแผนของวันนี้แล้ว" : "รายการฝึกยังไม่พร้อมเริ่ม" : "ยังไม่มีรายการฝึกวันนี้")}</h2>
      {next && <p className="muted">เซตที่ {next.savedSets + 1} จาก {next.targetSets} · {next.targetReps} ครั้งต่อเซต</p>}
      <div className="action-row">{next && <Link className="command primary" href={trainingHref(next, "guide")}>เริ่มฝึก <ArrowRight size={18} /></Link>}<Link className="command" href={next ? trainingHref(next, "guide") : "/patient/plan"}>{next ? "วิธีทำท่านี้" : "ดูแผนฝึก"}</Link></div>
    </section><section className="week-history" aria-label="ประวัติ 7 วันที่ผ่านมา"><div className="section-heading"><h2>การฝึก 7 วันล่าสุด</h2><CalendarDays size={20} /></div><div className="week-days">{history.week.map(day => {
      const date = new Date(`${day.date}T00:00:00Z`);
      return <span key={day.date} className={`${day.count ? "has-results" : ""} ${day.date === today.date ? "today" : ""}`} aria-label={`${dateLabel(day.date)} ${day.count} เซต`}><span>{["อา.", ...weekdays.slice(0, 6)][date.getUTCDay()]}</span><b>{date.getUTCDate()}</b><small>{day.count ? `${day.count} เซต` : "-"}</small></span>;
    })}</div></section></div></div>
    <div className="section-heading"><h2>เป้าหมายวันนี้</h2><Link className="command" href="/patient/exercises">ดูทั้งหมด</Link></div><TrainingCards today={today} />
    <div className="section-heading"><h2>ผลการฝึกล่าสุด</h2></div>
    {!history.recent.length ? <EmptyState title="ยังไม่มีเซตที่บันทึก" /> : <div className="table-scroll"><table className="data-table"><caption className="sr-only">เซตที่บันทึกจริง</caption><thead><tr><th>วันที่ / ท่า</th><th>จำนวนครั้ง</th><th>เวลา</th></tr></thead><tbody>{history.recent.map(set => <tr key={set.id}><td>{dateLabel(set.date)}<br />{set.exercise}</td><td>{set.reps} / {set.targetReps}</td><td>{set.seconds === null ? "ไม่ระบุ" : `${set.seconds} วินาที`}</td></tr>)}</tbody></table></div>}
  </>;
}
export function TrainingPlanSelection({ templates, activePlan, demo = false }: { templates: TrainingTemplate[]; activePlan: PatientTrainingPlan | null; demo?: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(activePlan?.templateId || null);
  const [query, setQuery] = useState(""); const [pending, setPending] = useState(false); const [error, setError] = useState("");
  const search = query.trim().toLowerCase();
  const visible = templates.filter(template => `${template.name} ${template.code} ${template.items.map(item => item.exercise.name).join(" ")}`.toLowerCase().includes(search));
  async function select() {
    if (!selected || pending) return;
    setPending(true); setError("");
    try { await accountRequest("/api/patient/training/plan", { templateId: selected }); router.push("/patient"); router.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "กรุณาลองใหม่"); }
    finally { setPending(false); }
  }
  return <div className="exercise-picker training-picker">
    <PageHeading title="เลือกแผนการฝึก" subtitle={activePlan ? `แผนที่เลือก: ${activePlan.name} · ${activePlan.code}` : undefined} back="/patient" backLabel="กลับสู่แผนการฝึก" />
    <p className="exercise-picker-notice"><Info size={20} aria-hidden="true" />{demo ? "DEMO แผนสังเคราะห์สำหรับทดลองระบบ ไม่ใช่แผนรักษาที่หมอยืนยัน" : "กรุณาเลือกแผนที่แพทย์แนะนำ"}</p>
    {activePlan && <section className="training-current-plan"><h2>แผนของคุณ</h2><ul>{activePlan.items.map(item => <li key={item.id}>{item.exercise.name} · {item.targetSets} เซต × {item.targetReps} ครั้ง · {item.sessionsPerDay} รอบ/วัน · {schedule(item)}</li>)}</ul></section>}
    <label className="exercise-picker-search"><Search size={22} aria-hidden="true" /><span className="sr-only">ค้นหาแผนฝึก</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="ค้นหาชื่อแผนหรือท่าฝึก" /></label>
    {!templates.length ? <EmptyState title="ยังไม่มีแผนกลางที่พร้อมให้เลือก"><p>กรุณาติดต่อทีมรักษาเพื่อจัดแผนฝึก</p></EmptyState> : <div className="exercise-picker-modules">{visible.map(template => <details className="exercise-picker-module" key={template.id} open={selected === template.id || undefined}>
      <summary><span><b>{template.name}</b><small> {template.code} · รุ่น {template.version}</small></span><ChevronDown size={24} /></summary>
      <div className="exercise-picker-options"><label className="exercise-picker-option"><input type="radio" name="training-template" value={template.id} checked={selected === template.id} disabled={pending} onChange={() => setSelected(template.id)} /><span><strong>เลือก {template.name}</strong>{template.description && <small>{template.description}</small>}</span></label>
        <ul className="training-template-items">{template.items.map(item => <li key={item.id}><strong>{item.exercise.name}</strong><p>{item.targetSets} เซต × {item.targetReps} ครั้ง · {item.sessionsPerDay} รอบ/วัน · {schedule(item)}</p><p>ข้าง: {sides[item.side || ""] || (item.exercise.supportsSide ? "เลือกก่อนฝึก" : "ไม่แยกข้าง")}</p>{item.instructions && <p>{item.instructions}</p>}</li>)}</ul>
      </div></details>)}{!visible.length && <EmptyState title="ไม่พบแผนที่ตรงกับคำค้น" />}</div>}
    {error && <p className="error-text" role="alert">{error}</p>}
    {!!templates.length && <div className="exercise-picker-actions"><button className="command primary" disabled={!selected || pending} onClick={select}><Save size={18} />{pending ? "กำลังบันทึก…" : "บันทึกแผนที่เลือก"}</button></div>}
  </div>;
}
export function TrainingGuide({ item }: { item: DailyTrainingItem }) {
  return <><PageHeading title={item.exercise.name} subtitle={`หมวด ${item.exercise.module} · ${item.exercise.english}`} back="/patient/exercises" /><div className="split-view"><section><div className="guide-placeholder"><Video size={40} aria-hidden="true" /><p>ยังไม่มีสื่อสาธิตจากทีมกายภาพ</p></div><dl className="data-list"><div><dt>มุมกล้อง</dt><dd>{item.exercise.view || "ยังไม่ระบุ"}</dd></div><div><dt>ข้างที่ฝึก</dt><dd>{sides[item.side || ""] || (item.exercise.supportsSide ? "เลือกก่อนฝึก" : "ไม่แยกข้าง")}</dd></div><div><dt>เป้าหมายวันนี้</dt><dd>{item.targetSets} เซต · {item.targetReps} ครั้ง / เซต</dd></div></dl></section><section><h2>เตรียมก่อนฝึก</h2>{item.instructions && <p className="training-instructions">{item.instructions}</p>}{item.exercise.tutorial ? <p className="training-instructions">{item.exercise.tutorial}</p> : <p>กรุณาปฏิบัติตามคำแนะนำจากทีมรักษา</p>}<div className="action-row">{item.canStart ? <Link className="command primary" href={trainingHref(item, "camera")}>ไปหน้ากล้อง <ArrowRight size={18} /></Link> : <p className="notice">รายการนี้ไม่สามารถเริ่มฝึกได้</p>}</div></section></div></>;
}
