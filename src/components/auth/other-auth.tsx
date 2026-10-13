"use client";

import { MoreLogo } from "@/components/ui/more-logo";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import { DisplaySettings } from "@/components/app/display-settings";
import "@/app/login.css";

export function OtherAuth({ recovery = false }: { recovery?: boolean }) {
  const [status, setStatus] = useState("");
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (recovery) {
      setStatus("ยังไม่เปิดบริการกู้คืนบัญชีอัตโนมัติ กรุณาติดต่อทีมรักษาเพื่อยืนยันตัวตน");
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/auth/doctor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginName, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "เข้าสู่ระบบไม่ได้");
      router.push(data.destination);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "เชื่อมต่อไม่ได้ กรุณาลองใหม่");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <div className="auth-display-toolbar">
        <DisplaySettings />
      </div>

      <section className="login-content" aria-labelledby="other-auth-heading">
        <Link className="auth-back-link" href="/">
          <ArrowLeft size={18} />
          <span>กลับหน้าเข้าสู่ระบบคนไข้</span>
        </Link>

        <MoreLogo size="hero" className="login-mark" />

        <header className="login-heading">
          <h1 id="other-auth-heading">
            {recovery ? "กู้คืนรหัสผ่าน" : "เข้าสู่ระบบบุคลากร"}
          </h1>
          <p>
            {recovery
              ? "ติดต่อทีมรักษาเพื่อยืนยันตัวตนและกู้คืนบัญชี"
              : "สำหรับแพทย์ นักกายภาพบำบัด และเจ้าหน้าที่"}
          </p>
        </header>

        <div className="login-panel">
          <form className="login-form" onSubmit={submit} noValidate>
            {!recovery ? (
              <>
                <FormField
                  id="doctor-login-name"
                  name="login-name"
                  label="ชื่อเข้าสู่ระบบ"
                  placeholder="กรอกชื่อเข้าสู่ระบบ (เช่น more-demo-doctor)"
                  autoComplete="username"
                  maxLength={30}
                  required
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                />

                <FormField
                  id="doctor-password"
                  name="password"
                  label="รหัสผ่าน"
                  placeholder="กรอกรหัสผ่าน"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  trailing={
                    <button
                      className="password-toggle"
                      type="button"
                      title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                      aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                      aria-pressed={showPassword}
                      aria-controls="doctor-password"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  }
                />
              </>
            ) : (
              <p className="notice" style={{ margin: 0, textAlign: "center" }}>
                กรุณาติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่านบัญชีบุคลากร
              </p>
            )}

            {status && (
              <div role="alert" className="auth-alert-box">
                {status}
              </div>
            )}

            <button
              className="auth-button primary"
              type="submit"
              disabled={busy}
              style={{ marginTop: "24px" }}
            >
              <span>
                {busy
                  ? "กำลังเข้าสู่ระบบ…"
                  : recovery
                  ? "ตรวจสอบช่องทางกู้คืน"
                  : "เข้าสู่ระบบบุคลากร"}
              </span>
              <ArrowRight size={18} style={{ marginLeft: "8px" }} />
            </button>
          </form>
        </div>
      </section>

      <footer className="login-footer">
        <p style={{ fontSize: "0.875rem", color: "var(--auth-muted)", margin: 0 }}>
          ระบบฟื้นฟูผู้ป่วยโรคหลอดเลือดสมอง MoRe
        </p>
      </footer>
    </main>
  );
}
