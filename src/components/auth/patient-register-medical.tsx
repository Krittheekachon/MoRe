"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, ChevronDown, X } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { FormField } from "@/components/ui/form-field";
import { RegisterIntro } from "@/components/auth/register-intro";
import { useDemo } from "@/components/app/demo-provider";

type MedicalField = "strokeType" | "strokeDiagnosedOn";
type Notice = { title: string; message: string };

const strokeTypeOptions = [
  { value: "", label: "เลือกประเภทโรคหลอดเลือดสมอง" },
  { value: "ischemic", label: "โรคหลอดเลือดสมองตีบหรืออุดตัน" },
  { value: "hemorrhagic", label: "โรคหลอดเลือดสมองแตก" },
  { value: "tia", label: "ภาวะสมองขาดเลือดชั่วคราว" },
  { value: "unspecified", label: "ไม่ทราบ / ไม่ระบุ" },
];

function validateMedical(field: MedicalField, value: string) {
  if (field === "strokeType" && !value) return "กรุณาเลือกประเภทโรคหลอดเลือดสมอง";
  if (field === "strokeDiagnosedOn" && !value) return "กรุณาเลือกวันที่เป็นโรคหลอดเลือดสมอง";
}

export function PatientRegisterMedical() {
  const { draft, setDraft } = useDemo();
  const [otherConditions, setOtherConditions] = useState(draft.other_conditions || "");
  const [values, setValues] = useState<Record<MedicalField, string>>({
    strokeType: draft.stroke_type || "",
    strokeDiagnosedOn: draft.stroke_diagnosed_on || "",
  });
  const [errors, setErrors] = useState<Partial<Record<MedicalField, string>>>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const strokeTypeRef = useRef<HTMLSelectElement>(null);
  const diagnosedRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  function updateField(field: MedicalField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: validateMedical(field, value) }));
    }
  }

  function submitMedical(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = {
      strokeType: validateMedical("strokeType", values.strokeType),
      strokeDiagnosedOn: validateMedical("strokeDiagnosedOn", values.strokeDiagnosedOn),
    };
    setErrors(nextErrors);
    if (nextErrors.strokeType) return strokeTypeRef.current?.focus();
    if (nextErrors.strokeDiagnosedOn) return diagnosedRef.current?.focus();
    setDraft(current => ({ ...current, other_conditions: otherConditions, stroke_type: values.strokeType, stroke_diagnosed_on: values.strokeDiagnosedOn }));

    setNotice({
      title: "ตรวจข้อมูลการลงทะเบียนสำเร็จ",
      message: "กรุณาตรวจทานข้อมูลก่อนยืนยันสร้างบัญชี ข้อมูลจะถูกบันทึกเมื่อคุณกดยืนยันในหน้าถัดไป",
    });
    dialogRef.current?.showModal();
  }

  return (
    <main className="login-page register-page register-flow-page">
      <section className="login-content register-content" aria-labelledby="register-medical-heading">
        <Link className="back-link text-back-link" href="/register/personal" aria-label="กลับสู่ข้อมูลพื้นฐาน">
          <ArrowLeft size={18} aria-hidden="true" />
          <span>กลับสู่ข้อมูลพื้นฐาน</span>
        </Link>
        <RegisterIntro step={3} headingId="register-medical-heading" />

        <form className="login-form register-form flow-form" onSubmit={submitMedical} noValidate>
          <h2 className="form-section-heading">ข้อมูลสุขภาพ</h2>
          <FormField
            id="other-conditions"
            name="other-conditions"
            label="โรคประจำตัวอื่นๆ"
            placeholder="ไม่มีโรคประจำตัวอื่นๆ"
            value={otherConditions}
            onChange={(event) => setOtherConditions(event.target.value)}
          />
          <div className="form-field">
            <label htmlFor="stroke-type">ประเภทโรคหลอดเลือดสมอง</label>
            <div className="input-shell select-shell" data-invalid={Boolean(errors.strokeType)}>
              <select
                id="stroke-type"
                name="stroke-type"
                ref={strokeTypeRef}
                required
                value={values.strokeType}
                aria-invalid={Boolean(errors.strokeType)}
                aria-describedby={errors.strokeType ? "stroke-type-error" : undefined}
                onChange={(event) => updateField("strokeType", event.target.value)}
                onBlur={() => setErrors((current) => ({ ...current, strokeType: validateMedical("strokeType", values.strokeType) }))}
              >
                {strokeTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="field-icon" size={18} aria-hidden="true" />
            </div>
            {errors.strokeType && (
              <p id="stroke-type-error" className="field-error" role="alert">
                {errors.strokeType}
              </p>
            )}
          </div>
          <FormField
            id="stroke-diagnosed-on"
            name="stroke-diagnosed-on"
            label="วันที่เป็นโรคหลอดเลือดสมอง"
            placeholder="วัน / เดือน / ปี"
            type="date"
            required
            ref={diagnosedRef}
            value={values.strokeDiagnosedOn}
            error={errors.strokeDiagnosedOn}
            onChange={(event) => updateField("strokeDiagnosedOn", event.target.value)}
            onBlur={() => setErrors((current) => ({ ...current, strokeDiagnosedOn: validateMedical("strokeDiagnosedOn", values.strokeDiagnosedOn) }))}
          />
          <div className="register-note flow-note">
            <strong>หมายเหตุ</strong>
            <span>ข้อมูลนี้ช่วยให้ทีมกายภาพเข้าใจบริบทของผู้ป่วย และวางแผนการฝึกได้เหมาะสมยิ่งขึ้น</span>
          </div>
          <button className="auth-button primary register-next flow-next" type="submit">
            ยืนยันการลงทะเบียน
          </button>
        </form>
      </section>

      <dialog ref={dialogRef} className="auth-dialog" aria-labelledby="medical-notice-title" aria-describedby="medical-notice-message" onClose={() => setNotice(null)}>
        {notice && (
          <>
            <button className="dialog-close" type="button" aria-label="ปิดข้อความ" title="ปิดข้อความ" onClick={() => dialogRef.current?.close()}>
              <X size={20} />
            </button>
            <CheckCircle2 className="notice-icon" size={36} aria-hidden="true" />
            <h2 id="medical-notice-title">{notice.title}</h2>
            <p id="medical-notice-message">{notice.message}</p>
            <Link className="auth-button primary" href="/register/review">ตรวจทานข้อมูล</Link>
            <button className="auth-button primary" type="button" onClick={() => dialogRef.current?.close()}>
              กลับไปตรวจข้อมูล
            </button>
          </>
        )}
      </dialog>
    </main>
  );
}
