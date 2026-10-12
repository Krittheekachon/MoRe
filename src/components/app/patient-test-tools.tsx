"use client";
import { useEffect, useRef, useState } from "react";
type State = { patientName: string; hn: string; date: string; simulated: boolean };
export function PatientTestTools({ initial }: { initial: State }) {
  const [date, setDate] = useState(initial.date); const [scope, setScope] = useState("day");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const gate = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const node = dialog.current; return () => node?.close(); }, []);
  async function run(action: "date" | "real" | "clear", chosen = date) {
    if (gate.current) return; gate.current = true; setBusy(true); setError("");
    try {
      window.dispatchEvent(new Event("more-test-tools-pause"));
      const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("more-training-test-tools");
      channel?.postMessage("pause"); channel?.close();
      const response = await fetch("/api/patient/test-tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...(action === "date" ? { date: chosen } : action === "clear" ? { date: initial.date, scope, confirmation: "CLEAR_MY_TRAINING" } : {}) }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      const changed = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("more-training-test-tools"); changed?.postMessage("changed"); changed?.close();
      // Full navigation discards all client caches and draft/camera state.
      window.location.href = new URL("/patient?testTools=1", window.location.origin).href;
    } catch (e) { setError(e instanceof Error ? e.message : "ดำเนินการไม่สำเร็จ"); gate.current = false; setBusy(false); }
  }
  return <section className="panel patient-test-tools" aria-labelledby="test-tools-title">
    <h2 id="test-tools-title">เครื่องมือทดสอบ</h2>
    <p>{initial.patientName}{initial.hn && ` · HN ${initial.hn}`} · วันที่ {initial.date} (Asia/Bangkok)</p>
    <p>เปลี่ยนวันหรือลบผลจะพักการฝึก ผลที่ยังไม่บันทึกจะไม่ถูกย้ายไปวันใหม่</p>
    <label>วันที่ทดสอบ<input type="date" min="2000-01-01" max="2100-12-31" value={date} onChange={e => setDate(e.target.value)} disabled={busy} /></label>
    <div className="action-row">
      <button type="button" className="command" disabled={busy || !date} onClick={() => run("date")}>ใช้วันที่นี้</button>
      <button type="button" className="command" disabled={busy} onClick={() => { const next = new Date(`${initial.date}T00:00:00Z`); next.setUTCDate(next.getUTCDate() + 1); run("date", next.toISOString().slice(0, 10)); }}>วันถัดไป</button>
      <button type="button" className="command" disabled={busy} onClick={() => run("real")}>กลับวันที่จริง / ปิดโหมดทดสอบ</button>
    </div>
    <label>ขอบเขตการลบ<select value={scope} onChange={e => setScope(e.target.value)} disabled={busy}><option value="day">เฉพาะวันที่ {initial.date}</option><option value="all">ผลฝึกทั้งหมดของคนไข้รายนี้</option></select></label>
    <button type="button" className="command" disabled={busy} onClick={() => dialog.current?.showModal()}>เคลียร์ข้อมูลการฝึก</button>
    {error && <p role="alert">{error}</p>}
    <dialog ref={dialog} className="app-dialog" aria-labelledby="test-clear-title"><h2 id="test-clear-title">ยืนยันเคลียร์ผลฝึก</h2><p>{initial.patientName}{initial.hn && ` · HN ${initial.hn}`}</p><p>{scope === "all" ? "ลบผลฝึกทุกวันที่ของคนไข้รายนี้" : `ลบเฉพาะผลฝึกวันที่ ${initial.date}`}</p><p>คงบัญชี ข้อมูลส่วนตัว และแผนฝึก การลบนี้ย้อนกลับไม่ได้</p><div className="action-row"><button type="button" autoFocus className="command" onClick={() => dialog.current?.close()}>ยกเลิก</button><button type="button" className="command primary" disabled={busy} onClick={() => { dialog.current?.close(); run("clear"); }}>ยืนยันลบ</button></div></dialog>
  </section>;
}
