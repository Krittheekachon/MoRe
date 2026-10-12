"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, User } from "lucide-react";
import type { staffPatientData } from "@/lib/doctor-service";
import { calculateAge } from "@/lib/birth-date";

type PatientData = Awaited<ReturnType<typeof staffPatientData>>;

function formatThaiDateShortYear(dateStr: string | null): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (!Number.isFinite(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    calendar: "buddhist",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function formatThaiDateFull(dateStr: string | null): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (!Number.isFinite(date.getTime())) return "-";
  const formatted = new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    calendar: "buddhist",
    timeZone: "Asia/Bangkok",
  }).format(date);
  return formatted.includes("พ.ศ.") ? formatted : formatted.replace(/(\d{4})$/, "พ.ศ. $1");
}

export function DoctorPatientProfileView({ data }: { data: PatientData }) {
  const { profile, sessions } = data;

  // Calculate session metrics
  const sessionDates = Array.from(new Set(sessions.map((s) => s.date))).sort();
  const totalSessions = sessionDates.length;
  const startDate = sessionDates[0] || null;
  const latestDate = sessionDates[sessionDates.length - 1] || null;

  // Parse extra fields from medical_notes JSON if present
  let nickname = "-";
  let height = "-";
  let weight = "-";
  let bloodGroup = "-";

  if (profile.medical_notes) {
    try {
      const parsed = JSON.parse(profile.medical_notes);
      if (parsed && typeof parsed === "object") {
        if (parsed.nickname) nickname = parsed.nickname;
        if (parsed.height_cm) height = `${parsed.height_cm} เซนติเมตร`;
        if (parsed.weight_kg) weight = `${parsed.weight_kg} กิโลกรัม`;
        if (parsed.blood_group) bloodGroup = parsed.blood_group;
      }
    } catch {
      // medical_notes is plain text
    }
  }

  // Sex label
  const sexLabel = profile.sex
    ? profile.sex.toLowerCase() === "male" || profile.sex === "ชาย"
      ? "ชาย"
      : profile.sex.toLowerCase() === "female" || profile.sex === "หญิง"
      ? "หญิง"
      : profile.sex
    : "-";

  // Derived age
  const age = profile.date_of_birth ? calculateAge(profile.date_of_birth) : null;
  const ageText = age !== null ? `${age} ปี` : "-";

  // Conditions list
  const conditions = profile.other_conditions
    ? profile.other_conditions
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="patient-personal-info-container">
      {/* Top action buttons */}
      <nav className="patient-detail-header-nav" aria-label="การนำทางผู้ป่วย">
        <Link href="/doctor" className="btn-nav-outline" id="back-to-patients-btn">
          <ArrowLeft size={18} aria-hidden="true" />
          <span>รายชื่อผู้ป่วย</span>
        </Link>
        <Link
          href={`/doctor/patients/${profile.patient_id}/assessments`}
          className="btn-nav-outline"
          id="go-to-assessment-btn"
        >
          <span>สรุปการทำกายภาพ</span>
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </nav>

      {/* Breadcrumb */}
      <div className="patient-detail-breadcrumb" aria-label="Breadcrumb">
        <Link href="/doctor">รายชื่อผู้ป่วย</Link>
        <span className="separator">/</span>
        <span>{profile.full_name}</span>
        <span className="separator">/</span>
        <strong className="current-crumb">ข้อมูลผู้ป่วย</strong>
      </div>

      {/* 3 KPI Summary Cards */}
      <section className="patient-kpi-grid" aria-label="สรุปภาพรวมการทำกายภาพ">
        <article className="patient-kpi-card" id="kpi-total-sessions">
          <h2 className="kpi-card-title">ทำกายภาพรวมทั้งหมด</h2>
          <div className="kpi-card-value-wrap">
            <span className="kpi-card-value">{totalSessions}</span>
            <span className="kpi-card-unit">ครั้ง</span>
          </div>
        </article>

        <article className="patient-kpi-card" id="kpi-start-date">
          <h2 className="kpi-card-title">วันที่เริ่มทำ</h2>
          <div className="kpi-card-value-wrap">
            <span className="kpi-card-value">{formatThaiDateShortYear(startDate)}</span>
          </div>
        </article>

        <article className="patient-kpi-card" id="kpi-latest-date">
          <h2 className="kpi-card-title">วันที่ทำล่าสุด</h2>
          <div className="kpi-card-value-wrap">
            <span className="kpi-card-value">{formatThaiDateShortYear(latestDate)}</span>
          </div>
        </article>
      </section>

      {/* Section Heading */}
      <h1 className="patient-detail-section-title">ข้อมูลผู้ป่วย</h1>

      {/* Main Profile Card */}
      <section className="patient-profile-card" aria-label="รายละเอียดผู้ป่วย">
        {/* Left Column: Personal identity & stats */}
        <div className="profile-left-col">
          <div className="profile-user-summary">
            <div className="profile-avatar" aria-hidden="true">
              <User size={44} strokeWidth={1.5} />
            </div>
            <div className="profile-user-info">
              <h2 className="profile-user-name">{profile.full_name}</h2>
              <div className="profile-user-hn">{profile.hn || "-"}</div>
              <p className="profile-user-sub">
                ชื่อเล่น: {nickname} • อายุ: {ageText}
              </p>
              <p className="profile-user-sub">
                ว/ด/ป เกิด: {formatThaiDateFull(profile.date_of_birth)}
              </p>
            </div>
          </div>

          <div className="profile-stats-bar">
            <div className="stat-col">
              <span className="stat-label">เพศ</span>
              <strong className="stat-val">{sexLabel}</strong>
            </div>
            <div className="stat-col">
              <span className="stat-label">ส่วนสูง</span>
              <strong className="stat-val">{height}</strong>
            </div>
            <div className="stat-col">
              <span className="stat-label">น้ำหนัก</span>
              <strong className="stat-val">{weight}</strong>
            </div>
            <div className="stat-col">
              <span className="stat-label">กรุ๊ปเลือด</span>
              <strong className="stat-val">{bloodGroup}</strong>
            </div>
          </div>
        </div>

        {/* Right Column: Clinical details */}
        <div className="profile-right-col">
          <div className="profile-field-group">
            <h3 className="profile-field-label">ประเภทอาการหลอดเลือดสมอง (Stroke Classification)</h3>
            <div className="profile-pill-box">
              {profile.stroke_type || "-"}
            </div>
          </div>

          <div className="profile-field-group">
            <h3 className="profile-field-label">วันที่ตรวจพบ (Diagnosis Date)</h3>
            <div className="profile-pill-box">
              {formatThaiDateFull(profile.stroke_diagnosed_on)}
            </div>
          </div>

          <div className="profile-field-group">
            <h3 className="profile-field-label">โรคประจำตัว (Underlying Medical Conditions)</h3>
            <div className="profile-pill-list">
              {conditions.length > 0 ? (
                conditions.map((cond, idx) => (
                  <div className="profile-pill-box" key={idx}>
                    {cond}
                  </div>
                ))
              ) : (
                <div className="profile-pill-box">-</div>
              )}
            </div>
          </div>

          <div className="profile-field-group">
            <h3 className="profile-field-label">เบอร์ติดต่อ</h3>
            <div className="profile-pill-box">
              {profile.phone || "-"}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
