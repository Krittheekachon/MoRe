import Image from "next/image";

const steps = ["ยืนยันตัวตน", "ข้อมูลส่วนตัว", "ข้อมูลสุขภาพ"];

export function RegisterIntro({ step, headingId }: { step: 1 | 2 | 3; headingId: string }) {
  return (
    <header className="register-intro">
      <div className="register-brand">
        <Image className="login-mark register-mark" src="/more-mark.png" alt="MoRe" width={62} height={62} priority />
        <h1 id={headingId} aria-label="ลงทะเบียนผู้ป่วยใหม่"><span>ลงทะเบียน</span><span>ผู้ป่วยใหม่</span></h1>
      </div>
      <div className="register-current-step" aria-hidden="true">
        <span>{step}. {steps[step - 1]}</span>
        <span>ขั้นตอนที่ {step} จาก 3</span>
      </div>
      <ol className="register-progress" aria-label="ขั้นตอนการลงทะเบียน">
        {steps.map((label, index) => (
          <li key={label} aria-current={step === index + 1 ? "step" : undefined}>
            <span className="step-number" aria-hidden="true">{index + 1}</span>
            <span>{label}</span>
          </li>
        ))}
      </ol>
    </header>
  );
}
