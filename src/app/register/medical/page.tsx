import type { Metadata } from "next";
import { PatientRegisterMedical } from "@/components/auth/patient-register-medical";
import "../../login.css";

export const metadata: Metadata = {
  title: "ข้อมูลสุขภาพผู้ป่วย | MoRe",
};

export default function RegisterMedicalPage() {
  return <PatientRegisterMedical />;
}
