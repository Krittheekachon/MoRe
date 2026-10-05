"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Info, X } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { FormField } from "@/components/ui/form-field";
import { RegisterIntro } from "@/components/auth/register-intro";
import { accountRequest } from "@/lib/account-client";

type Field = "nationalId" | "password" | "confirmPassword";
type Mode = "identity" | "initialPassword" | "customPassword";
type Notice = { title: string; message: string; success?: boolean };

function normalizeNationalId(value: string) {
  return value.replace(/[\s-]/g, "");
}

function maskNationalId(value: string) {
  const normalized = normalizeNationalId(value);
  if (normalized.length !== 13) return "000-0000-00x-xx-x";
  return `${normalized.slice(0, 3)}-${normalized.slice(3, 7)}-${normalized.slice(7, 9)}x-xx-x`;
}

function initialPassword(value: string) {
  return normalizeNationalId(value).slice(-4);
}

function validateNationalId(value: string) {
  if (!value.trim()) return "กรุณากรอกรหัสบัตรประชาชน";
  if (!/^[0-9]{13}$/.test(normalizeNationalId(value))) {
    return "กรุณากรอกเลขบัตรประชาชนเป็นตัวเลข 13 หลัก";
  }
}

function validateCustom(field: Field, values: Record<Field, string>) {
  if (field === "nationalId") return validateNationalId(values.nationalId);
  if (field === "password") {
    if (!values.password.trim()) return "กรุณากรอกรหัสผ่าน";
    if (values.password.length < 8) return "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
  }
  if (field === "confirmPassword") {
    if (!values.confirmPassword.trim()) return "กรุณายืนยันรหัสผ่าน";
    if (values.confirmPassword !== values.password) return "รหัสผ่านและการยืนยันไม่ตรงกัน";
  }
}

export function PatientRegister() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [mode, setMode] = useState<Mode>("identity");
  const [values, setValues] = useState<Record<Field, string>>({
    nationalId: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const nationalIdRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  function updateField(field: Field, value: string) {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: mode === "customPassword" ? validateCustom(field, nextValues) : validateNationalId(value) }));
    }
  }

  function continueFromIdentity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nationalId = validateNationalId(values.nationalId);
    setErrors({ nationalId });
    if (nationalId) {
      nationalIdRef.current?.focus();
      return;
    }
    setMode("initialPassword");
    setErrors({});
  }

  async function submitCustomPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = {
      nationalId: validateCustom("nationalId", values),
      password: validateCustom("password", values),
      confirmPassword: validateCustom("confirmPassword", values),
    };
    setErrors(nextErrors);
    if (nextErrors.nationalId) return nationalIdRef.current?.focus();
    if (nextErrors.password) return passwordRef.current?.focus();
    if (nextErrors.confirmPassword) return confirmPasswordRef.current?.focus();

    await stageRegistration(false);
  }

  async function stageRegistration(useInitial: boolean) {
    if (pending) return;
    setPending(true);
    setRequestError("");
    try {
      await accountRequest("/api/auth/register/start", { nationalId: values.nationalId, password: values.password, useInitial });
      setValues(current => ({ ...current, password: "", confirmPassword: "" }));
      setShowPassword(false);
      setShowConfirmPassword(false);
      router.push("/register/personal");
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "กรุณาลองใหม่");
    } finally { setPending(false); }
  }

  function useInitialPassword() {
    void stageRegistration(true);
  }

  return (
    <main className="login-page register-page">
      <section className="login-content register-content" aria-labelledby="register-heading">
        <Link className="back-link text-back-link" href="/" aria-label="กลับไปหน้าเข้าสู่ระบบ" title="กลับไปหน้าเข้าสู่ระบบ">
          <ArrowLeft size={18} aria-hidden="true" />
          <span>กลับไปหน้าเข้าสู่ระบบ</span>
        </Link>
        <RegisterIntro step={1} headingId="register-heading" />

        {requestError && <p role="alert" className="error-text">{requestError}</p>}
        {pending && <p role="status">กำลังตรวจสอบข้อมูล…</p>}
        {mode === "identity" && (
          <form className="login-form register-form" onSubmit={continueFromIdentity} noValidate suppressHydrationWarning>
            <h2 className="form-section-heading">ข้อมูลบัญชีผู้ใช้</h2>
            <FormField
              id="register-national-id"
              name="national-id"
              label="รหัสบัตรประชาชน"
              placeholder="กรอกรหัสบัตรประชาชน"
              inputMode="numeric"
              autoComplete="username"
              suppressHydrationWarning
              spellCheck={false}
              required
              ref={nationalIdRef}
              value={values.nationalId}
              error={errors.nationalId}
              onChange={(event) => updateField("nationalId", event.target.value)}
              onBlur={() => setErrors((current) => ({ ...current, nationalId: validateNationalId(values.nationalId) }))}
            />
            <p className="register-field-help">ใช้ยืนยันตัวตนกับทะเบียนผู้ป่วยของสถานพยาบาล</p>
            <button className="auth-button primary register-next" type="submit" disabled={pending}>
              ถัดไป <ArrowRight size={24} aria-hidden="true" />
            </button>
          </form>
        )}

        {mode === "initialPassword" && (
          <div className="register-initial" aria-live="polite">
            <h2 className="form-section-heading">รหัสผ่านเริ่มต้น</h2>
            <div className="form-field">
              <label htmlFor="masked-national-id">รหัสบัตรประชาชน</label>
              <div className="input-shell">
                <input id="masked-national-id" value={maskNationalId(values.nationalId)} readOnly aria-readonly="true" />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="initial-password">รหัสผ่านเริ่มต้นของคุณ</label>
              <div className="input-shell initial-password-shell">
                <input id="initial-password" value={initialPassword(values.nationalId)} readOnly aria-readonly="true" />
              </div>
            </div>
            <div className="register-note">
              <strong>หมายเหตุ!</strong>
              <span>รหัสผ่านเริ่มต้นคือรหัส 4 ตัวท้ายของบัตรประชาชน</span>
            </div>
            <div className="register-actions">
              <button className="auth-button outline" type="button" onClick={() => setMode("customPassword")}>
                เปลี่ยนรหัสผ่าน
              </button>
              <button className="auth-button primary" type="button" disabled={pending} onClick={useInitialPassword}>
                ใช้รหัสผ่านเริ่มต้น
              </button>
            </div>
          </div>
        )}

        {mode === "customPassword" && (
          <form className="login-form register-form custom-password-form" onSubmit={submitCustomPassword} noValidate suppressHydrationWarning>
            <h2 className="form-section-heading">ตั้งรหัสผ่านใหม่</h2>
            <FormField
              id="custom-national-id"
              name="national-id"
              label="รหัสบัตรประชาชน"
              placeholder="กรอกรหัสบัตรประชาชน"
              inputMode="numeric"
              autoComplete="username"
              suppressHydrationWarning
              spellCheck={false}
              required
              ref={nationalIdRef}
              value={values.nationalId}
              error={errors.nationalId}
              onChange={(event) => updateField("nationalId", event.target.value)}
              onBlur={() => setErrors((current) => ({ ...current, nationalId: validateCustom("nationalId", values) }))}
            />
            <FormField
              id="new-password"
              name="new-password"
              label="รหัสผ่าน"
              placeholder="กรอกรหัสผ่าน"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              suppressHydrationWarning
              required
              ref={passwordRef}
              value={values.password}
              error={errors.password}
              onChange={(event) => updateField("password", event.target.value)}
              onBlur={() => setErrors((current) => ({ ...current, password: validateCustom("password", values) }))}
              trailing={
                <button
                  className="password-toggle"
                  type="button"
                  title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  aria-pressed={showPassword}
                  aria-controls="new-password"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />
            <FormField
              id="confirm-password"
              name="confirm-password"
              label="ยืนยันรหัสผ่าน"
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              suppressHydrationWarning
              required
              ref={confirmPasswordRef}
              value={values.confirmPassword}
              error={errors.confirmPassword}
              onChange={(event) => updateField("confirmPassword", event.target.value)}
              onBlur={() => setErrors((current) => ({ ...current, confirmPassword: validateCustom("confirmPassword", values) }))}
              trailing={
                <button
                  className="password-toggle"
                  type="button"
                  title={showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  aria-label={showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  aria-pressed={showConfirmPassword}
                  aria-controls="confirm-password"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />
            <button className="auth-button primary register-next" type="submit" disabled={pending}>
              ขั้นตอนถัดไป
            </button>
          </form>
        )}
      </section>

      <dialog ref={dialogRef} className="auth-dialog" aria-labelledby="register-notice-title" aria-describedby="register-notice-message" onClose={() => setNotice(null)}>
        {notice && (
          <>
            <button className="dialog-close" type="button" aria-label="ปิดข้อความ" title="ปิดข้อความ" onClick={() => dialogRef.current?.close()}>
              <X size={20} />
            </button>
            {notice.success ? <CheckCircle2 className="notice-icon" size={36} aria-hidden="true" /> : <Info className="notice-icon" size={36} aria-hidden="true" />}
            <h2 id="register-notice-title">{notice.title}</h2>
            <p id="register-notice-message">{notice.message}</p>
            <button className="auth-button primary" type="button" onClick={() => dialogRef.current?.close()}>กลับไปลงทะเบียน</button>
          </>
        )}
      </dialog>
    </main>
  );
}
