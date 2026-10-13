"use client";

import Link from "next/link";
import { useState, useMemo, useRef } from "react";
import { ArrowLeft, ArrowRight, User, Calendar, ChevronDown, RotateCcw, ClipboardList } from "lucide-react";
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
    year: "numeric",
    calendar: "buddhist",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function formatThaiDateFull(dateStr: string | null): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (!Number.isFinite(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    calendar: "buddhist",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function formatTimeRange(startedAtStr: string, endedAtStr?: string, durationMinutes = 60): { timeText: string; totalText: string } {
  const start = new Date(startedAtStr);
  if (!Number.isFinite(start.getTime())) return { timeText: "-", totalText: "-" };

  const startFormatted = new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok",
  }).format(start);

  const end = endedAtStr ? new Date(endedAtStr) : new Date(start.getTime() + durationMinutes * 60 * 1000);
  const endFormatted = new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok",
  }).format(end);

  const durationMin = Math.round((end.getTime() - start.getTime()) / (60 * 1000));
  return {
    timeText: `เวลา ${startFormatted} น. ถึง ${endFormatted} น.`,
    totalText: `รวมเวลา: ${durationMin} นาที`,
  };
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

export function DoctorPatientAssessmentHistoryView({ data }: { data: PatientData }) {
  const { profile, sessions, plan } = data;
  const planName = plan?.name ? plan.name.replace(/^DEMO\s+/, "") : null;

  // Patient basic info
  const age = profile.date_of_birth ? calculateAge(profile.date_of_birth) : null;
  const sexLabel = profile.sex
    ? profile.sex.toLowerCase() === "male" || profile.sex === "ชาย"
      ? "เพศชาย"
      : profile.sex.toLowerCase() === "female" || profile.sex === "หญิง"
      ? "เพศหญิง"
      : profile.sex
    : "-";

  // Group sessions by date into physical therapy rounds
  const rounds = useMemo(() => {
    const map = new Map<string, typeof sessions>();
    for (const s of sessions) {
      const list = map.get(s.date) || [];
      list.push(s);
      map.set(s.date, list);
    }

    // Sort dates ascending to calculate sequential round numbers (1, 2, 3...)
    const sortedDatesAsc = Array.from(map.keys()).sort();
    const roundList: Array<{
      roundNumber: number;
      date: string;
      sessions: typeof sessions;
      representativeSessionId: number;
      startedAt: string;
      durationMinutes: number;
      targetReps: number;
      actualReps: number;
      correctReps: number;
      accuracy: number;
    }> = [];

    sortedDatesAsc.forEach((dateStr, index) => {
      const daySessions = map.get(dateStr)!;
      // Calculate representative session ID and start/duration
      const firstSession = daySessions[0];
      const startedAt = firstSession?.startedAt || `${dateStr}T10:00:00+07:00`;
      // Standard durations: session 1=60m, session 2=120m, session 3=90m
      const dur = index === 0 ? 60 : index === 1 ? 120 : index === 2 ? 90 : 45;

      let roundTargetReps = 0;
      let roundActualReps = 0;
      let roundCorrectReps = 0;

      for (const s of daySessions) {
        for (const set of s.sets) {
          roundTargetReps += set.target;
          roundActualReps += set.repetitions.length;
          for (const rep of set.repetitions) {
            if (rep.correct) roundCorrectReps++;
          }
        }
      }

      const roundAccuracy =
        roundActualReps > 0 ? Math.round((roundCorrectReps / roundActualReps) * 100) : 0;

      roundList.push({
        roundNumber: index + 1,
        date: dateStr,
        sessions: daySessions,
        representativeSessionId: firstSession?.id || 1,
        startedAt,
        durationMinutes: dur,
        targetReps: roundTargetReps,
        actualReps: roundActualReps,
        correctReps: roundCorrectReps,
        accuracy: roundAccuracy,
      });
    });

    // Return descending for display (newest first)
    return roundList.reverse();
  }, [sessions]);

  // Date boundaries
  const allDates = rounds.map((r) => r.date).sort();
  const defaultStartDate = allDates[0] || "2026-09-07";
  const defaultEndDate = allDates[allDates.length - 1] || "2026-09-14";

  const [startDateFilter, setStartDateFilter] = useState(defaultStartDate);
  const [endDateFilter, setEndDateFilter] = useState(defaultEndDate);
  const [selectedModule, setSelectedModule] = useState<string>("all");

  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);

  // Filter rounds by date
  const filteredRounds = useMemo(() => {
    return rounds.filter((r) => {
      if (startDateFilter && r.date < startDateFilter) return false;
      if (endDateFilter && r.date > endDateFilter) return false;
      if (selectedModule !== "all") {
        const modNum = Number(selectedModule);
        const hasModule = r.sessions.some((s) => {
          const meta = EXERCISE_META[s.code];
          return meta && meta.moduleNum === modNum;
        });
        if (!hasModule) return false;
      }
      return true;
    });
  }, [rounds, startDateFilter, endDateFilter, selectedModule]);

  // Calculate exercise accuracy progress for filtered period
  const exerciseProgressList = useMemo(() => {
    // Collect all sessions in filtered rounds
    let filteredSessions = filteredRounds.flatMap((r) => r.sessions);
    if (selectedModule !== "all") {
      const modNum = Number(selectedModule);
      filteredSessions = filteredSessions.filter((s) => {
        const meta = EXERCISE_META[s.code];
        return meta && meta.moduleNum === modNum;
      });
    }

    const statsMap = new Map<
      string,
      {
        code: string;
        name: string;
        targetReps: number;
        actualReps: number;
        correctReps: number;
      }
    >();

    for (const s of filteredSessions) {
      const code = s.code;
      const current = statsMap.get(code) || {
        code,
        name: s.exercise,
        targetReps: 0,
        actualReps: 0,
        correctReps: 0,
      };

      for (const set of s.sets) {
        current.targetReps += set.target;
        current.actualReps += set.repetitions.length;
        for (const rep of set.repetitions) {
          if (rep.correct) current.correctReps++;
        }
      }
      statsMap.set(code, current);
    }

    const EXERCISE_SORT_ORDER = ["ankle-pump", "seated-leg-raise", "sit-to-stand"];
    return Array.from(statsMap.values())
      .sort((a, b) => {
        const ia = EXERCISE_SORT_ORDER.indexOf(a.code);
        const ib = EXERCISE_SORT_ORDER.indexOf(b.code);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.code.localeCompare(b.code);
      })
      .map((item) => {
        const meta = EXERCISE_META[item.code] || {
          moduleNum: 1,
          moduleName: "Module 1",
          displayName: item.name,
          subtitle: item.name,
        };
        const accuracy =
          item.actualReps > 0 ? Math.round((item.correctReps / item.actualReps) * 100) : 0;

        let color = "green";
        if (accuracy < 50) color = "red";
        else if (accuracy < 70) color = "orange";

        return {
          ...item,
          meta,
          accuracy,
          color,
        };
      });
  }, [filteredRounds, selectedModule]);

  return (
    <div className="patient-assessment-history-container">
      {/* Top back button */}
      <nav className="patient-detail-header-nav" aria-label="การนำทางผู้ป่วย">
        <Link
          href={`/doctor/patients/${profile.patient_id}`}
          className="btn-nav-outline"
          id="back-to-personal-info-btn"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          <span>ข้อมูลผู้ป่วย</span>
        </Link>
      </nav>

      {/* Breadcrumb */}
      <div className="patient-detail-breadcrumb" aria-label="Breadcrumb">
        <Link href="/doctor">รายชื่อผู้ป่วย</Link>
        <span className="separator">/</span>
        <Link href={`/doctor/patients/${profile.patient_id}`}>{profile.full_name}</Link>
        <span className="separator">/</span>
        <strong className="current-crumb">สรุปการทำกายภาพ</strong>
      </div>

      {/* Patient Overview Banner */}
      <header className="patient-banner-card" aria-label="ข้อมูลผู้ป่วยโดยย่อ">
        <div className="patient-banner-avatar" aria-hidden="true">
          <User size={38} strokeWidth={1.5} />
        </div>
        <div className="patient-banner-details">
          <h1 className="patient-banner-title">
            <span className="patient-banner-hn">{profile.hn || "HN-001"}</span> {profile.full_name}
          </h1>
          <p className="patient-banner-sub">
            อายุ {age !== null ? age : 63} ปี · {sexLabel} · {profile.phone || "-"}
          </p>
        </div>
      </header>

      {/* Assessment History Section Heading & Filter */}
      <section className="assessment-history-section" aria-label="ประวัติการประเมิน">
        <div className="assessment-history-header">
          <h2 className="assessment-section-title">ประวัติการประเมิน</h2>
          <p className="assessment-section-sub">แสดงผลการเข้ารับการประเมินย้อนหลัง โดยเรียงจากล่าสุด</p>
        </div>

        {/* Filter toolbar */}
        <div className="assessment-filter-toolbar">
          <div className="filter-group-date">
            <span className="filter-label">เลือกช่วงวันที่:</span>
            <label
              className="date-input-pill-interactive"
              htmlFor="start-date-filter-input"
              onClick={() => {
                try {
                  startDateInputRef.current?.showPicker?.();
                } catch {}
              }}
            >
              <span className="date-display-text">{formatThaiDateFull(startDateFilter)}</span>
              <Calendar size={16} aria-hidden="true" className="date-calendar-icon" />
              <input
                ref={startDateInputRef}
                id="start-date-filter-input"
                type="date"
                value={startDateFilter}
                max={endDateFilter || undefined}
                onChange={(e) => {
                  if (e.target.value) setStartDateFilter(e.target.value);
                }}
                className="interactive-hidden-date-input"
                aria-label="เลือกวันที่เริ่มต้น"
              />
            </label>

            <span className="filter-label">วันที่</span>

            <label
              className="date-input-pill-interactive"
              htmlFor="end-date-filter-input"
              onClick={() => {
                try {
                  endDateInputRef.current?.showPicker?.();
                } catch {}
              }}
            >
              <span className="date-display-text">{formatThaiDateFull(endDateFilter)}</span>
              <Calendar size={16} aria-hidden="true" className="date-calendar-icon" />
              <input
                ref={endDateInputRef}
                id="end-date-filter-input"
                type="date"
                value={endDateFilter}
                min={startDateFilter || undefined}
                onChange={(e) => {
                  if (e.target.value) setEndDateFilter(e.target.value);
                }}
                className="interactive-hidden-date-input"
                aria-label="เลือกวันที่สิ้นสุด"
              />
            </label>

            {(startDateFilter !== defaultStartDate || endDateFilter !== defaultEndDate) && (
              <button
                type="button"
                className="btn-reset-date-filter"
                id="btn-reset-date-filter"
                onClick={() => {
                  setStartDateFilter(defaultStartDate);
                  setEndDateFilter(defaultEndDate);
                }}
              >
                <RotateCcw size={14} aria-hidden="true" />
                <span>รีเซ็ตช่วงวันที่</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Exercises Achieved Summary Card */}
      <section className="achieved-exercises-card" aria-label="ท่ากายภาพที่ทำได้ในช่วงที่กำหนด">
        <div className="achieved-card-header">
          <h2 className="achieved-card-title">ท่ากายภาพที่ทำได้ในช่วงที่กำหนด</h2>
          <div className="filter-group-module">
            <span className="filter-label">เลือกโมดูล:</span>
            <div className="module-select-wrap">
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="module-select"
                id="module-filter-select"
              >
                <option value="all">ทั้งหมด</option>
                <option value="1">Module 1</option>
                <option value="2">Module 2</option>
              </select>
              <ChevronDown size={16} className="select-arrow" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="achieved-grid">
          {exerciseProgressList.map((item) => (
            <article className="exercise-progress-box" key={item.code} id={`exercise-card-${item.code}`}>
              <div className="exercise-progress-top">
                <span className="module-tag-badge">M{item.meta.moduleNum}</span>
                <div className="exercise-title-wrap">
                  <h3 className="exercise-progress-name">{item.meta.displayName}</h3>
                  <p className="exercise-progress-sub">{item.meta.subtitle}</p>
                </div>
              </div>

              <div className="exercise-progress-stats-dual">
                <div className="stats-metric-row">
                  <span className="stats-label">ครั้งที่ทำได้จริง</span>
                  <span className="stats-value">
                    <strong className="stats-num">{item.actualReps}</strong>
                    <span className="stats-denom"> / {item.targetReps} ครั้ง</span>
                  </span>
                </div>
                <div className="stats-metric-row correct-row">
                  <span className="stats-label">ทำได้ถูกต้องตาม form</span>
                  <span className="stats-value">
                    <strong className="stats-num correct-highlight">{item.correctReps}</strong>
                    <span className="stats-denom"> / {item.actualReps} ครั้ง</span>
                  </span>
                </div>
              </div>

              <div
                className="progress-track"
                role="progressbar"
                aria-valuenow={item.accuracy}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`ความถูกต้องตาม form ${item.accuracy}%`}
              >
                <div
                  className={`progress-fill ${item.color}`}
                  style={{ width: `${Math.min(100, Math.max(0, item.accuracy))}%` }}
                />
              </div>

              <div className="exercise-accuracy-footer">
                <span className="accuracy-label">ความถูกต้องตาม form</span>
                <span className={`accuracy-badge-tag ${item.color}`}>{item.accuracy}%</span>
              </div>
            </article>
          ))}
        </div>

        <div className="achieved-card-footer">
          <button type="button" className="view-more-link" onClick={() => {}}>
            ดูเพิ่มเติม
          </button>
        </div>
      </section>

      {/* Physical Therapy Sessions in the period */}
      <section className="sessions-list-section" aria-label="การทำกายภาพในช่วงที่กำหนด">
        <h2 className="sessions-list-title">การทำกายภาพในช่วงที่กำหนด</h2>

        <div className="sessions-card-list">
          {filteredRounds.map((round) => {
            const timeInfo = formatTimeRange(round.startedAt, undefined, round.durationMinutes);
            const dateThai = formatThaiDateShortYear(round.date);

            // Group exercises of this round into modules
            const moduleGroups = new Map<number, string[]>();
            for (const s of round.sessions) {
              const meta = EXERCISE_META[s.code] || { moduleNum: 1, displayName: s.exercise };
              const list = moduleGroups.get(meta.moduleNum) || [];
              const simpleName = meta.displayName.replace(/\s*\(.*?\)\s*/g, "").trim();
              if (!list.includes(simpleName)) list.push(simpleName);
              moduleGroups.set(meta.moduleNum, list);
            }

            return (
              <article className="session-round-card" key={round.roundNumber} id={`session-round-${round.roundNumber}`}>
                <div className="session-card-main">
                  <div className="session-card-header-row">
                    <div className="session-round-title-group">
                      <h3 className="session-round-title">กายภาพครั้งที่ {round.roundNumber}</h3>
                      {planName && (
                        <span className="session-plan-badge" title={`แผนการฝึก: ${planName}`}>
                          <ClipboardList size={13} aria-hidden="true" />
                          <span>แผน: {planName}</span>
                        </span>
                      )}
                    </div>
                    <div className="session-metrics-summary">
                      <span className="session-metric-badge actual">
                        <span className="metric-label">ครั้งที่ทำได้จริง:</span>
                        <strong className="metric-num">{round.actualReps}</strong>/{round.targetReps} ครั้ง
                      </span>
                      <span className="session-metric-badge correct">
                        <span className="metric-label">ถูกต้องตาม form:</span>
                        <strong className="metric-num">{round.correctReps}</strong>/{round.actualReps} ครั้ง ({round.accuracy}%)
                      </span>
                    </div>
                  </div>

                  <div className="session-modules-row">
                    <span className="session-modules-label">ท่าที่ฝึกในรอบนี้ :</span>
                    <div className="session-modules-pills">
                      {Array.from(moduleGroups.entries())
                        .sort(([a], [b]) => a - b)
                        .map(([modNum, exList]) => {
                          const sortedExList = [...exList].sort((a, b) => {
                            if (a.includes("Seated Leg Raise") && b.includes("Sit To Stand")) return -1;
                            if (a.includes("Sit To Stand") && b.includes("Seated Leg Raise")) return 1;
                            return a.localeCompare(b);
                          });
                          return (
                            <span className="session-module-badge" key={modNum}>
                              Module {modNum}: {sortedExList.join(", ")}
                            </span>
                          );
                        })}
                    </div>
                  </div>

                  <div className="session-time-row">
                    <span className="time-item">วันที่ทำ : {dateThai} {timeInfo.timeText}</span>
                    <span className="time-separator">|</span>
                    <span className="time-item">{timeInfo.totalText}</span>
                  </div>
                </div>

                <div className="session-card-action">
                  <Link
                    href={`/doctor/patients/${profile.patient_id}/sessions/${round.representativeSessionId}`}
                    className="btn-session-detail"
                    id={`btn-detail-session-${round.roundNumber}`}
                  >
                    <span>ดูรายละเอียด</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
