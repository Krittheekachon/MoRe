"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { accountRequest } from "@/lib/account-client";
import { dateInThailand } from "@/lib/birth-date";
import { ArrowRight, CalendarDays, Save, Video, UserRound, KeyRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { exercises, demoDate, dateLabel, ageOn, sexLabel, strokeLabel, type PatientProfile, type ExerciseId } from "@/lib/demo-data";
import { useDemo } from "./demo-provider";
import { PageHeading, EmptyState } from "./shell";
import { DisplaySettings } from "./display-settings";

export function ExerciseCards({ all = false, compact = false }: { all?: boolean; compact?: boolean }) {
  const { dailyPlans, sets } = useDemo();
  const plan = dailyPlans["1"];
  if (!plan.length) return <EmptyState title="ยังไม่มีรายการฝึก"><Link className="command primary" href="/patient/plan">เลือกแผนฝึก <ArrowRight size={18} /></Link></EmptyState>;
  return <div className="exercise-grid">{plan.map(item => {
    const exercise = exercises.find(e => e.id === item.exercise_id)!;
    const saved = sets.filter(s => s.patient_id === "1" && s.exercise_id === item.exercise_id && s.local_date === demoDate).length;
    return <article className={`exercise-item ${compact ? "compact-exercise" : ""}`} key={item.exercise_id}>
      <div className="exercise-title-row">{compact ? <h2><Link href={`/patient/exercises/${exercise.id}/guide`}>{exercise.name}</Link></h2> : <span className="tag">หมวด {exercise.module}</span>}<span className={`exercise-status ${saved >= item.target_sets ? "complete" : saved > 0 ? "active" : "pending"}`}>{saved >= item.target_sets ? "เสร็จสิ้น" : saved > 0 ? "กำลังดำเนินการ" : "ยังไม่ดำเนินการ"}</span></div>
      {!compact && <h2>{exercise.name}</h2>}<p>{compact ? `${saved} / ${item.target_sets} เซตที่บันทึก` : `${item.target_sets} เซต · ${item.target_reps_per_set} ครั้ง / เซต`}</p>
      {!compact && <>
      <progress value={saved} max={item.target_sets} aria-label={`ความก้าวหน้า ${exercise.name}`} /><p>{saved} / {item.target_sets} เซตที่บันทึก</p>
      <div className="action-row"><Link className="command primary" href={`/patient/exercises/${exercise.id}/guide`}>{saved >= item.target_sets ? "ดูคู่มือ" : "เริ่มฝึก"}<ArrowRight size={18} /></Link>{all && <Link className="command" href={`/patient/progress/${exercise.id}`}>ดูผลฝึก</Link>}</div>
      </>}
    </article>;
  })}</div>;
}
export function PatientBanner({ accountProfile }: { accountProfile?: PatientProfile }) {
  const { profiles } = useDemo();
  const patient = accountProfile || profiles[0];
  return <section className="patient-banner" aria-label="ข้อมูลผู้ป่วย"><span className="patient-avatar"><UserRound size={26} /></span><div><h2>{patient.full_name}</h2><div className="patient-meta"><span>อายุ <b>{ageOn(patient.date_of_birth, dateInThailand())}</b> · {sexLabel[patient.sex]}</span><span>การวินิจฉัย <b>{strokeLabel[patient.stroke_type]}</b></span><span>วันที่วินิจฉัย <b>{patient.stroke_diagnosed_on ? dateLabel(patient.stroke_diagnosed_on) : "ไม่ระบุ"}</b></span></div></div></section>;
}

export function PatientHome({ patient }: { patient?: PatientProfile }) {
  const { plans, dailyPlans, sets } = useDemo();
  const plan = dailyPlans["1"];
  const total = plan.reduce((sum, item) => sum + item.target_sets, 0);
  const saved = sets.filter(s => s.patient_id === "1" && s.local_date === demoDate).length;
  const countFor = (id: string) => sets.filter(s => s.patient_id === "1" && s.exercise_id === id && s.local_date === demoDate).length;
  const percent = total ? Math.min(100, Math.round(saved / total * 100)) : 0;
  const completed = plan.filter(item => countFor(item.exercise_id) >= item.target_sets).length;
  const next = plan.find(item => countFor(item.exercise_id) < item.target_sets);
  const nextExercise = exercises.find(e => e.id === next?.exercise_id);
  const week = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(`${demoDate}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() - 6 + index);
    const date = day.toISOString().slice(0, 10);
    return { date, day: day.getUTCDate(), label: ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."][day.getUTCDay()], count: sets.filter(s => s.patient_id === "1" && s.local_date === date).length };
  });
  return <>
    <PageHeading title="หน้าหลัก" subtitle={dateLabel(demoDate)} />
    <PatientBanner accountProfile={patient} />
    <p className="notice">แผนฝึกและผลฝึกด้านล่างเป็นข้อมูลตัวอย่าง ยังไม่ได้เชื่อมฐานข้อมูล</p>
    {JSON.stringify(plans["1"]) !== JSON.stringify(plan) && <p className="notice">ปรับแผนใหม่แล้ว รายการฝึกประจำวันที่ {dateLabel(demoDate)} ยังใช้เป้าหมายเดิม</p>}
    {!plan.length ? <EmptyState title="ยังไม่มีรายการฝึก"><Link className="command primary" href="/patient/plan">เลือกแผนฝึก <ArrowRight size={18} /></Link></EmptyState> : <>
      <div className="dashboard-grid">
        <section className="daily-overview" aria-label="สรุปการฝึกวันนี้">
          <div className="daily-meter" role="meter" aria-label="ความก้าวหน้ารายวัน" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <svg viewBox="0 0 120 120" aria-hidden="true"><circle className="meter-track" cx="60" cy="60" r="52" /><circle className="meter-value" cx="60" cy="60" r="52" pathLength="100" strokeDasharray={`${percent} 100`} /></svg>
            <div><strong>{percent}%</strong><span>ความคืบหน้าวันนี้</span></div>
          </div>
          <dl className="daily-kpis"><div><dt>เซตที่บันทึก</dt><dd>{saved} / {total} เซต</dd></div><div><dt>ท่าที่บันทึกครบ</dt><dd>{completed} / {plan.length} ท่า</dd></div><div><dt>เหลืออีก</dt><dd>{Math.max(0, total - saved)} เซต</dd></div></dl>
        </section>
        <div className="dashboard-followup"><section className="next-exercise">
          <span className="info-badge">{next ? "ท่าถัดไป" : "เสร็จสิ้น"}</span>
          <h2>{nextExercise?.name || "บันทึกครบตามแผนของวันนี้แล้ว"}</h2>
          <p className="muted">{next ? `เซตที่ ${countFor(next.exercise_id) + 1} จาก ${next.target_sets} · ${next.target_reps_per_set} ครั้งต่อเซต` : "ดูผลการฝึกได้ที่หน้าความก้าวหน้า"}</p>
          <div className="action-row">{next && <Link className="command primary" href={`/patient/exercises/${next.exercise_id}/guide`}>เริ่มฝึก <ArrowRight size={18} /></Link>}<Link className="command" href={next ? `/patient/exercises/${next.exercise_id}/guide` : "/patient/progress"}>{next ? "วิธีทำท่านี้" : "ดูความก้าวหน้า"}</Link></div>
        </section>
      <section className="week-history" aria-label="ประวัติ 7 วันที่ผ่านมา"><div className="section-heading"><h2>การฝึก 7 วันล่าสุด</h2><Link className="icon-command" href="/patient/progress/calendar" aria-label="ปฏิทิน" title="ปฏิทินการฝึก"><CalendarDays size={20} /></Link></div><div className="week-days">{week.map(day => <Link key={day.date} href={`/patient/progress/calendar/${day.date}`} className={`${day.count ? "has-results" : ""} ${day.date === demoDate ? "today" : ""}`} aria-label={`${dateLabel(day.date)} ${day.count} เซต`}><span>{day.label}</span><b>{day.day}</b><small>{day.count ? `${day.count} เซต` : "-"}</small></Link>)}</div></section>
        </div>
      </div>
      <div className="section-heading"><h2>ผลการฝึกล่าสุด</h2><Link className="command" href="/patient/progress">ดูทั้งหมด</Link></div>
      <SavedSetTable limit={3} />
    </>}
  </>;
}
export function PatientExercises() { return <><PageHeading title="แผนการฝึก" subtitle={dateLabel(demoDate)}><Link className="command" href="/patient/plan">จัดการแผน</Link></PageHeading><PatientBanner /><div className="section-heading"><h2>เป้าหมายวันนี้</h2></div><ExerciseCards all /></>; }

export function ExerciseGuide({ id }: { id: ExerciseId }) {
  const exercise = exercises.find(e => e.id === id)!;
  const steps = id === "bridging"
    ? ["จัดพื้นที่บนพื้นให้ปลอดภัยและเตรียมอุปกรณ์ตามที่ทีมรักษาแนะนำ", "ตรวจท่าฝึกและข้อจำกัดกับนักกายภาพก่อนเริ่ม", "ฝึกตามแผนที่ได้รับ หากมีอาการผิดปกติให้หยุดและติดต่อทีมรักษา"]
    : ["เตรียมเก้าอี้ที่มั่นคงและพื้นที่รอบตัวให้ปลอดภัย", "จัดกล้องให้เห็นร่างกายจากด้านที่กำหนด และเลือกข้างตามแผน", "ทำตามคำแนะนำของนักกายภาพ หากมีอาการผิดปกติให้หยุดฝึก"];
  return <><PageHeading title={exercise.name} subtitle={`หมวด ${exercise.module} · ${exercise.english}`} back="/patient/exercises" /><div className="split-view"><section><div className="guide-placeholder"><Video size={40} aria-hidden="true" /><p>ยังไม่มีสื่อสาธิตจากทีมกายภาพ</p></div><dl className="data-list"><div><dt>มุมกล้อง</dt><dd>{exercise.view}</dd></div><div><dt>ข้างที่ฝึก</dt><dd>{exercise.side ? "ตามแผนฝึกที่ได้รับ" : "ไม่แยกข้าง"}</dd></div></dl></section><section><h2>เตรียมก่อนฝึก</h2><ol className="guide-steps">{steps.map(s => <li key={s}>{s}</li>)}</ol><div className="action-row"><Link className="command primary" href={`/patient/exercises/${id}/camera`}>ไปหน้ากล้อง <ArrowRight size={18} /></Link></div></section></div></>;
}
export function SavedSetTable({ patientId = "1", exerciseId, date, doctor = false, limit }: { patientId?: string; exerciseId?: string; date?: string; doctor?: boolean; limit?: number }) {
  const { sets } = useDemo();
  const filtered = sets.filter(s => s.patient_id === patientId && (!exerciseId || s.exercise_id === exerciseId) && (!date || s.local_date === date)).slice().reverse().slice(0, limit);
  if (!filtered.length) return <EmptyState title="ยังไม่มีเซตที่บันทึก" />;
  return <div className="table-scroll"><table className="data-table"><caption className="sr-only">ผลเซตที่บันทึก</caption><thead><tr><th>วันที่ / ท่า</th><th>จำนวนครั้ง</th><th>เวลา</th><th>รายละเอียด</th></tr></thead><tbody>{filtered.map(s => <tr key={s.id}><td>{dateLabel(s.local_date)}<br /><span className="muted">{exercises.find(e => e.id === s.exercise_id)?.name}</span></td><td>{s.reps} / {s.target_reps}</td><td>{s.elapsed_seconds} วินาที</td><td><Link className="command" href={doctor ? `/doctor/patients/${patientId}/sessions/${s.session_id}` : `/patient/progress/${s.exercise_id}/detail`}>ดูเซต</Link></td></tr>)}</tbody></table></div>;
}
export function PatientProgress({ exerciseId, detail = false, date }: { exerciseId?: ExerciseId; detail?: boolean; date?: string }) {
  const { sets } = useDemo();
  const [period, setPeriod] = useState(7);
  const cutoff = new Date(`${demoDate}T00:00:00Z`); cutoff.setUTCDate(cutoff.getUTCDate() - period + 1);
  const filtered = sets.filter(s => s.patient_id === "1" && (!exerciseId || s.exercise_id === exerciseId) && s.local_date >= cutoff.toISOString().slice(0, 10) && s.local_date <= demoDate);
  const dates = Array.from(new Set(filtered.map(s => s.local_date))).sort();
  const title = date ? `ผลฝึก ${dateLabel(date)}` : exerciseId ? exercises.find(e => e.id === exerciseId)!.name : "ความก้าวหน้า";
  return <><PageHeading title={title} back={exerciseId || date ? "/patient/progress" : undefined} />{exerciseId && <nav className="tabs" aria-label="มุมมองผลฝึก"><Link href={`/patient/progress/${exerciseId}`} aria-current={!detail ? "page" : undefined}>กราฟ</Link><Link href={`/patient/progress/${exerciseId}/detail`} aria-current={detail ? "page" : undefined}>รายละเอียด</Link></nav>}{!detail && !date && <><div className="filter-bar"><div className="segmented" aria-label="ช่วงเวลา">{[7, 30, 90].map(n => <button key={n} aria-pressed={period === n} onClick={() => setPeriod(n)}>{n} วัน</button>)}</div><Link className="command" href="/patient/progress/calendar"><CalendarDays size={18} />ปฏิทิน</Link></div><section className="summary-band"><div><strong>{filtered.length}</strong><p>เซตที่บันทึก</p></div><div><strong>{filtered.reduce((sum, s) => sum + s.reps, 0)}</strong><p>จำนวนครั้งรวม</p></div><div><strong>{dates.length}</strong><p>วันที่มีผลฝึก</p></div></section>{dates.length > 0 && <figure aria-label="จำนวนเซตที่บันทึกแยกตามวัน"><div className="trend-chart">{dates.map(d => { const count = filtered.filter(s => s.local_date === d).length; return <div className="trend-column" key={d}><strong>{count} เซต</strong><span style={{ height: `${count / Math.max(...dates.map(day => filtered.filter(s => s.local_date === day).length)) * 100}px` }} /><small>{dateLabel(d)}</small></div>; })}</div></figure>}</>}
    {!exerciseId && !date && <><div className="section-heading"><h2>แยกตามท่าฝึก</h2></div><div className="exercise-grid">{exercises.map(e => <article className="exercise-item" key={e.id}><span className="tag">หมวด {e.module}</span><h2>{e.name}</h2><p>{filtered.filter(s => s.exercise_id === e.id).length} เซตที่บันทึก</p><div className="action-row"><Link className="command" href={`/patient/progress/${e.id}`}>ดูความก้าวหน้า <ArrowRight size={18} /></Link></div></article>)}</div></>}
    <div className="section-heading"><h2>ประวัติเซตที่บันทึก</h2>{exerciseId && !detail && <Link className="command" href={`/patient/progress/${exerciseId}/detail`}>รายละเอียด</Link>}</div><SavedSetTable exerciseId={exerciseId} date={date} /></>;
}
export function ProgressCalendar() {
  const { sets } = useDemo();
  const [month, setMonth] = useState("2026-10");
  const first = new Date(`${month}-01T00:00:00Z`);
  const days = new Date(first.getUTCFullYear(), first.getUTCMonth() + 1, 0).getDate();
  return <><PageHeading title="ปฏิทินการฝึก" back="/patient/progress" /><div className="filter-bar"><label>เดือน<input type="month" value={month} onChange={e => { if (e.target.value) setMonth(e.target.value); }} /></label></div><div className="calendar-grid">{["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."].map(d => <span key={d}>{d}</span>)}{Array.from({ length: first.getUTCDay() }, (_, i) => <span key={`blank-${i}`} />)}{Array.from({ length: days }, (_, i) => { const date = `${month}-${String(i + 1).padStart(2, "0")}`; const count = sets.filter(s => s.patient_id === "1" && s.local_date === date).length; return <Link key={date} className={count ? "has-results" : ""} href={`/patient/progress/calendar/${date}`} aria-label={`${dateLabel(date)} ${count} เซต`}>{i + 1}<small>{count ? `${count} เซต` : ""}</small></Link>; })}</div></>;
}
export function ProfileView({ profile }: { profile: PatientProfile }) {
  return <><PageHeading title="ข้อมูลของคุณ"><Link className="command" href="/patient/profile/edit"><UserRound size={18} />แก้ไขข้อมูล</Link></PageHeading><div className="split-view"><section><h2>ข้อมูลส่วนตัว</h2><ProfileDetails profile={profile} /></section><section><h2>ข้อมูลสุขภาพ</h2><dl className="data-list"><div><dt>ประเภทโรค</dt><dd>{strokeLabel[profile.stroke_type]}</dd></div><div><dt>วันที่วินิจฉัย</dt><dd>{dateLabel(profile.stroke_diagnosed_on)}</dd></div><div><dt>โรคประจำตัวอื่น</dt><dd>{profile.other_conditions || "ไม่ระบุ"}</dd></div><div><dt>แพทย์ประจำตัว</dt><dd>{profile.primary_doctor_name || "ไม่ระบุ"}</dd></div></dl><Link className="command" href="/patient/change-password"><KeyRound size={18} />เปลี่ยนรหัสผ่าน</Link></section></div><DisplaySettings /></>;
}
export function ProfileDetails({ profile }: { profile: PatientProfile }) { return <dl className="data-list"><div><dt>ชื่อ - นามสกุล</dt><dd>{profile.full_name}</dd></div><div><dt>HN</dt><dd>{profile.hn || "ไม่ระบุ"}</dd></div><div><dt>วันเกิด</dt><dd>{profile.date_of_birth ? dateLabel(profile.date_of_birth) : "ไม่ระบุ"}</dd></div><div><dt>อายุ</dt><dd>{ageOn(profile.date_of_birth, dateInThailand())}</dd></div><div><dt>เพศ</dt><dd>{sexLabel[profile.sex]}</dd></div><div><dt>โทรศัพท์</dt><dd>{profile.phone || "ไม่ระบุ"}</dd></div></dl>; }
export function ProfileEdit({ initialProfile }: { initialProfile: PatientProfile }) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile); const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false); const [error, setError] = useState("");
  async function save(event: FormEvent) {
    event.preventDefault(); if (pending) return; setPending(true); setSaved(false); setError("");
    try {
      const { full_name, date_of_birth, sex, phone, primary_doctor_name, other_conditions } = profile;
      await accountRequest("/api/patient/profile", { full_name, date_of_birth, sex, phone, primary_doctor_name, other_conditions }, "PATCH");
      setSaved(true); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "กรุณาลองใหม่"); }
    finally { setPending(false); }
  }
  return <><PageHeading title="แก้ไขข้อมูลส่วนตัว" back="/patient/profile" /><form className="form-stack" onSubmit={save}><label>ชื่อ - นามสกุล<input required maxLength={200} value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} /></label><label>วันเกิด<input required type="date" max={dateInThailand()} value={profile.date_of_birth} onChange={e => setProfile({ ...profile, date_of_birth: e.target.value })} /></label><label>เพศ<select value={profile.sex} onChange={e => setProfile({ ...profile, sex: e.target.value })}>{Object.entries(sexLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>โทรศัพท์<input type="tel" maxLength={20} value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} /></label><label>แพทย์ประจำตัว<input maxLength={150} value={profile.primary_doctor_name} onChange={e => setProfile({ ...profile, primary_doctor_name: e.target.value })} /></label><label>โรคประจำตัวอื่น<textarea maxLength={10000} value={profile.other_conditions} onChange={e => setProfile({ ...profile, other_conditions: e.target.value })} /></label>{error && <p role="alert" className="error-text">{error}</p>}<div className="action-row"><button className="command primary" disabled={pending}><Save size={18} />{pending ? "กำลังบันทึก…" : "บันทึกข้อมูล"}</button><Link className="command" href="/patient/profile">ยกเลิก</Link></div>{saved && <p className="notice" role="status">บันทึกข้อมูลเรียบร้อยแล้ว</p>}</form></>;
}
export function PasswordForm() {
  const router = useRouter();
  const [error, setError] = useState(""); const [success, setSuccess] = useState(false); const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return;
    const form = event.currentTarget; const data = new FormData(form);
    setError(""); setSuccess(false); setPending(true);
    try {
      await accountRequest("/api/auth/password", { current: data.get("current"), new: data.get("new"), confirm: data.get("confirm") });
      setSuccess(true); form.reset(); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "กรุณาลองใหม่"); }
    finally { setPending(false); }
  }
  return <><PageHeading title="เปลี่ยนรหัสผ่าน" back="/patient/profile" /><form className="form-stack" onSubmit={submit}><label>รหัสผ่านปัจจุบัน<input name="current" type="password" required maxLength={128} autoComplete="current-password" /></label><label>รหัสผ่านใหม่<input name="new" type="password" required minLength={8} maxLength={128} autoComplete="new-password" /></label><label>ยืนยันรหัสผ่านใหม่<input name="confirm" type="password" required minLength={8} maxLength={128} autoComplete="new-password" /></label>{error && <p role="alert" className="error-text">{error}</p>}<div className="action-row"><button className="command primary" disabled={pending}><KeyRound size={18} />{pending ? "กำลังบันทึก…" : "บันทึกรหัสผ่าน"}</button></div>{success && <p className="notice" role="status">เปลี่ยนรหัสผ่านเรียบร้อยแล้ว</p>}</form></>;
}
