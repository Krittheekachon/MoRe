"use client";

import { MoreLogo } from "@/components/ui/more-logo";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useDemo } from "@/components/app/demo-provider";
import { sexLabel, strokeLabel, dateLabel } from "@/lib/demo-data";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { accountRequest } from "@/lib/account-client";

export function RegisterSummary({ done = false }: { done?: boolean }) {
  const { draft, setDraft } = useDemo();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function complete() {
    if (pending) return;
    setPending(true); setError("");
    try {
      await accountRequest("/api/auth/register", { full_name: draft.full_name, date_of_birth: draft.date_of_birth, sex: draft.sex, stroke_type: draft.stroke_type, stroke_diagnosed_on: draft.stroke_diagnosed_on, other_conditions: draft.other_conditions });
      setDraft({}); router.replace("/");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "กรุณาลองใหม่"); }
    finally { setPending(false); }
  }
  return <div className="system-app"><main className="review-page"><MoreLogo /><h1>{done ? "ลงทะเบียนสำเร็จ" : "ตรวจทานข้อมูล"}</h1>{done ? <><CheckCircle2 size={40} className="mt-6" /><p className="notice">สร้างบัญชีเรียบร้อยแล้ว กรุณาเข้าสู่ระบบเพื่อใช้งาน</p><div className="action-row"><Link className="command primary" href="/">เข้าสู่ระบบ <ArrowRight size={18} /></Link></div></> : <><dl className="data-list"><div><dt>ชื่อ - นามสกุล</dt><dd>{draft.full_name || "ยังไม่ได้กรอก"}</dd></div><div><dt>วันเกิด</dt><dd>{draft.date_of_birth ? dateLabel(draft.date_of_birth) : "ยังไม่ได้กรอก"}</dd></div><div><dt>เพศ</dt><dd>{sexLabel[draft.sex || ""] || "ยังไม่ได้กรอก"}</dd></div><div><dt>ประเภทโรค</dt><dd>{strokeLabel[draft.stroke_type || ""] || "ยังไม่ได้กรอก"}</dd></div><div><dt>วันที่วินิจฉัย</dt><dd>{draft.stroke_diagnosed_on ? dateLabel(draft.stroke_diagnosed_on) : "ยังไม่ได้กรอก"}</dd></div><div><dt>โรคประจำตัวอื่น</dt><dd>{draft.other_conditions || "ไม่ระบุ"}</dd></div></dl>{error && <p role="alert" className="error-text">{error}</p>}<div className="action-row"><Link className="command" href="/register/personal">แก้ไขข้อมูลส่วนตัว</Link><Link className="command" href="/register/medical">แก้ไขข้อมูลสุขภาพ</Link><button className="command primary" disabled={pending} onClick={complete}>{pending ? "กำลังบันทึก…" : "ยืนยันข้อมูล"} <ArrowRight size={18} /></button></div></>}</main></div>;
}
