"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { accountRequest } from "@/lib/account-client";
import { CheckCircle2, Eye, EyeOff, Info, X } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { FormField } from "@/components/ui/form-field";
import { DisplaySettings } from "@/components/app/display-settings";

type Field = "nationalId" | "password";
type Notice = { title: string; message: string; success?: boolean };

function validate(field: Field, value: string): string | undefined {
  if (field === "nationalId") {
    if (!value.trim()) return "กรุณากรอกรหัสบัตรประชาชน";
    if (!/^[0-9]{13}$/.test(value.replace(/[\s-]/g, ""))) {
      return "กรุณากรอกเลขบัตรประชาชนเป็นตัวเลข 13 หลัก";
    }
  } else if (!value.trim()) {
    return "กรุณากรอกรหัสผ่าน";
  }
}

export function PatientLogin() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [nationalId, setNationalId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const nationalIdRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  function openNotice(next: Notice) {
    setNotice(next);
    dialogRef.current?.showModal();
  }

  function updateField(field: Field, value: string) {
    if (field === "nationalId") setNationalId(value);
    else setPassword(value);
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: validate(field, value) }));
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = {
      nationalId: validate("nationalId", nationalId),
      password: validate("password", password),
    };
    setErrors(nextErrors);
    if (nextErrors.nationalId) {
      nationalIdRef.current?.focus();
      return;
    }
    if (nextErrors.password) {
      passwordRef.current?.focus();
      return;
    }

    if (pending) return;
    setPending(true);
    try {
      const result = await accountRequest("/api/auth/login", { nationalId, password });
      setPassword("");
      router.replace(result.destination);
      router.refresh();
    } catch (error) {
      openNotice({ title: "เข้าสู่ระบบไม่สำเร็จ", message: error instanceof Error ? error.message : "กรุณาลองใหม่" });
    } finally { setPending(false); }
  }

  function unavailable(title: string) {
    openNotice({
      title,
      message: "หน้านี้ยังไม่พร้อมใช้งาน กรุณากลับไปที่หน้าเข้าสู่ระบบ",
    });
  }

  return (
    <main className="login-page">
      <div className="auth-display-toolbar"><DisplaySettings /></div>
      <section className="login-content" aria-labelledby="login-heading">
        <Image
          className="login-mark"
          src="/more-mark.png"
          alt="MoRe"
          width={62}
          height={62}
          priority
        />
        <header className="login-heading">
          <h1 id="login-heading">เข้าสู่ระบบ</h1>
          <p>เข้าสู่ระบบเพื่อเริ่มการฟื้นฟูของคุณ</p>
        </header>

        <div className="login-panel">
        {/* Chrome iOS Autofill adds DOM-only IDs before hydration. Limit suppression to form/input attributes. */}
        <form className="login-form" onSubmit={submit} noValidate suppressHydrationWarning>
          <FormField
            id="national-id"
            name="national-id"
            label="รหัสบัตรประชาชน"
            placeholder="กรอกรหัสบัตรประชาชน"
            inputMode="numeric"
            autoComplete="username"
            suppressHydrationWarning
            spellCheck={false}
            required
            ref={nationalIdRef}
            value={nationalId}
            error={errors.nationalId}
            onChange={(event) => updateField("nationalId", event.target.value)}
            onBlur={() => setErrors((current) => ({ ...current, nationalId: validate("nationalId", nationalId) }))}
          />
          <FormField
            id="password"
            name="password"
            label="รหัสผ่าน"
            placeholder="กรอกรหัสผ่าน"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            suppressHydrationWarning
            required
            ref={passwordRef}
            value={password}
            error={errors.password}
            onChange={(event) => updateField("password", event.target.value)}
            onBlur={() => setErrors((current) => ({ ...current, password: validate("password", password) }))}
            trailing={
              <button
                className="password-toggle"
                type="button"
                title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                aria-pressed={showPassword}
                aria-controls="password"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            }
          />
          <button className="forgot-password text-action" type="button" onClick={() => unavailable("ลืมรหัสผ่าน?")}>
            ลืมรหัสผ่าน?
          </button>
          <button className="auth-button primary" type="submit" disabled={pending}>{pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}</button>
        </form>

        <div className="login-registration">
          <Link className="auth-button secondary" href="/register">
            ลงทะเบียนผู้ป่วยใหม่
          </Link>
          <p>ยังไม่เคยเข้าใช้งาน?</p>
        </div>
        </div>
      </section>

      <footer className="login-footer">
        <button className="text-action" type="button" onClick={() => unavailable("ระบบฟื้นฟูผู้ป่วยทางการแพทย์")}>
          ระบบฟื้นฟูผู้ป่วยทางการแพทย์
        </button>
      </footer>

      <dialog ref={dialogRef} className="auth-dialog" aria-labelledby="notice-title" aria-describedby="notice-message" onClose={() => setNotice(null)}>
        {notice && (
          <>
            <button className="dialog-close" type="button" aria-label="ปิดข้อความ" title="ปิดข้อความ" onClick={() => dialogRef.current?.close()}>
              <X size={20} />
            </button>
            {notice.success ? <CheckCircle2 className="notice-icon" size={36} aria-hidden="true" /> : <Info className="notice-icon" size={36} aria-hidden="true" />}
            <h2 id="notice-title">{notice.title}</h2>
            <p id="notice-message">{notice.message}</p>
            {notice.title !== "เข้าสู่ระบบไม่สำเร็จ" && <Link className="auth-button secondary mb-4" href={notice.title === "ลืมรหัสผ่าน?" ? "/forgot-password" : "/doctor/login"}>ไปยังหน้า</Link>}
            <button className="auth-button primary" type="button" onClick={() => dialogRef.current?.close()}>กลับไปหน้าเข้าสู่ระบบ</button>
          </>
        )}
      </dialog>
    </main>
  );
}
