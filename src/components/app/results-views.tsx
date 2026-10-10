"use client";
import Link from "next/link";
import { useState } from "react";
import { PageHeading, EmptyState } from "./shell";
import type { ResultSession } from "@/lib/results-service";
import { MockBadge } from "../ui/mock-badge";

function groups(session: ResultSession) {
  const metrics = new Map<string, { label: string; values: number[] }>();
  for (const set of session.sets) for (const rep of set.repetitions) for (const metric of rep.metrics) {
    const key = `${metric.metricId}:${metric.side}`;
    const group = metrics.get(key) || { label: `${metric.label} (${metric.side || "-"})`, values: [] };
    group.values.push(metric.peak); metrics.set(key, group);
  }
  return [...metrics.values()];
}
export function ResultsHistory({ sessions, base = "/patient", date: initialDate = "", exerciseCode = "", calendar = false, initialMonth = "" }: { sessions: ResultSession[]; base?: string; date?: string; exerciseCode?: string; calendar?: boolean; initialMonth?: string }) {
  const [date, setDate] = useState(initialDate);
  const isTest = (session: ResultSession) => session.isMock || session.code.startsWith("demo-");
  const [testResults, setTestResults] = useState(exerciseCode.startsWith("demo-") || (sessions.length > 0 && sessions.every(isTest)));
  const scoped = sessions.filter(session => isTest(session) === testResults);
  const displayed = scoped.filter(session => (!date || session.date === date) && (!exerciseCode || session.code === exerciseCode));
  const dates = [...new Set(scoped.map(session => session.date))].sort().reverse();
  const [month, setMonth] = useState(initialMonth || dates[0]?.slice(0, 7) || "2000-01");
  const beginning = new Date(`${month}-01T00:00:00Z`);
  const offset = (beginning.getUTCDay() + 6) % 7;
  const days = new Date(beginning.getUTCFullYear(), beginning.getUTCMonth() + 1, 0).getDate();
  return <><PageHeading title="ประวัติและความก้าวหน้า" back={base === "/patient" ? "/patient" : base} />
    <label>ประเภทผล<select value={testResults ? "test" : "clinical"} onChange={event => setTestResults(event.target.value === "test")}><option value="clinical">ผลฝึกจริง</option><option value="test">ผลทดสอบระบบกล้อง</option></select></label>{testResults && <p className="notice">โหมดทดสอบกล้อง · แสดงผลทดสอบแยกจากผลฝึกจริง</p>}
    <div className="filter-bar"><label>วันที่ฝึก<input type="date" value={date} onChange={event => setDate(event.target.value)} /></label><button className="command" onClick={() => setDate("")}>ทุกวันที่บันทึก</button>{base === "/patient" && <Link className="command" href={calendar ? "/patient/progress" : "/patient/progress/calendar"}>{calendar ? "รายการผล" : "ปฏิทิน"}</Link>}</div>
    {calendar && <><label>เดือน<input type="month" value={month} required onChange={event => { if (event.target.value) setMonth(event.target.value); }} /></label><div className="calendar-grid results-calendar">{["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"].map(day => <strong key={day}>{day}</strong>)}{Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: days }, (_, index) => {
      const day = `${month}-${String(index + 1).padStart(2, "0")}`; const count = scoped.filter(session => session.date === day).reduce((sum, session) => sum + session.sets.length, 0);
      return <Link key={day} href={`/patient/progress/calendar/${day}`} aria-label={`${day} ${count} เซต`}><b>{index + 1}</b><small>{count ? `${count} เซต` : "-"}</small></Link>;
    })}</div></>}
    <p className="muted">แสดงเฉพาะเซตที่บันทึกแล้ว · วันตาม Asia/Bangkok · สูงสุด 200 รอบการฝึกล่าสุด</p>
    {!displayed.length ? <EmptyState title="ยังไม่มีผลที่บันทึก" /> : <div className="exercise-list">{displayed.map(session => <article className="exercise-row" key={session.id}><div><h2>{session.exercise} {session.isMock && <MockBadge />}</h2>{session.isMock && <p>{session.sourceTemplate?.name} · ผล Mock สำหรับทดสอบระบบ</p>}<p>{session.date} · {session.sets.length} เซต · {session.sets.reduce((sum, set) => sum + set.repetitions.length, 0)} ครั้ง</p>{groups(session).map(group => <p key={group.label}>{group.label} · MAX {Math.max(...group.values).toFixed(2)}° · AVG {(group.values.reduce((sum, value) => sum + value, 0) / group.values.length).toFixed(2)}°</p>)}</div><Link className="command" href={`${base}/sessions/${session.id}`}>รายละเอียดผล</Link></article>)}</div>}
  </>;
}
export function ResultDetail({ session, back }: { session: ResultSession; back: string }) {
  return <><PageHeading title={session.exercise} subtitle={session.date} back={back} />{session.isMock && <p className="notice"><MockBadge /> {session.sourceTemplate?.name} · {session.sourceTemplate?.code} · รุ่น {session.sourceTemplate?.version} · ผลทดสอบระบบ ไม่ใช่ผลจากแผนรักษาที่หมอยืนยัน</p>}{session.code.startsWith("demo-") && <p className="notice">DEMO สังเคราะห์ · ไม่ใช่ผลประเมินทางคลินิก</p>}
    {groups(session).map(group => <p key={group.label}><strong>{group.label}</strong> · MAX {Math.max(...group.values).toFixed(2)}° · AVG {(group.values.reduce((sum, value) => sum + value, 0) / group.values.length).toFixed(2)}°</p>)}
    {session.sets.map(set => <section className="results-set" key={set.id}><h2>เซต {set.number}: {set.repetitions.length} / {set.target} ครั้ง</h2><p>{set.elapsed ?? 0} วินาที · บันทึก {set.savedAt ? new Date(set.savedAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }) : "-"}</p>
      {!set.repetitions.length ? <p>บันทึกเซตโดยไม่มีรอบที่ทำครบ</p> : <div className="table-scroll"><table><thead><tr><th>ครั้ง</th><th>ข้าง</th><th>ตัวชี้วัด</th><th>เริ่ม</th><th>สูงสุด</th><th>กลับ</th><th>เกณฑ์</th><th>จุดตรวจ</th></tr></thead><tbody>{set.repetitions.flatMap(rep => rep.metrics.map(metric => <tr key={`${rep.number}:${metric.metricId}`}><td>{rep.number}</td><td>{rep.side === "left" ? "ซ้าย" : "ขวา"}</td><td>{metric.label} v{metric.definitionVersion}</td><td>{metric.start?.toFixed(2) ?? "-"}°</td><td>{metric.peak.toFixed(2)}°</td><td>{metric.end?.toFixed(2) ?? "-"}°</td><td>v{rep.criteriaVersion} · {rep.correct ? "เข้าเกณฑ์" : "นอกเกณฑ์"}{session.code.startsWith("demo-") && " Demo"}</td><td>{rep.checkpoints.map(check => `${check.phase}: ${check.value?.toFixed(2) ?? "-"} (${check.passed ? "ผ่าน" : "ไม่ผ่าน"})`).join(" / ")}</td></tr>))}</tbody></table></div>}</section>)}
  </>;
}
