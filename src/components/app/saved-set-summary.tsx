import styles from "./saved-set-summary.module.css";
export const savedSetDialogClass = styles.dialog;
import Link from "next/link";
import { Check } from "lucide-react";
import type { SavedSet } from "@/lib/pose/types";

export function SavedSetSummary({ summary, targetReps, targetSets, onContinue, onProgress }: {
  summary: SavedSet | null; targetReps: number; targetSets: number; onContinue: () => void; onProgress?: () => Promise<void>;
}) {
  const complete = summary?.setCompleted === true;
  const dayComplete = summary?.dayCompleted === true;
  const plannedSets = summary?.targetSets ?? targetSets;
  const plannedReps = summary?.targetReps ?? targetReps;
  return <div className={styles.summary}>
    <div className={styles.success} aria-hidden="true"><Check size={28} strokeWidth={2.5} /></div>
    <h2 id="saved-set-title">{dayComplete ? "ทำครบแผนวันนี้แล้ว" : complete ? "ทำครบเซตแล้ว" : "บันทึกผลแล้ว"}</h2>
    {!complete && summary && <p className={styles.note}>ทำได้ {summary.reps} จาก {plannedReps} ครั้ง สามารถกลับมาทำต่อได้</p>}
    <p className={styles.setNumber}>เซตที่ {summary?.setNumber ?? "—"} จาก {plannedSets}</p>
    <div className={styles.stats}>
      <div><span>จำนวนครั้งที่ทำ</span><strong>{summary?.reps ?? "—"} / {plannedReps}</strong></div>
      <div><span>ครั้งที่ทำถูก</span><strong>{summary?.correctReps ?? "—"}</strong></div>
    </div>
    <div className={styles.actions}>
      {dayComplete ? <Link autoFocus className="command primary" href="/patient">กลับหน้าหลัก</Link>
        : complete && summary?.exerciseCompleted ? <Link autoFocus className="command primary" href="/patient/exercises">ดูแผนวันนี้</Link>
        : <button type="button" autoFocus className="command primary" onClick={onContinue}>{complete ? "เริ่มเซตถัดไป" : "ทำต่อเซตนี้"}</button>}
      <Link className={`command ${styles.progress}`} prefetch={false} href="/patient/progress" onClick={event => {
        // Reload server data after an API save; don't reuse a previously visited RSC result.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        if (onProgress) { void onProgress(); return; }
        window.location.href = new URL("/patient/progress", window.location.origin).href;
      }}>ดูความก้าวหน้า</Link>
    </div>
  </div>;
}
