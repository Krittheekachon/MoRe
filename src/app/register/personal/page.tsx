import type { Metadata } from "next";
import { PatientRegisterProfile } from "@/components/auth/patient-register-profile";
import "../../login.css";

export const metadata: Metadata = {
  title: "ข้อมูลพื้นฐานผู้ป่วย | MoRe",
};

export default function RegisterPersonalPage() {
  return <PatientRegisterProfile />;
}
