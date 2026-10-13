"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CalendarDays, Check, CheckCircle2, ChevronDown, ClipboardList, Info, Save, Search, Sliders, Video, X } from "lucide-react";
import { accountRequest } from "@/lib/account-client";
import { dateInThailand } from "@/lib/birth-date";
import { dateLabel, type PatientProfile } from "@/lib/demo-data";
import { trainingHref, type DailyTraining, type DailyTrainingItem, type PatientTrainingPlan, type TrainingHistory, type TrainingItem, type TrainingTemplate } from "@/lib/training-types";
import { PatientBanner } from "./patient-views";
import { EmptyState, PageHeading } from "./shell";
import { DisplayMenu, DisplaySettings } from "./display-settings";
import { KneeExerciseGuide } from "./knee-exercise-guide";
import { isMockPlan } from "@/lib/mock-plan";
import { MockBadge } from "../ui/mock-badge";

const weekdays = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];
const sides: Record<string, string> = { left: "ซ้าย", right: "ขวา", both: "สองข้าง", none: "ไม่แยกข้าง" };
function formatPlanCode(code: string) {
  if (!code) return "";
  if (code.length > 20) {
    return `${code.slice(0, 10)}...${code.slice(-4)}`;
  }
  return code;
}
function schedule(item: TrainingItem) {
  return item.schedule === "weekly" ? item.weekdays.map(day => weekdays[day - 1]).join(" / ") : "ทุกวัน";
}
function SnapshotNotice({ today }: { today: DailyTraining }) {
  const future = today.activePlan?.startsAt && dateInThailand(new Date(today.activePlan.startsAt)) > today.date;
  return today.snapshotFromPreviousPlan || future ? <p className="notice">เลือกแผนใหม่แล้ว เป้าหมายของวันนี้คงเดิม แผนใหม่เริ่มใช้วันถัดไป</p> : null;
}
function ActivePlanBadge({ plan }: { plan: PatientTrainingPlan | null }) {
  if (!plan) return null;
  return (
    <Link href="/patient/plan" className="patient-plan-badge" title={`แผนการฝึก: ${plan.name} · คลิกเพื่อดูรายละเอียดแผน`}>
      <ClipboardList size={14} aria-hidden="true" />
      <span className="patient-plan-name">แผน: {plan.name}</span>
    </Link>
  );
}
export function TrainingCards({ today }: { today: DailyTraining }) {
  if (!today.items.length) return <EmptyState title="ยังไม่มีรายการฝึกวันนี้"><Link className="command primary" href="/patient/plan">ดูแผนฝึก <ArrowRight size={18} /></Link></EmptyState>;
  return <div className="exercise-grid">{today.items.map(item => <article className="exercise-item" key={item.id}>
    <div className="exercise-title-row"><span className="tag">หมวด {item.exercise.module}</span><span className={`exercise-status ${item.status === "completed" ? "complete" : item.status === "in_progress" ? "active" : "pending"}`}>{item.status === "completed" ? "เสร็จสิ้น" : item.status === "in_progress" ? "กำลังดำเนินการ" : "ยังไม่ดำเนินการ"}</span></div>
    <h2>{item.exercise.name}</h2><p>{item.targetSets} เซต · {item.targetReps} ครั้ง / เซต</p>
    <progress value={(item.progressSets ?? Math.min(item.savedSets, item.targetSets))} max={item.targetSets} aria-label={`ความก้าวหน้า ${item.exercise.name}`} /><p>ครบเป้าหมาย {item.completedSets ?? item.savedSets} / {item.targetSets} เซต · บันทึกทั้งหมด {item.savedSets} เซต</p>
    <div className="action-row"><Link className="command primary" href={trainingHref(item, "guide")}>{item.canStart ? "เริ่มฝึก" : "ดูคู่มือ"}<ArrowRight size={18} /></Link></div>
  </article>)}</div>;
}
export function TrainingExercises({ patient, today }: { patient: PatientProfile; today: DailyTraining }) {
  return <><PageHeading title="แผนการฝึก" subtitle={dateLabel(today.date)}><div className="exercise-heading-actions"><Link className="command" href="/patient/plan">จัดการแผน</Link><DisplayMenu navigation /></div></PageHeading><PatientBanner accountProfile={patient} /><SnapshotNotice today={today} /><div className="section-heading patient-target-heading"><h2>เป้าหมายวันนี้</h2><ActivePlanBadge plan={today.activePlan} /></div><TrainingCards today={today} /></>;
}
export function TrainingHome({ patient, today, history }: { patient: PatientProfile; today: DailyTraining; history: TrainingHistory }) {
  const next = today.items.find(item => item.canStart && item.status !== "completed");
  const completed = today.items.filter(item => item.status === "completed").length;
  return <>
    <PageHeading title="หน้าหลัก" subtitle={dateLabel(today.date)}><DisplaySettings /></PageHeading><PatientBanner accountProfile={patient} /><SnapshotNotice today={today} />
    <div className="dashboard-grid"><section className="daily-overview" aria-label="สรุปการฝึกวันนี้">
      <div className="daily-meter" role="meter" aria-label="ความก้าวหน้ารายวัน" aria-valuemin={0} aria-valuemax={100} aria-valuenow={today.percent}>
        <svg viewBox="0 0 120 120" aria-hidden="true"><circle className="meter-track" cx="60" cy="60" r="52" /><circle className="meter-value" cx="60" cy="60" r="52" pathLength="100" strokeDasharray={`${today.percent} 100`} /></svg><div><strong>{today.percent}%</strong><span>ความคืบหน้าวันนี้</span></div>
      </div><dl className="daily-kpis"><div><dt>เซตที่ครบเป้าหมาย</dt><dd>{today.items.reduce((sum, item) => sum + (item.completedSets ?? item.savedSets), 0)} / {today.totalSets} เซต</dd></div><div><dt>ท่าที่ครบตามแผน</dt><dd>{completed} / {today.items.length} ท่า</dd></div><div><dt>เหลืออีก</dt><dd>{Math.max(0, today.totalSets - today.items.reduce((sum, item) => sum + (item.completedSets ?? Math.min(item.savedSets, item.targetSets)), 0))} เซต</dd></div></dl>
    </section><div className="dashboard-followup"><section className="next-exercise">
      <span className="info-badge">{next ? "ท่าถัดไป" : today.items.length ? "แผนวันนี้" : "ไม่มีรายการวันนี้"}</span>
      <h2>{next?.exercise.name || (today.items.length ? completed === today.items.length ? "บันทึกครบตามแผนของวันนี้แล้ว" : "รายการฝึกยังไม่พร้อมเริ่ม" : "ยังไม่มีรายการฝึกวันนี้")}</h2>
      {next && <p className="muted">เซตที่ {(next.completedSets ?? next.savedSets) + 1} จาก {next.targetSets} · {next.targetReps} ครั้งต่อเซต</p>}
      <div className="action-row">{next && <Link className="command primary" href={trainingHref(next, "guide")}>เริ่มฝึก <ArrowRight size={18} /></Link>}<Link className="command" href={next ? trainingHref(next, "guide") : "/patient/plan"}>{next ? "วิธีทำท่านี้" : "ดูแผนฝึก"}</Link></div>
    </section><section className="week-history" aria-label="ประวัติ 7 วันที่ผ่านมา"><div className="section-heading"><h2>การฝึก 7 วันล่าสุด</h2><CalendarDays size={20} /></div><div className="week-days">{history.week.map(day => {
      const date = new Date(`${day.date}T00:00:00Z`);
      return <span key={day.date} className={`${day.count ? "has-results" : ""} ${day.date === today.date ? "today" : ""}`} aria-label={`${dateLabel(day.date)} ${day.count} เซต`}><span>{["อา.", ...weekdays.slice(0, 6)][date.getUTCDay()]}</span><b>{date.getUTCDate()}</b><small>{day.count ? `${day.count} เซต` : "-"}</small></span>;
    })}</div></section></div></div>
    <div className="section-heading patient-target-heading"><h2>เป้าหมายวันนี้</h2><ActivePlanBadge plan={today.activePlan} /><Link className="command" href="/patient/exercises">ดูทั้งหมด</Link></div><TrainingCards today={today} />
    <div className="section-heading"><h2>ผลการฝึกล่าสุด</h2></div>
    {!history.recent.length ? <EmptyState title="ยังไม่มีเซตที่บันทึก" /> : <div className="table-scroll"><table className="data-table"><caption className="sr-only">เซตที่บันทึกจริง</caption><thead><tr><th>วันที่ / ท่า</th><th>จำนวนครั้ง</th><th>เวลา</th></tr></thead><tbody>{history.recent.map(set => <tr key={set.id}><td>{dateLabel(set.date)}<br />{set.exercise}</td><td>{set.reps} / {set.targetReps}</td><td>{set.seconds === null ? "ไม่ระบุ" : `${set.seconds} วินาที`}</td></tr>)}</tbody></table></div>}
  </>;
}
export function TrainingPlanSelection({ templates, activePlan, demo = false }: { templates: TrainingTemplate[]; activePlan: PatientTrainingPlan | null; demo?: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(activePlan?.templateId || null);
  // Keep the editing draft as text: Number("") would force a zero on deletion.
  const [sets, setSets] = useState("1"); const [reps, setReps] = useState("5"); const [side, setSide] = useState<"left" | "right">("left");
  const [query, setQuery] = useState(""); const [pending, setPending] = useState(false); const [error, setError] = useState("");
  const search = query.trim().toLowerCase();
  const visible = templates.filter(template => `${template.name} ${template.code} ${template.items.map(item => item.exercise.name).join(" ")}`.toLowerCase().includes(search));
  const selectedTemplate = templates.find(template => template.id === selected);

  async function select() {
    if (!selected || pending) return;
    const mock = isMockPlan(templates.find(template => template.id === selected)?.code);
    const targetSets = Number(sets), targetReps = Number(reps);
    if (mock && (!sets.trim() || !Number.isInteger(targetSets) || targetSets < 1 || targetSets > 20)) {
      setError("กรุณาระบุจำนวนเซตเป็นจำนวนเต็มตั้งแต่ 1–20"); return;
    }
    if (mock && (!reps.trim() || !Number.isInteger(targetReps) || targetReps < 1 || targetReps > 100)) {
      setError("กรุณาระบุครั้งต่อเซตเป็นจำนวนเต็มตั้งแต่ 1–100"); return;
    }
    setPending(true); setError("");
    try {
      await accountRequest("/api/patient/training/plan", { templateId: selected, ...(mock ? { cameraTest: { sets: targetSets, reps: targetReps, side } } : {}) });
      router.push("/patient");
      router.refresh();
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : "กรุณาลองใหม่"); }
    finally { setPending(false); }
  }

  return (
    <div className="training-picker-container">
      <PageHeading
        title="เลือกแผนการฝึก"
        subtitle={activePlan ? (activePlan.name === activePlan.code ? `แผนปัจจุบัน: ${activePlan.name}` : `แผนปัจจุบัน: ${activePlan.name} · ${formatPlanCode(activePlan.code)}`) : "เลือกแผนการฝึกที่แพทย์แนะนำ"}
        back="/patient"
        backLabel="กลับสู่แผนการฝึก"
      />

      <div className="plan-picker-alert" role="status">
        <Info size={20} className="alert-icon" aria-hidden="true" />
        <div className="alert-content">
          <strong>{demo ? "โหมดทดสอบระบบ (Demo)" : "คำแนะนำจากทีมรักษา"}</strong>
          <p>{demo ? "แผนสังเคราะห์สำหรับทดลองระบบ MoRe ไม่ใช่แผนรักษาจริงที่หมอยืนยัน" : "กรุณาเลือกแผนการฝึกที่แพทย์หรือนักกายภาพบำบัดของท่านแนะนำ"}</p>
        </div>
      </div>

      {activePlan && (
        <section className="active-plan-section" aria-label="แผนการฝึกปัจจุบันของคุณ">
          <div className="active-plan-card">
            <div className="active-plan-header">
              <div className="active-plan-badge-group">
                <span className="active-status-badge">
                  <CheckCircle2 size={15} aria-hidden="true" />
                  <span>แผนที่กำลังใช้งาน</span>
                </span>
                {isMockPlan(activePlan.templateCode) && <MockBadge />}
              </div>
              <h2 className="active-plan-title">
                {activePlan.name.startsWith("PLAN-HN-") || activePlan.name.startsWith("MP-")
                  ? `แผนฟื้นฟูประจำตัว (${activePlan.name})`
                  : activePlan.name}
              </h2>
              {isMockPlan(activePlan.templateCode) && (
                <p className="active-plan-notice">ข้อมูล Mock สำหรับทดสอบระบบ ไม่ใช่แผนรักษาหรือเป้าหมายที่หมอยืนยัน</p>
              )}
              <div className="active-plan-summary-bar">
                <span>รวม <strong>{activePlan.items.length}</strong> ท่าฝึก</span>
                <span className="dot-divider">•</span>
                <span>เป้าหมายรวม <strong>{activePlan.items.reduce((sum, item) => sum + item.targetSets * item.sessionsPerDay, 0)}</strong> เซต/วัน</span>
              </div>
            </div>

            <div className="active-plan-exercises-grid">
              {activePlan.items.map(item => (
                <div className="active-plan-exercise-chip" key={item.id}>
                  <div className="chip-name-row">
                    <span className="chip-exercise-name">{item.exercise.name}</span>
                    <span className="chip-module-tag">หมวด {item.exercise.module}</span>
                  </div>
                  <div className="chip-pills-row">
                    <span className="chip-pill">{item.targetSets} เซต × {item.targetReps} ครั้ง</span>
                    <span className="chip-pill">{item.sessionsPerDay} รอบ/วัน</span>
                    <span className="chip-pill">{schedule(item)}</span>
                    {item.side && <span className="chip-pill side">ข้าง: {sides[item.side] || item.side}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="plan-selection-section" aria-label="แผนการฝึกที่มีให้เลือก">
        <div className="plan-selection-header">
          <div>
            <h2>แผนการฝึกที่มีให้เลือก</h2>
            <p className="section-subtext">เลือกแผนที่ต้องการฝึกเพื่อปรับเป้าหมายประจำวันของท่าน</p>
          </div>
          <span className="plan-count-badge">ทั้งหมด {templates.length} แผน</span>
        </div>

        <div className="plan-search-wrapper">
          <Search size={18} className="search-icon" aria-hidden="true" />
          <input
            type="search"
            className="plan-search-input"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="ค้นหาชื่อแผน หรือชื่อท่าฝึก..."
            suppressHydrationWarning
          />
          {query && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setQuery("")}
              aria-label="ล้างคำค้นหา"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {!templates.length ? (
          <EmptyState title="ยังไม่มีแผนกลางที่พร้อมให้เลือก">
            <p>กรุณาติดต่อทีมรักษาเพื่อจัดแผนฝึก</p>
          </EmptyState>
        ) : !visible.length ? (
          <EmptyState title="ไม่พบแผนที่ตรงกับคำค้น" />
        ) : (
          <div className="plan-cards-grid">
            {visible.map(template => {
              const isSelected = selected === template.id;
              const isCurrentActive = activePlan?.templateId === template.id;
              const isMock = isMockPlan(template.code);

              return (
                <article
                  key={template.id}
                  className={`plan-template-card ${isSelected ? "selected" : ""} ${isCurrentActive ? "current-active" : ""}`}
                >
                  <div className="plan-card-top">
                    <div className="plan-card-meta-row">
                      {isCurrentActive && (
                        <span className="badge-current-plan">
                          <CheckCircle2 size={13} aria-hidden="true" />
                          <span>กำลังใช้งาน</span>
                        </span>
                      )}
                      <span className="badge-version">รุ่น {template.version}</span>
                      <span className="badge-count">{template.items.length} ท่าฝึก</span>
                      {template.code && (
                        <span className="badge-code" title={template.code}>
                          {formatPlanCode(template.code)}
                        </span>
                      )}
                      {isMock && <MockBadge />}
                    </div>

                    <div className="plan-card-header-main">
                      <div className="plan-card-info">
                        <h3 className="plan-card-name">{template.name}</h3>
                        {template.description && (
                          <p className="plan-card-desc">{template.description}</p>
                        )}
                      </div>

                      <div className="plan-card-action">
                        {isCurrentActive ? (
                          <button
                            type="button"
                            className="plan-select-btn current"
                            disabled
                          >
                            <CheckCircle2 size={16} aria-hidden="true" />
                            <span>กำลังใช้งาน</span>
                          </button>
                        ) : isSelected ? (
                          <button
                            type="button"
                            className="plan-select-btn active"
                            disabled={pending}
                            onClick={select}
                          >
                            <Save size={16} aria-hidden="true" />
                            <span>บันทึกใช้แผนนี้</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="plan-select-btn"
                            disabled={pending}
                            onClick={() => setSelected(template.id)}
                          >
                            <span>เลือกแผนนี้</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <details className="plan-card-details" open={isSelected || undefined}>
                    <summary className="plan-card-summary">
                      <span>ดูรายละเอียดท่าฝึก ({template.items.length} ท่า)</span>
                      <ChevronDown size={18} aria-hidden="true" />
                    </summary>

                    <div className="plan-card-body">
                      <div className="template-items-list">
                        {template.items.map(item => (
                          <div className="template-item-row" key={item.id}>
                            <div className="template-item-main">
                              <strong className="item-name">{item.exercise.name}</strong>
                              <div className="item-details-row">
                                <span className="item-badge">{item.targetSets} เซต × {item.targetReps} ครั้ง</span>
                                <span className="item-badge">{item.sessionsPerDay} รอบ/วัน</span>
                                <span className="item-badge">{schedule(item)}</span>
                                <span className="item-badge side">ข้าง: {sides[item.side || ""] || (item.exercise.supportsSide ? "เลือกก่อนฝึก" : "ไม่แยกข้าง")}</span>
                              </div>
                              {item.instructions && (
                                <p className="item-instructions">{item.instructions}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {isMock && isSelected && (
                        <div className="camera-test-settings-box">
                          <div className="settings-box-header">
                            <Sliders size={16} aria-hidden="true" />
                            <strong>ปรับตั้งค่าทดสอบระบบกล้อง AI</strong>
                            <span className="settings-module-tag">
                              Module {template.items[0]?.exercise.module} · {template.items[0]?.exercise.moduleName}
                            </span>
                          </div>

                          <div className="settings-controls-grid">
                            <label className="settings-field">
                              <span>จำนวนเซต (1–20)</span>
                              <input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={20}
                                step={1}
                                value={sets}
                                disabled={pending}
                                onChange={event => setSets(event.target.value)}
                              />
                            </label>
                            <label className="settings-field">
                              <span>ครั้งต่อเซต (1–100)</span>
                              <input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={100}
                                step={1}
                                value={reps}
                                disabled={pending}
                                onChange={event => setReps(event.target.value)}
                              />
                            </label>
                            <label className="settings-field">
                              <span>ข้างที่ฝึก</span>
                              <select
                                value={side}
                                disabled={pending}
                                onChange={event => setSide(event.target.value as "left" | "right")}
                              >
                                <option value="left">ซ้าย</option>
                                <option value="right">ขวา</option>
                              </select>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
        )}

        {error && <p className="error-text plan-picker-error" role="alert">{error}</p>}

        {!!templates.length && (
          <div className={`plan-picker-action-card ${selected ? "has-selection" : ""}`}>
            <div className="action-card-info">
              <span className="action-card-label">แผนที่คุณเลือก:</span>
              <strong className="action-card-title">
                {selectedTemplate ? selectedTemplate.name : "ยังไม่ได้เลือกแผน"}
              </strong>
              <span className="action-card-desc">
                {selectedTemplate
                  ? selected === activePlan?.templateId && !isMockPlan(selectedTemplate.code)
                    ? "นี่คือแผนที่คุณกำลังใช้งานอยู่ในปัจจุบัน"
                    : `มีท่าฝึกทั้งหมด ${selectedTemplate.items.length} ท่า พร้อมเริ่มฝึกทันทีเมื่อบันทึก`
                  : "คลิกปุ่ม 'เลือกแผนนี้' ที่รายการด้านบนเพื่อเปลี่ยนแผน"}
              </span>
            </div>
            <button
              type="button"
              className="command primary save-plan-button"
              disabled={!selected || pending || (selected === activePlan?.templateId && !isMockPlan(selectedTemplate?.code))}
              onClick={select}
            >
              <Save size={18} aria-hidden="true" />
              <span>
                {pending
                  ? "กำลังบันทึก…"
                  : selected === activePlan?.templateId && !isMockPlan(selectedTemplate?.code)
                  ? "กำลังใช้แผนนี้อยู่"
                  : "บันทึกและเริ่มใช้แผนนี้"}
              </span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export function TrainingGuide({ item }: { item: DailyTrainingItem }) {
  if (item.exercise.code === "demo-knee-extension") return <KneeExerciseGuide name={item.exercise.name} cameraHref={trainingHref(item, "camera")} canStart={item.canStart} targetSets={item.targetSets} targetReps={item.targetReps} />;
  return <><PageHeading title={item.exercise.name} subtitle={`หมวด ${item.exercise.module} · ${item.exercise.english}`} back="/patient/exercises" /><div className="exercise-guide-stack"><section><div className="guide-placeholder"><Video size={40} aria-hidden="true" /><p>ยังไม่มีสื่อสาธิตจากทีมกายภาพ</p></div><dl className="data-list"><div><dt>มุมกล้อง</dt><dd>{item.exercise.view || "ยังไม่ระบุ"}</dd></div><div><dt>ข้างที่ฝึก</dt><dd>{sides[item.side || ""] || (item.exercise.supportsSide ? "เลือกก่อนฝึก" : "ไม่แยกข้าง")}</dd></div><div><dt>เป้าหมายวันนี้</dt><dd>{item.targetSets} เซต · {item.targetReps} ครั้ง / เซต</dd></div></dl></section><section><h2>เตรียมก่อนฝึก</h2>{item.instructions && <p className="training-instructions">{item.instructions}</p>}{item.exercise.tutorial ? <p className="training-instructions">{item.exercise.tutorial}</p> : <p>กรุณาปฏิบัติตามคำแนะนำจากทีมรักษา</p>}<div className="action-row">{item.canStart ? <Link className="command primary" href={trainingHref(item, "camera")}>ไปหน้ากล้อง <ArrowRight size={18} /></Link> : <p className="notice">รายการนี้ไม่สามารถเริ่มฝึกได้</p>}</div></section></div></>;
}
