"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeading, EmptyState } from "./shell";
import type { PatientProgress, ProgressDay } from "@/lib/patient-progress";
import styles from "./patient-progress.module.css";
const shortDate = (date: string) => new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "numeric" }).format(new Date(`${date}T00:00:00Z`));
const status = (d: ProgressDay) => d.completed ? "ครบตามแผน" : d.sets.length ? "กำลังทำ" : "ยังไม่เริ่ม";
const sideLabel = (side: string | null) => side === "left" ? "ซ้าย" : side === "right" ? "ขวา" : side === "both" ? "สองข้าง" : "ไม่แยกข้าง";
const overviewUrl = (date: string) => `/patient/progress?date=${date}`;
function remember(url: string) { try { sessionStorage.setItem(`more-progress-scroll:${url}`, String(window.scrollY)); } catch { /* Browser storage is optional. */ } }
function Metrics({ day }: { day: ProgressDay }) {
  return <div className={styles.metrics}><div><span>จำนวนครั้งที่ทำ</span><strong>{day.count}</strong></div><div><span>ครั้งที่ทำถูก</span><strong>{day.correct}</strong></div><div><span>เซตครบตามแผน</span><strong>{day.completedSets} / {day.requiredSets}</strong></div><div><span>แบ่งเข้ามาฝึกและบันทึก</span><strong>{day.visits} ช่วง</strong></div></div>;
}
function TrainingHistory({ days, backDate }: { days: ProgressDay[]; backDate: string }) {
  const recorded = days.filter(d => d.sets.length).sort((a, b) => b.date.localeCompare(a.date) || a.id - b.id);
  return <section id="progress-history"><h2>ประวัติการฝึก</h2><p>ผลที่บันทึกทุกวัน ไม่จำกัดตามช่วงกราฟ</p>{!recorded.length ? <EmptyState title="ยังไม่มีประวัติการฝึกที่บันทึก" /> : <div className={styles.history}>{recorded.map(d => <article className={`panel ${styles.historyItem}`} key={d.id}><div><h3>{shortDate(d.date)}</h3><p>{d.name} · {sideLabel(d.side)}</p><p>ทำ {d.count} ครั้ง · ถูก {d.correct} ครั้ง</p><span className={styles.badge}>{status(d)}</span></div><Link onClick={() => remember(overviewUrl(backDate))} href={`/patient/progress/exercises/${d.id}?date=${backDate}#progress-results`}>ดูรายละเอียด <ArrowRight size={18} aria-hidden="true" /></Link></article>)}</div>}</section>;
}
export function PatientProgressOverview({ data, initialDate, name }: { data: PatientProgress; initialDate: string; name: string }) {
  const router = useRouter(); const url = overviewUrl(initialDate);
  useEffect(() => { let position: number | null = null; try { const stored = sessionStorage.getItem(`more-progress-scroll:${url}`); if (stored !== null) position = Number(stored); } catch { /* No persistence required for rendering. */ } if (position === null || !Number.isFinite(position)) return; const frame = requestAnimationFrame(() => window.scrollTo(0, position!)); return () => cancelAnimationFrame(frame); }, [url]);
  const days = data.days.filter(d => d.date === initialDate);
  const required = days.reduce((n, d) => n + d.requiredSets, 0), complete = days.reduce((n, d) => n + d.completedSets, 0);
  const percent = required ? Math.round(days.reduce((n, d) => n + d.progressSets, 0) / required * 100) : 0;
  const modules = [...new Set(days.map(d => d.module))];
  let streak = 0; let cursor = new Date(`${initialDate}T00:00:00Z`);
  while (true) { const date = cursor.toISOString().slice(0, 10); const planned = data.days.filter(d => d.date === date); if (!planned.length || !planned.every(d => d.completed)) break; streak++; cursor = new Date(cursor.getTime() - 86400000); }
  return <div className={styles.page}><PageHeading title="ความก้าวหน้า" />
    <section className={`panel ${styles.hero}`} aria-label="ภาพรวมความก้าวหน้า"><div><h2>{name}</h2><p>{shortDate(initialDate)}</p></div><div className={styles.ring} style={{ background: `conic-gradient(var(--brand) ${percent}%, var(--ui-line) 0)` }}><div><strong>{percent}%</strong><span>ความคืบหน้า{initialDate === data.today ? "วันนี้" : "วันที่เลือก"}</span></div></div></section>
    <section className={`panel ${styles.streak}`}><CalendarDays aria-hidden="true" /><div><strong>ทำครบแผนต่อเนื่อง {streak} วัน</strong><p>นับวันที่ทำครบทุกท่าและทุกข้าง ถึงวันที่เลือก</p></div></section>
    <div className={styles.filters}><label>วันที่ฝึก<input type="date" value={initialDate} onChange={e => { if (e.target.value) router.replace(overviewUrl(e.target.value), { scroll: false }); }} /></label></div>
    <section><h2>ความคืบหน้า{initialDate === data.today ? "วันนี้" : "วันที่เลือก"}</h2><div className={styles.summary}><span>{complete} / {required} เซตครบตามแผน</span><span>{days.filter(d => d.completed).length} / {days.length} ท่าฝึก</span></div>
      {!days.length ? <EmptyState title="ไม่มีรายการฝึกในวันที่เลือก"><p>เลือกวันอื่นเพื่อดูผลการฝึก</p></EmptyState> : <div className={styles.modules}>{modules.map(module => <article className={`panel ${styles.module}`} key={module}><header><small>Module {module}</small><h3>{days.find(d => d.module === module)?.moduleName}</h3></header>{days.filter(d => d.module === module).map(d => <div className={styles.exercise} id={`progress-${d.id}`} key={d.id}><h3>{d.name}</h3><p>{d.completedSets} / {d.requiredSets} เซตครบตามแผน · {d.targetReps} ครั้งต่อเซต · {sideLabel(d.side)}</p><p>ทำ {d.count} ครั้ง · ถูก {d.correct} ครั้ง · บันทึก {d.visits} ช่วง</p><div className={styles.row}><span className={styles.badge}>{status(d)}</span><Link onClick={() => remember(url)} href={`/patient/progress/exercises/${d.id}?date=${initialDate}`}>ดูรายละเอียด <ArrowRight size={18} aria-hidden="true" /></Link></div></div>)}</article>)}</div>}
    </section>
    <TrainingHistory days={data.days} backDate={initialDate} />
  </div>;
}
export function PatientProgressDetail({ data, back }: { data: PatientProgress; back: string }) {
  const day = data.selected!; const [range, setRange] = useState(7);
  const [metric, setMetric] = useState<"count" | "correct" | "all">("all");
  const chartLabels = { count: "จำนวนครั้งที่ทำได้", correct: "จำนวนครั้งที่ทำถูก", all: "ทั้งหมด" };
  const visibleMetrics: ("count" | "correct")[] = metric === "all" ? ["count", "correct"] : [metric];
  const end = new Date(`${day.date}T00:00:00Z`).getTime(), start = end - (range - 1) * 86400000;
  const history = data.days.filter(d => d.code === day.code && new Date(`${d.date}T00:00:00Z`).getTime() >= start && d.date <= day.date);
  const recorded = history.filter(d => d.sets.length);
  const series = [...new Set(recorded.map(d => d.date))].sort().map(date => ({ date, count: recorded.filter(d => d.date === date).reduce((n, d) => n + d.count, 0), correct: recorded.filter(d => d.date === date).reduce((n, d) => n + d.correct, 0) }));
  const max = Math.max(1, ...series.flatMap(p => visibleMetrics.map(key => p[key])));
  const firstDate = series.length ? new Date(`${series[0].date}T00:00:00Z`).getTime() : start;
  const lastDate = series.length ? new Date(`${series[series.length - 1].date}T00:00:00Z`).getTime() : end;
  const points = (key: "count" | "correct") => series.map(p => ({ ...p, value: p[key], x: 45 + ((new Date(`${p.date}T00:00:00Z`).getTime() - firstDate) / Math.max(1, lastDate - firstDate)) * 370, y: 210 - p[key] / max * 160 }));
  return <div className={styles.page}><Link className={styles.back} href={back}><ArrowLeft size={20} />กลับหน้าภาพรวม</Link><PageHeading title="ความก้าวหน้า" subtitle={day.name} />
    <nav className={styles.sectionNav} aria-label="ส่วนรายละเอียด"><a href="#progress-chart">กราฟ</a><a href="#progress-results">รายละเอียด</a></nav>
    <section className={`panel ${styles.chart}`} id="progress-chart"><h2>จำนวนครั้งแต่ละวัน</h2><p>วันที่ตาม Asia/Bangkok · ผลรอบที่บันทึกแล้ว</p>
      <div className={styles.ranges} role="group" aria-label="ข้อมูลในกราฟ">{(["count", "correct", "all"] as const).map(key => <button type="button" key={key} aria-pressed={metric === key} onClick={() => setMetric(key)}>{chartLabels[key]}</button>)}</div>
      <div className={styles.legend}>{visibleMetrics.map(key => <span key={key}><i className={key === "correct" ? styles.correctMarker : styles.countMarker} aria-hidden="true" />{chartLabels[key]}{key === "correct" && " (เส้นประ)"}</span>)}</div>
      {!series.length ? <EmptyState title="ยังไม่มีผลที่บันทึกในช่วงนี้" /> : <><svg viewBox="0 0 460 260" role="img" aria-label={`กราฟ ${visibleMetrics.map(key => `${chartLabels[key]} ${series.map(p => `${p.date}: ${p[key]}`).join(", ")}`).join("; ")}`}><line x1="45" y1="45" x2="45" y2="210" /><line x1="45" y1="210" x2="420" y2="210" /><text x="5" y="52">{max}</text><text x="20" y="214">0</text>{visibleMetrics.map(key => <g key={key} data-metric={key} className={key === "correct" ? styles.correctSeries : styles.countSeries}><polyline points={points(key).map(p => `${p.x},${p.y}`).join(" ")} />{points(key).map(p => <circle key={p.date} cx={p.x} cy={p.y} r="4"><title>{chartLabels[key]} · {p.date}: {p.value} ครั้ง</title></circle>)}</g>)}<text x="45" y="245">{shortDate(series[0].date)}</text>{series.length > 1 && <text x="415" y="245" textAnchor="end">{shortDate(series[series.length - 1].date)}</text>}</svg><details><summary>ดูค่าตามวันที่</summary>{series.map(p => <p key={p.date}>{shortDate(p.date)} · {visibleMetrics.map(key => `${chartLabels[key]} ${p[key]} ครั้ง`).join(" · ")}</p>)}</details></>}

      <div className={styles.ranges} role="group" aria-label="ช่วงเวลา">{[[7,"7 วัน"],[30,"1 เดือน"],[90,"3 เดือน"],[365,"1 ปี"]].map(([value,label]) => <button type="button" key={value} aria-pressed={range === value} onClick={() => setRange(Number(value))}>{label}</button>)}</div>
    </section>
    <div className={styles.metrics}><div><span>แนวโน้ม</span><strong className={styles.noTrend}>ยังไม่มีข้อมูลแนวโน้ม</strong><small>ยังไม่มีสูตรเปอร์เซ็นต์แนวโน้มที่กำหนด</small></div><div><span>วันที่ฝึกล่าสุดในช่วงนี้</span><strong>{series.length ? shortDate(series[series.length - 1].date) : "—"}</strong></div></div>
    <section id="progress-results"><h2>ผลการฝึกวันที่ {shortDate(day.date)}</h2><div className={`panel ${styles.result}`}><div className={styles.row}><h3>{shortDate(day.date)}</h3><span className={styles.badge}>{status(day)}</span></div><Metrics day={day} />
      {!day.angles.length ? <p>ค่าเฉลี่ยมุมสูงสุดต่อรอบ: — · ยังไม่มีข้อมูลมุมที่บันทึก</p> : day.angles.map(a => <p key={a.key}>ค่าเฉลี่ยมุมสูงสุดต่อรอบ · {a.label}: <strong>{a.average?.toFixed(1) ?? "—"}{a.average !== null && "°"}</strong> · มุมสูงสุด {a.max?.toFixed(1) ?? "—"}{a.max !== null && "°"}</p>)}
      {!day.sets.length ? <EmptyState title="ยังไม่มีเซตที่บันทึก" /> : day.sets.map((s, index) => {
        const prior = day.sets.slice(0,index).filter(p => p.side === s.side && p.count >= p.target).length;
        return <section className={styles.set} key={s.id}><div className={styles.row}><h3>เซตตามแผนที่ {prior + 1} · {sideLabel(s.side)}</h3><span>{s.count} / {s.target} ครั้ง</span></div><progress value={Math.min(s.count,s.target)} max={s.target} aria-label={`เซต ${prior+1} ทำ ${s.count} จาก ${s.target} ครั้ง`} /><p>ทำถูก {s.correct} ครั้ง · {s.count >= s.target ? "ครบเป้าหมายเซต" : "ยังไม่ครบเป้าหมาย"} · เวลาฝึก {s.elapsed === null ? "—" : `${s.elapsed} วินาที`}</p><small>ช่วงการฝึก #{s.sessionId} · เซตที่บันทึก #{s.id}</small>{!s.count && <p>บันทึกแล้วโดยยังไม่มีรอบที่ทำครบ</p>}</section>;
      })}
      <p className="muted">แยกช่วงเข้ามาฝึกออกจากเซตตามแผน หากมีรายการบางส่วนเก่าคนละเซต ระบบไม่รวมข้อมูลเหล่านั้นอัตโนมัติ</p>
    </div></section>
    <TrainingHistory days={data.days.filter(d => d.code === day.code)} backDate={new URL(back, "http://localhost").searchParams.get("date") ?? day.date} />
  </div>;
}
