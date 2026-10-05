import type { Metadata } from "next";
import { PatientLogin } from "@/components/auth/patient-login";
import "./login.css";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบคนไข้ | MoRe",
};

export default function Home() {
  return <PatientLogin />;
}
