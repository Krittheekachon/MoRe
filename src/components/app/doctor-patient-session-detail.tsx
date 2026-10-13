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
  TrendingUp,
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

type SessionItem = PatientData["sessions"][number];

function DoctorExerciseAngleChart({
  sess,
  displayName,
}: {
  sess: SessionItem;
  displayName: string;
}) {
  const [metricFilter, setMetricFilter] = useState<"all" | "avg" | "max">("all");
  const [viewMode, setViewMode] = useState<"sets" | "reps">("sets");
  const [hoveredInfo, setHoveredInfo] = useState<{
    label: string;
    avg?: number | null;
    max?: number | null;
    correct?: boolean;
  } | null>(null);

  // 1. Calculate per-set points
  const setPoints = useMemo(() => {
    return sess.sets.map((s) => {
      const allPeaks = s.repetitions
        .flatMap((r) => r.metrics)
        .map((m) => m.peak)
        .filter((v) => Number.isFinite(v));
      const avg = allPeaks.length
        ? Number((allPeaks.reduce((a, b) => a + b, 0) / allPeaks.length).toFixed(1))
        : null;
      const max = allPeaks.length ? Number(Math.max(...allPeaks).toFixed(1)) : null;
      const min = allPeaks.length ? Number(Math.min(...allPeaks).toFixed(1)) : null;
      const correctCount = s.repetitions.filter((r) => r.correct).length;

      return {
        key: `set-${s.number}`,
        setNumber: s.number,
        label: `Set ${s.number}`,
        shortLabel: `Set ${s.number}`,
        avg,
        max,
        min,
        repsCount: s.repetitions.length,
        correctCount,
      };
    });
  }, [sess.sets]);

  // 2. Calculate per-rep points
  const repPoints = useMemo(() => {
    let globalIndex = 0;
    return sess.sets.flatMap((s) => {
      const setPeaks = s.repetitions
        .flatMap((r) => r.metrics)
        .map((m) => m.peak)
        .filter((v) => Number.isFinite(v));
      const setAvg = setPeaks.length
        ? Number((setPeaks.reduce((a, b) => a + b, 0) / setPeaks.length).toFixed(1))
        : null;
      const setMax = setPeaks.length ? Number(Math.max(...setPeaks).toFixed(1)) : null;

      return s.repetitions.map((r) => {
        globalIndex++;
        const peak = r.metrics.length && Number.isFinite(r.metrics[0].peak)
          ? Number(r.metrics[0].peak.toFixed(1))
          : null;

        return {
          key: `rep-${globalIndex}`,
          globalIndex,
          setNumber: s.number,
          inSetRep: r.number,
          label: `ครั้งที่ ${globalIndex} (Set ${s.number})`,
          shortLabel: `${globalIndex}`,
          angle: peak,
          setAvg,
          setMax,
          correct: r.correct,
        };
      });
    });
  }, [sess.sets]);

  // 3. Overall Session Stats
  const { sessionAvg, sessionMax, sessionMin, totalAngleReps } = useMemo(() => {
    const allPeaks = sess.sets
      .flatMap((s) => s.repetitions.flatMap((r) => r.metrics).map((m) => m.peak))
      .filter((v) => Number.isFinite(v));

    return {
      sessionAvg: allPeaks.length
        ? (allPeaks.reduce((a, b) => a + b, 0) / allPeaks.length).toFixed(1)
        : null,
      sessionMax: allPeaks.length ? Math.max(...allPeaks).toFixed(1) : null,
      sessionMin: allPeaks.length ? Math.min(...allPeaks).toFixed(1) : null,
      totalAngleReps: allPeaks.length,
    };
  }, [sess.sets]);

  if (totalAngleReps === 0) {
    return null;
  }

  // Dimensions
  const svgWidth = 640;
  const svgHeight = 220;
  const padLeft = 52;
  const padRight = 24;
  const padTop = 22;
  const padBottom = 38;

  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  // Active values for dynamic Y range
  const activeValues = (() => {
    if (viewMode === "sets") {
      const vals: number[] = [];
      for (const p of setPoints) {
        if (metricFilter !== "max" && p.avg !== null) vals.push(p.avg);
        if (metricFilter !== "avg" && p.max !== null) vals.push(p.max);
      }
      return vals;
    } else {
      const vals: number[] = [];
      for (const p of repPoints) {
        if (p.angle !== null) vals.push(p.angle);
        if (metricFilter !== "max" && p.setAvg !== null) vals.push(p.setAvg);
      }
      return vals;
    }
  })();

  const rawMin = activeValues.length ? Math.min(...activeValues) : 0;
  const rawMax = activeValues.length ? Math.max(...activeValues) : 180;

  // Dynamic comfortable bounds
  let bottom = Math.max(0, Math.floor((rawMin - 5) / 10) * 10);
  let top = Math.min(180, Math.ceil((rawMax + 5) / 10) * 10);
  if (top - bottom < 30) {
    const mid = Math.round((top + bottom) / 2);
    bottom = Math.max(0, mid - 15);
    top = Math.min(180, mid + 15);
  }

  const step = Math.max(10, Math.ceil((top - bottom) / 4 / 5) * 5);
  const yTicks: number[] = [];
  for (let t = bottom; t <= top; t += step) {
    yTicks.push(t);
  }
  if (yTicks[yTicks.length - 1] < top && top - yTicks[yTicks.length - 1] >= 5) {
    yTicks.push(top);
  }

  const getY = (val: number) => {
    const clamped = Math.max(bottom, Math.min(top, val));
    return padTop + plotH - ((clamped - bottom) / Math.max(1, top - bottom)) * plotH;
  };

  const getSetX = (index: number) => {
    if (setPoints.length <= 1) return padLeft + plotW / 2;
    return padLeft + (index / (setPoints.length - 1)) * plotW;
  };

  const getRepX = (index: number) => {
    if (repPoints.length <= 1) return padLeft + plotW / 2;
    return padLeft + (index / (repPoints.length - 1)) * plotW;
  };

  // Coords for Sets mode
  const setAvgCoords = setPoints
    .map((p, idx) => (p.avg !== null ? { x: getSetX(idx), y: getY(p.avg), val: p.avg, p } : null))
    .filter(Boolean) as Array<{ x: number; y: number; val: number; p: (typeof setPoints)[0] }>;

  const setMaxCoords = setPoints
    .map((p, idx) => (p.max !== null ? { x: getSetX(idx), y: getY(p.max), val: p.max, p } : null))
    .filter(Boolean) as Array<{ x: number; y: number; val: number; p: (typeof setPoints)[0] }>;

  // Coords for Reps mode
  const repAngleCoords = repPoints
    .map((p, idx) => (p.angle !== null ? { x: getRepX(idx), y: getY(p.angle), val: p.angle, p } : null))
    .filter(Boolean) as Array<{ x: number; y: number; val: number; p: (typeof repPoints)[0] }>;

  const repAvgCoords = repPoints
    .map((p, idx) => (p.setAvg !== null ? { x: getRepX(idx), y: getY(p.setAvg), val: p.setAvg, p } : null))
    .filter(Boolean) as Array<{ x: number; y: number; val: number; p: (typeof repPoints)[0] }>;

  return (
    <div className="doctor-session-angle-chart" aria-label={`กราฟมุมองศา ${displayName}`}>
      {/* 1. Header with title & filter controls */}
      <div className="chart-header">
        <div className="chart-header-info">
          <h4>
            <TrendingUp size={18} className="chart-title-icon" aria-hidden="true" />
            กราฟวิเคราะห์มุมการเคลื่อนไหว (องศา)
          </h4>
          <p>องศาการงอ-เหยียดข้อต่อขณะฝึก · เปรียบเทียบค่าเฉลี่ยและค่าสูงสุด</p>
        </div>

        <div className="chart-controls-wrap">
          {/* Metric Filter */}
          <div className="chart-filter-group" role="group" aria-label="กรองข้อมูลองศา">
            <span className="chart-filter-label">แสดงค่า:</span>
            <div className="segmented-control">
              <button
                type="button"
                className={`seg-btn ${metricFilter === "all" ? "active" : ""}`}
                onClick={() => setMetricFilter("all")}
              >
                ทั้งหมด (Avg + Max)
              </button>
              <button
                type="button"
                className={`seg-btn ${metricFilter === "avg" ? "active" : ""}`}
                onClick={() => setMetricFilter("avg")}
              >
                องศาเฉลี่ย (Avg)
              </button>
              <button
                type="button"
                className={`seg-btn ${metricFilter === "max" ? "active" : ""}`}
                onClick={() => setMetricFilter("max")}
              >
                องศาสูงสุด (Max)
              </button>
            </div>
          </div>

          {/* View Mode */}
          <div className="chart-filter-group" role="group" aria-label="มุมมองแกน">
            <span className="chart-filter-label">แกนแนวนอน:</span>
            <div className="segmented-control">
              <button
                type="button"
                className={`seg-btn ${viewMode === "sets" ? "active" : ""}`}
                onClick={() => setViewMode("sets")}
              >
                รายเซต (Set 1–{setPoints.length})
              </button>
              <button
                type="button"
                className={`seg-btn ${viewMode === "reps" ? "active" : ""}`}
                onClick={() => setViewMode("reps")}
              >
                รายครั้ง (Rep 1–{repPoints.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Summary stats bar & Legend */}
      <div className="chart-summary-bar">
        <div className="chart-stats-left">
          <div className="stat-item">
            <span className="stat-label">องศาเฉลี่ยทั้งรอบ</span>
            <strong className="stat-val">{sessionAvg !== null ? `${sessionAvg}°` : "-"}</strong>
          </div>
          <div className="stat-item">
            <span className="stat-label">องศาสูงสุดของรอบ</span>
            <strong className="stat-val max">{sessionMax !== null ? `${sessionMax}°` : "-"}</strong>
          </div>
          <div className="stat-item">
            <span className="stat-label">ช่วงมุมที่ทำได้</span>
            <strong className="stat-val">
              {sessionMin !== null && sessionMax !== null ? `${sessionMin}° – ${sessionMax}°` : "-"}
            </strong>
          </div>

          {/* Live hover indicator */}
          {hoveredInfo && (
            <div className="stat-item live-hover-stat">
              <span className="stat-label">จุดที่ชี้: {hoveredInfo.label}</span>
              <strong className="stat-val hover-val">
                {hoveredInfo.avg !== undefined && `Avg: ${hoveredInfo.avg}° `}
                {hoveredInfo.max !== undefined && `Max: ${hoveredInfo.max}°`}
              </strong>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="chart-legend" aria-hidden="true">
          {(metricFilter === "all" || metricFilter === "avg") && (
            <span className="legend-item">
              <span className="legend-line avg" />
              <span>องศาเฉลี่ย (Avg)</span>
            </span>
          )}
          {(metricFilter === "all" || metricFilter === "max") && (
            <span className="legend-item">
              <span className="legend-line max" />
              <span>{viewMode === "sets" ? "องศาสูงสุด (Max)" : "องศาแต่ละครั้ง (Peak)"}</span>
            </span>
          )}
        </div>
      </div>

      {/* 3. SVG Line Chart */}
      <div className="chart-svg-container">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="chart-svg"
          role="img"
          aria-label={`กราฟแสดงมุมองศาของ ${displayName}`}
        >
          {/* Horizontal Grid lines and Y axis text */}
          {yTicks.map((tickVal) => {
            const y = getY(tickVal);
            return (
              <g key={`ytick-${tickVal}`}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + plotW}
                  y2={y}
                  className="grid-line"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="axis-text"
                >
                  {tickVal}°
                </text>
              </g>
            );
          })}

          {/* Y Axis vertical baseline */}
          <line
            x1={padLeft}
            y1={padTop}
            x2={padLeft}
            y2={padTop + plotH}
            className="axis-line"
          />

          {/* X Axis horizontal baseline */}
          <line
            x1={padLeft}
            y1={padTop + plotH}
            x2={padLeft + plotW}
            y2={padTop + plotH}
            className="axis-line"
          />

          {/* X Axis labels */}
          {viewMode === "sets" ? (
            setPoints.map((p, idx) => {
              const x = getSetX(idx);
              return (
                <text
                  key={p.key}
                  x={x}
                  y={padTop + plotH + 20}
                  textAnchor="middle"
                  className="axis-text"
                >
                  {p.label}
                </text>
              );
            })
          ) : (
            repPoints.map((p, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === repPoints.length - 1;
              const isStep = p.globalIndex % 5 === 0;
              if (!isFirst && !isLast && !isStep) return null;
              const x = getRepX(idx);
              return (
                <text
                  key={p.key}
                  x={x}
                  y={padTop + plotH + 20}
                  textAnchor="middle"
                  className="axis-text"
                >
                  {p.globalIndex}
                </text>
              );
            })
          )}

          {/* Polylines & Points: Sets Mode */}
          {viewMode === "sets" && (
            <>
              {/* Avg Line */}
              {(metricFilter === "all" || metricFilter === "avg") && setAvgCoords.length > 0 && (
                <>
                  <polyline
                    points={setAvgCoords.map((c) => `${c.x},${c.y}`).join(" ")}
                    className="line-avg"
                  />
                  {setAvgCoords.map((c) => (
                    <circle
                      key={`set-avg-pt-${c.p.setNumber}`}
                      cx={c.x}
                      cy={c.y}
                      r={4.5}
                      className="point-avg"
                      onMouseEnter={() =>
                        setHoveredInfo({
                          label: c.p.label,
                          avg: c.p.avg,
                          max: c.p.max,
                        })
                      }
                      onMouseLeave={() => setHoveredInfo(null)}
                    >
                      <title>{`${c.p.label} · องศาเฉลี่ย: ${c.val}° (สูงสุด: ${c.p.max}°)`}</title>
                    </circle>
                  ))}
                </>
              )}

              {/* Max Line */}
              {(metricFilter === "all" || metricFilter === "max") && setMaxCoords.length > 0 && (
                <>
                  <polyline
                    points={setMaxCoords.map((c) => `${c.x},${c.y}`).join(" ")}
                    className="line-max"
                  />
                  {setMaxCoords.map((c) => (
                    <circle
                      key={`set-max-pt-${c.p.setNumber}`}
                      cx={c.x}
                      cy={c.y}
                      r={4}
                      className="point-max"
                      onMouseEnter={() =>
                        setHoveredInfo({
                          label: c.p.label,
                          avg: c.p.avg,
                          max: c.p.max,
                        })
                      }
                      onMouseLeave={() => setHoveredInfo(null)}
                    >
                      <title>{`${c.p.label} · องศาสูงสุด: ${c.val}° (เฉลี่ย: ${c.p.avg}°)`}</title>
                    </circle>
                  ))}
                </>
              )}
            </>
          )}

          {/* Polylines & Points: Reps Mode */}
          {viewMode === "reps" && (
            <>
              {/* Set Avg Benchmark Line (step/guideline) */}
              {(metricFilter === "all" || metricFilter === "avg") && repAvgCoords.length > 0 && (
                <polyline
                  points={repAvgCoords.map((c) => `${c.x},${c.y}`).join(" ")}
                  className="line-avg"
                />
              )}

              {/* Individual Rep Peak Line */}
              {(metricFilter === "all" || metricFilter === "max") && repAngleCoords.length > 0 && (
                <>
                  <polyline
                    points={repAngleCoords.map((c) => `${c.x},${c.y}`).join(" ")}
                    className="line-max"
                  />
                  {repAngleCoords.map((c) => (
                    <circle
                      key={`rep-pt-${c.p.globalIndex}`}
                      cx={c.x}
                      cy={c.y}
                      r={3.5}
                      className="point-max"
                      style={{
                        fill: c.p.correct ? "#0284c7" : "#ef4444",
                      }}
                      onMouseEnter={() =>
                        setHoveredInfo({
                          label: c.p.label,
                          max: c.p.angle,
                          avg: c.p.setAvg,
                          correct: c.p.correct,
                        })
                      }
                      onMouseLeave={() => setHoveredInfo(null)}
                    >
                      <title>{`${c.p.label} · องศา: ${c.val}° · ${c.p.correct ? "ทำถูกต้อง" : "ยังไม่ถึงเกณฑ์"}`}</title>
                    </circle>
                  ))}
                </>
              )}
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

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

                    {/* Angle Progression Chart */}
                    <DoctorExerciseAngleChart sess={sess} displayName={meta.displayName} />

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
