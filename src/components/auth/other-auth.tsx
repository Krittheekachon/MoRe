"use client";

import { MoreLogo } from "@/components/ui/more-logo";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function OtherAuth({ recovery = false }: { recovery?: boolean }) {
  const [status, setStatus] = useState(""); const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    if (recovery) { setStatus("ยังไม่เปิดบริการกู้คืนบัญชี กรุณาติดต่อทีมรักษาเพื่อยืนยันตัวตน"); return; }
    const form = new FormData(event.currentTarget); setBusy(true); setStatus("");
    try {
      const response = await fetch("/api/auth/doctor/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ loginName: form.get("login-name"), password: form.get("password") }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "เข้าสู่ระบบไม่ได้");
      router.push(data.destination); router.refresh();
    } catch (error) { setStatus(error instanceof Error ? error.message : "เชื่อมต่อไม่ได้ กรุณาลองใหม่"); }
    finally { setBusy(false); }
  }
  return <div className="system-app"><main className="review-page"><Link className="back-command" href="/"><ArrowLeft size={18} />กลับหน้าเข้าสู่ระบบ</Link><MoreLogo /><h1>{recovery ? "กู้คืนรหัสผ่าน" : "เข้าสู่ระบบบุคลากร"}</h1>{recovery && <p className="notice">ติดต่อทีมรักษาเพื่อกู้คืนบัญชี</p>}<form className="form-stack" onSubmit={submit}>{!recovery && <><label>ชื่อเข้าสู่ระบบ<input name="login-name" autoComplete="username" maxLength={30} required /></label><label>รหัสผ่าน<input name="password" type="password" autoComplete="current-password" required /></label></>}<div className="action-row"><button className="command primary" disabled={busy}>{busy ? "กำลังเข้าสู่ระบบ" : recovery ? "ตรวจสอบช่องทางกู้คืน" : "เข้าสู่ระบบ"}<ArrowRight size={18} /></button></div>{status && <p role="alert" className="notice">{status}</p>}</form></main></div>;
}
