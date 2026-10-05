"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { FormField } from "@/components/ui/form-field";
import { RegisterIntro } from "@/components/auth/register-intro";
import { useDemo } from "@/components/app/demo-provider";
import { calculateAge, normalizeBirthDate } from "@/lib/birth-date";

type ProfileField = "fullName" | "dateOfBirth" | "sex";

const sexOptions = [
  { value: "", label: "เลือกเพศ" },
  { value: "female", label: "หญิง" },
  { value: "male", label: "ชาย" },
  { value: "other", label: "อื่น ๆ" },
  { value: "unspecified", label: "ไม่ระบุ" },
];

function validateProfile(field: ProfileField, value: string) {
  if (field === "fullName" && !value.trim()) return "กรุณากรอกชื่อ - นามสกุล";
  if (field === "dateOfBirth" && !value) return "กรุณาเลือกวันเดือนปีเกิด";
  if (field === "dateOfBirth" && calculateAge(value) === null) return "กรุณาเลือกวันเกิดที่ถูกต้องและไม่อยู่ในอนาคต";
  if (field === "sex" && !value) return "กรุณาเลือกเพศ";
}

export function PatientRegisterProfile() {
  const router = useRouter();
  const { draft, setDraft } = useDemo();
  const [values, setValues] = useState<Record<ProfileField, string>>({
    fullName: draft.full_name || "",
    dateOfBirth: draft.date_of_birth || "",
    sex: draft.sex || "",
  });
  const [errors, setErrors] = useState<Partial<Record<ProfileField, string>>>({});
  const fullNameRef = useRef<HTMLInputElement>(null);
  const dateOfBirthRef = useRef<HTMLInputElement>(null);
  const sexRef = useRef<HTMLSelectElement>(null);
  const age = calculateAge(values.dateOfBirth);

  function updateField(field: ProfileField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: validateProfile(field, value) }));
    }
  }

  function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = {
      fullName: validateProfile("fullName", values.fullName),
      dateOfBirth: validateProfile("dateOfBirth", values.dateOfBirth),
      sex: validateProfile("sex", values.sex),
    };
    setErrors(nextErrors);
    if (nextErrors.fullName) return fullNameRef.current?.focus();
    if (nextErrors.dateOfBirth) return dateOfBirthRef.current?.focus();
    if (nextErrors.sex) return sexRef.current?.focus();
    const dateOfBirth = normalizeBirthDate(values.dateOfBirth)!;
    setDraft(current => ({ ...current, full_name: values.fullName, date_of_birth: dateOfBirth, sex: values.sex }));
    router.push("/register/medical");
  }

  return (
    <main className="login-page register-page register-flow-page">
      <section className="login-content register-content" aria-labelledby="register-profile-heading">
        <Link className="back-link text-back-link" href="/register" aria-label="กลับสู่ข้อมูลบัญชีผู้ใช้">
          <ArrowLeft size={18} aria-hidden="true" />
          <span>กลับสู่ข้อมูลบัญชีผู้ใช้</span>
        </Link>
        <RegisterIntro step={2} headingId="register-profile-heading" />

        <form className="login-form register-form flow-form profile-form" onSubmit={submitProfile} noValidate>
          <h2 className="form-section-heading">ข้อมูลส่วนตัว</h2>
          <FormField
            id="profile-full-name"
            name="full-name"
            label="ชื่อ - นามสกุล"
            placeholder="เช่น นายสมชาย ใจดี"
            autoComplete="name"
            required
            ref={fullNameRef}
            value={values.fullName}
            error={errors.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
            onBlur={() => setErrors((current) => ({ ...current, fullName: validateProfile("fullName", values.fullName) }))}
          />
          <FormField
            id="profile-date-of-birth"
            name="date-of-birth"
            label="วันเดือนปีเกิด"
            placeholder="วัน / เดือน / ปี"
            type="date"
            autoComplete="bday"
            required
            ref={dateOfBirthRef}
            value={values.dateOfBirth}
            error={errors.dateOfBirth}
            onChange={(event) => updateField("dateOfBirth", event.target.value)}
            onBlur={() => setErrors((current) => ({ ...current, dateOfBirth: validateProfile("dateOfBirth", values.dateOfBirth) }))}
          />
          <FormField
            id="profile-age"
            name="age"
            label="อายุ"
            placeholder="ระบบคำนวณอัตโนมัติ"
            value={age === null ? "" : `${age} ปี`}
            readOnly
            aria-readonly="true"
          />
          <div className="form-field">
            <label htmlFor="profile-sex">เพศ</label>
            <div className="input-shell select-shell" data-invalid={Boolean(errors.sex)}>
              <select
                id="profile-sex"
                name="sex"
                ref={sexRef}
                required
                value={values.sex}
                aria-invalid={Boolean(errors.sex)}
                aria-describedby={errors.sex ? "profile-sex-error" : undefined}
                onChange={(event) => updateField("sex", event.target.value)}
                onBlur={() => setErrors((current) => ({ ...current, sex: validateProfile("sex", values.sex) }))}
              >
                {sexOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="field-icon" size={18} aria-hidden="true" />
            </div>
            {errors.sex && (
              <p id="profile-sex-error" className="field-error" role="alert">
                {errors.sex}
              </p>
            )}
          </div>
          <button className="auth-button primary register-next flow-next" type="submit">
            ขั้นตอนถัดไป <ArrowRight size={24} aria-hidden="true" />
          </button>
        </form>
      </section>
    </main>
  );
}
