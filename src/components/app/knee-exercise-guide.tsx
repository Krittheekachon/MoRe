import Link from "next/link";
import { ArrowLeft, ArrowRight, Video } from "lucide-react";
import { PageHeading } from "./shell";

export function KneeExerciseGuide({ name, cameraHref, canStart, targetSets, targetReps }: { name: string; cameraHref: string; canStart: boolean; targetSets: number; targetReps: number }) {
  return <article className="exercise-guide-page">
    <PageHeading title={name} />
    <KneeExerciseInstructions targetSets={targetSets} targetReps={targetReps} />
    <div className="action-row guide-actions"><Link className="command" href="/patient/exercises"><ArrowLeft size={18} aria-hidden="true" />กลับ</Link>{canStart ? <Link className="command primary" href={cameraHref}>เริ่มฝึก <ArrowRight size={18} aria-hidden="true" /></Link> : <p className="notice">รายการนี้ไม่สามารถเริ่มฝึกได้</p>}</div>
  </article>;
}
export function KneeExerciseInstructions({ targetSets, targetReps }: { targetSets: number; targetReps: number }) {
  return <>
    <section aria-labelledby="guide-video-title">
      <h2 id="guide-video-title">วิดีโอสาธิต</h2>
      <div className="guide-placeholder"><Video size={40} aria-hidden="true" /><p>ยังไม่มีวิดีโอสาธิตจากทีมกายภาพ</p></div>
    </section>
    <section aria-labelledby="guide-steps-title">
      <h2 id="guide-steps-title">วิธีทำ</h2>
      <ol className="guide-steps">
        <li><span>นั่งบนเก้าอี้ที่มั่นคง หลังตรง วางเท้าบนพื้น</span></li>
        <li><span><strong>หันด้านข้างให้กล้อง</strong> ให้เห็นไหล่ สะโพก เข่า และข้อเท้าของขาที่ฝึกครบ</span></li>
        <li><span>ค่อย ๆ เหยียดเข่าข้างที่ฝึก ยกเท้าขึ้น โดยไม่ลุกจากเก้าอี้หรือโยกลำตัว</span></li>
        <li><span>ค่อย ๆ ลดเท้ากลับสู่ท่าเริ่มต้น ถือเป็น 1 ครั้ง</span></li>
        <li><span>ทำตามแผนของคุณ: {targetSets} เซต เซตละ {targetReps} ครั้ง</span></li>
      </ol>
    </section>
    <section className="notice" aria-labelledby="guide-caution-title"><h2 id="guide-caution-title">ข้อควรระวัง</h2><p>หากเจ็บ เวียนศีรษะ หรือมีอาการผิดปกติ ให้หยุดฝึก</p></section>
  </>;
}
