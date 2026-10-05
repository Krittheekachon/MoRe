import type { Metadata } from "next";
import { PatientRegister } from "@/components/auth/patient-register";
import "../login.css";

export const metadata: Metadata = {
  title: "ลงทะเบียนผู้ป่วยใหม่ | MoRe",
};

export default function RegisterPage() {
  return <PatientRegister />;
}
