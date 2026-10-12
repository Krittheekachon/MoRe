"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Activity,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
} from "lucide-react";
import type { staffPatientData } from "@/lib/doctor-service";

type PatientData = Awaited<ReturnType<typeof staffPatientData>>;

function formatThaiDateFullYear(dateStr: string | null): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (!Number.isFinite(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    calendar: "buddhist",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function formatHourMinute(date: Date): string {
  if (!Number.isFinite(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok",
  })
    .format(date)
    .replace(":", ".");
}

const EXERCISE_META: Record<
  string,
  { moduleNum: number; moduleName: string; displayName: string; subtitle: string }
> = {
  "ankle-pump": {
    moduleNum: 1,
    moduleName: "Module 1",
    displayName: "Ankle Pump (ข้างซ้าย)",
    subtitle: "กระดกข้อเท้าซ้ายขึ้น-ลง",
  },
  "seated-leg-raise": {
    moduleNum: 2,
    moduleName: "Module 2",
    displayName: "Seated Leg Raise (ซ้าย)",
    subtitle: "ยกเหยียดขาตรงขณะนั่ง ข้างซ้าย",
  },
  "sit-to-stand": {
    moduleNum: 2,
    moduleName: "Module 2",
    displayName: "Sit To Stand",
    subtitle: "ลุกยืนจากเก้าอี้และนั่งลงอย่างช้าๆ",
  },
  "seated-trunk": {
    moduleNum: 1,
    moduleName: "Module 1",
    displayName: "Seated Trunk Rotation",
    subtitle: "บริหารลำตัวขณะนั่ง",
  },
  bridging: {
    moduleNum: 2,
    moduleName: "Module 2",
    displayName: "Bridging",
    subtitle: "ยกสะโพก",
  },
  "demo-knee-extension": {
    moduleNum: 2,
    moduleName: "Module 2",
    displayName: "Knee Extension (DEMO)",
    subtitle: "นั่งเหยียดขา",
  },
};

export function DoctorPatientSessionDetailView({
  data,
  sessionId,
}: {
  data: PatientData;
  sessionId: number;
}) {
  const { profile, sessions } = data;
  const [expandedRepDetails, setExpandedRepDetails] = useState<Record<string, boolean>>({});

  const toggleRepDetails = (exerciseCode: string, setNumber: number) => {
    const key = `${exerciseCode}-set-${setNumber}`;
    setExpandedRepDetails((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Find target session and group all sessions of this round
  const { roundNumber, roundDate, roundSessions, totalRoundDurationMinutes } = useMemo(() => {
    // Group all sessions by date to calculate round numbers
    const dateMap = new Map<string, typeof sessions>();
    for (const s of sessions) {
      const list = dateMap.get(s.date) || [];
      list.push(s);
      dateMap.set(s.date, list);
    }

    const sortedDatesAsc = Array.from(dateMap.keys()).sort();

    // Identify which session was requested
    const targetSession = sessions.find((s) => s.id === sessionId) || sessions[0];
    const targetDate = targetSession?.date || sortedDatesAsc[0] || "2026-09-07";

    const rNum = sortedDatesAsc.indexOf(targetDate) + 1 || 1;
    const rSessions = dateMap.get(targetDate) || [];

    // Calculate total duration across all sessions in this round
    let totalSec = 0;
    for (const s of rSessions) {
      for (const set of s.sets) {
        totalSec += set.elapsed || 300;
      }
    }
    const totalMin = Math.max(1, Math.round(totalSec / 60));

    return {
      roundNumber: rNum,
      roundDate: targetDate,
      roundSessions: rSessions,
      totalRoundDurationMinutes: totalMin,
    };
  }, [sessions, sessionId]);

  // Group round sessions by Module
  const modulesList = useMemo(() => {
    const moduleMap = new Map<number, typeof roundSessions>();

    for (const s of roundSessions) {
      const meta = EXERCISE_META[s.code] || {
        moduleNum: 1,
        moduleName: "Module 1",
        displayName: s.exercise,
        subtitle: s.exercise,
      };
      const list = moduleMap.get(meta.moduleNum) || [];
      list.push(s);
      moduleMap.set(meta.moduleNum, list);
    }

    // Sort modules ascending (Module 1, Module 2...)
    return Array.from(moduleMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([modNum, sList]) => ({
        moduleNum: modNum,
        moduleName: `Module ${modNum}`,
        sessions: sList,
      }));
  }, [roundSessions]);

  const dateThai = formatThaiDateFullYear(roundDate);

  return (
    <div className="patient-session-detail-container">
      {/* Top back button */}
      <nav className="patient-detail-header-nav" aria-label="การนำทางผู้ป่วย">
        <Link
          href={`/doctor/patients/${profile.patient_id}/assessments`}
          className="btn-nav-outline"
          id="back-to-assessments-btn"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          <span>สรุปผลการทำกายภาพ</span>
        </Link>
      </nav>

      {/* Breadcrumb */}
      <div className="patient-detail-breadcrumb" aria-label="Breadcrumb">
        <Link href="/doctor">รายชื่อผู้ป่วย</Link>
        <span className="separator">/</span>
        <Link href={`/doctor/patients/${profile.patient_id}`}>{profile.full_name}</Link>
        <span className="separator">/</span>
        <Link href={`/doctor/patients/${profile.patient_id}/assessments`}>สรุปการทำกายภาพ</Link>
        <span className="separator">/</span>
        <strong className="current-crumb">กายภาพครั้งที่ {roundNumber}</strong>
      </div>

      {/* Round Overview Header Banner */}
      <header className="session-round-banner-card" aria-label="ข้อมูลรอบกายภาพ">
        <h1 className="session-banner-title">กายภาพครั้งที่ {roundNumber}</h1>
        <div className="session-banner-meta">
          <span className="banner-meta-date">{dateThai}</span>
          <span className="banner-meta-divider">·</span>
          <span className="banner-meta-duration">เวลาใช้งานรวม {totalRoundDurationMinutes} นาที</span>
        </div>
      </header>

      {/* Modules and Exercises */}
      <div className="session-modules-container">
        {modulesList.map((mod) => (
          <section className="session-module-section" key={mod.moduleNum} aria-label={mod.moduleName}>
            <h2 className="session-module-heading">{mod.moduleName}</h2>

            <div className="session-exercise-cards-list">
              {mod.sessions.map((sess, sessIdx) => {
                const meta = EXERCISE_META[sess.code] || {
                  moduleNum: mod.moduleNum,
                  moduleName: mod.moduleName,
                  displayName: sess.exercise,
                  subtitle: sess.exercise,
                };

                // Calculate exercise level stats
                let exActualReps = 0;
                let exTargetReps = 0;
                let exCorrectReps = 0;
                let exDurationSec = 0;

                for (const set of sess.sets) {
                  exTargetReps += set.target;
                  exActualReps += set.repetitions.length;
                  exDurationSec += set.elapsed || 300;
                  for (const rep of set.repetitions) {
                    if (rep.correct) exCorrectReps++;
                  }
                }

                const exAccuracy =
                  exActualReps > 0 ? Math.round((exCorrectReps / exActualReps) * 100) : 0;
                const exDurationMin = Math.max(1, Math.round(exDurationSec / 60));

                let accuracyColor = "green";
                if (exAccuracy < 50) accuracyColor = "red";
                else if (exAccuracy < 70) accuracyColor = "orange";

                const sessionStartDate = sess.startedAt
                  ? new Date(sess.startedAt)
                  : new Date(`${roundDate}T10:00:00+07:00`);

                return (
                  <article
                    className="session-exercise-detail-card"
                    key={sess.id}
                    id={`exercise-detail-${sess.code}`}
                  >
                    {/* Exercise Card Top Header */}
                    <div className="exercise-detail-top">
                      <div className="exercise-detail-left">
                        <div className="exercise-icon-avatar" aria-hidden="true">
                          <Activity size={32} strokeWidth={1.75} />
                        </div>

                        <div className="exercise-info-block">
                          <h3 className="exercise-detail-name">{meta.displayName}</h3>
                          <p className="exercise-detail-sub">{meta.subtitle}</p>

                          <div className="exercise-pills-row">
                            <span className="ex-pill">
                              เวลาที่ใช้: <strong>{exDurationMin} นาที</strong>
                            </span>
                            <span className="ex-pill">
                              จำนวนครั้ง: <strong>{sess.sets.length} เซต x {sess.sets[0]?.target || 10} ครั้ง</strong>
                            </span>
                            <span className="ex-pill">
                              ครั้งที่ทำได้จริง: <strong>{exActualReps}/{exTargetReps} ครั้ง</strong>
                            </span>
                            <span className="ex-pill highlight-correct">
                              ทำถูกต้อง: <strong>{exCorrectReps}/{exActualReps} ครั้ง</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Accuracy Block */}
                      <div className="exercise-detail-accuracy-box">
                        <div className="accuracy-box-header">
                          <span className="acc-lbl">ทำถูกต้องสะสม</span>
                          <strong className="acc-val">
                            {exCorrectReps} <span className="acc-denom">/ {exActualReps} ครั้ง</span>
                          </strong>
                        </div>

                        <div
                          className="progress-track"
                          role="progressbar"
                          aria-valuenow={exAccuracy}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className={`progress-fill ${accuracyColor}`}
                            style={{ width: `${Math.min(100, Math.max(0, exAccuracy))}%` }}
                          />
                        </div>

                        <div className="accuracy-box-rate">
                          อัตราความถูกต้อง: {exAccuracy}%
                        </div>
                      </div>
                    </div>

                    {/* Per-Set Table */}
                    <div className="exercise-sets-table-wrap">
                      <table className="session-sets-table" aria-label={`รายละเอียดเซต ${meta.displayName}`}>
                        <thead>
                          <tr>
                            <th scope="col">เซต</th>
                            <th scope="col">ครั้งที่ทำได้</th>
                            <th scope="col">องศาเฉลี่ย</th>
                            <th scope="col">องศาสูงสุด</th>
                            <th scope="col">ช่วงเวลา</th>
                            <th scope="col">เวลาที่ใช้</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sess.sets.map((set, setIdx) => {
                            const setCorrect = set.repetitions.filter((r) => r.correct).length;
                            const setActual = set.repetitions.length;

                            // Calculate peak angles
                            const allPeaks = set.repetitions
                              .flatMap((r) => r.metrics)
                              .map((m) => m.peak)
                              .filter((v) => Number.isFinite(v));

                            const avgPeak = allPeaks.length
                              ? (allPeaks.reduce((a, b) => a + b, 0) / allPeaks.length).toFixed(2)
                              : "-";
                            const maxPeak = allPeaks.length
                              ? Math.max(...allPeaks).toFixed(0)
                              : "-";

                            // Calculate time window for this set
                            const cumulativeElapsedBefore = sess.sets
                              .slice(0, setIdx)
                              .reduce((sum, s) => sum + (s.elapsed || 300), 0);
                            const setElapsed = set.elapsed || 300;

                            const setStart = new Date(
                              sessionStartDate.getTime() + cumulativeElapsedBefore * 1000
                            );
                            const setEnd = new Date(setStart.getTime() + setElapsed * 1000);
                            const timeWindowStr = `${formatHourMinute(setStart)} - ${formatHourMinute(setEnd)}`;
                            const durationMinStr = `${Math.max(1, Math.round(setElapsed / 60))} นาที`;

                            const repDetailKey = `${sess.code}-set-${set.number}`;
                            const isExpanded = !!expandedRepDetails[repDetailKey];

                            return (
                              <tr key={set.id} className="set-row">
                                <td className="set-col-name">
                                  <strong>Set {set.number}</strong>
                                </td>
                                <td className="set-col-reps">
                                  <span className="reps-display">
                                    <strong>{setActual}</strong> / {set.target} ครั้ง
                                  </span>
                                  {setActual > 0 && (
                                    <span className="reps-correct-tag">
                                      (ถูก {setCorrect})
                                    </span>
                                  )}
                                </td>
                                <td className="set-col-avg">
                                  <strong>{avgPeak !== "-" ? `${avgPeak}°` : "-"}</strong>
                                </td>
                                <td className="set-col-max">
                                  <strong>{maxPeak !== "-" ? `${maxPeak}°` : "-"}</strong>
                                </td>
                                <td className="set-col-window">{timeWindowStr}</td>
                                <td className="set-col-duration">{durationMinStr}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
