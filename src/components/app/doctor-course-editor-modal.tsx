"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { X, Save, AlertCircle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { MASTER_EXERCISE_MODULES, type MasterExercise } from "@/lib/exercise-master-catalog";
import { requestId as newRequestId } from "@/lib/request-id";
import type { TemplateItem, CatalogItem } from "./doctor-templates-list";

type ExerciseConfig = {
  exerciseId: number;
  code: string;
  side: string | null;
  sets: number;
  reps: number;
  frequency: number;
  schedule: "daily" | "weekly";
  weekdays: number[];
  instructions: string;
};

async function submitTemplate(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "บันทึกข้อมูลไม่สำเร็จ");
  }
  return data;
}

export function DoctorCourseEditorModal({
  template,
  catalog,
  onClose,
}: {
  template: TemplateItem | null;
  catalog: CatalogItem[];
  onClose: () => void;
}) {
  const router = useRouter();
  const isEditing = !!template;
  const baseId = template?.id ?? null;

  const [name, setName] = useState(template ? template.name_th.replace(/^DEMO\s+/, "") : "");
  const [description, setDescription] = useState(
    template?.description ? template.description.replace(/^สังเคราะห์ ไม่ใช่แผนรักษา\n/, "") : ""
  );

  // Expanded module accordions (all 5 modules open by default for full visibility)
  const [openModules, setOpenModules] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
  });

  // Find DB exercise ID for seated-leg-raise (or demo knee extension)
  const readyDbExercise = catalog.find((c) =>
    c.name_th.includes("เหยียดขา") || c.name_th.includes("ยกขา") || c.name_th.includes("seated-leg-raise")
  ) || catalog[0];

  // Selected exercise configurations map
  const [configs, setConfigs] = useState<Record<string, ExerciseConfig>>(() => {
    const initial: Record<string, ExerciseConfig> = {};
    if (template) {
      for (const item of template.exercises) {
        // match code or use first
        const code = "seated-leg-raise";
        initial[code] = {
          exerciseId: item.exercise_id,
          code,
          side: item.selected_side || "left",
          sets: item.target_sets,
          reps: item.target_reps_per_set,
          frequency: item.sessions_per_day,
          schedule: item.schedule_type === "weekly" ? "weekly" : "daily",
          weekdays: item.weekdays.map((w) => w.weekday),
          instructions: item.instructions || "",
        };
      }
    } else if (readyDbExercise) {
      // Default: pre-select seated-leg-raise with sensible clinical defaults
      initial["seated-leg-raise"] = {
        exerciseId: readyDbExercise.id,
        code: "seated-leg-raise",
        side: "left",
        sets: 3,
        reps: 10,
        frequency: 2, // 2 rounds per day (morning & evening) recommended
        schedule: "daily",
        weekdays: [1, 2, 3, 4, 5, 6, 7],
        instructions: "นั่งตัวตรงบนเก้าอี้ที่มั่นคง ยกและเหยียดเข่าตรงค้างไว้ 2 วินาทีแล้วค่อยๆ ผ่อนลง",
      };
    }
    return initial;
  });

  const [busy, setBusy] = useState(false);
  const [errorStatus, setErrorStatus] = useState("");

  const toggleModule = (moduleNum: number) => {
    setOpenModules((prev) => ({ ...prev, [moduleNum]: !prev[moduleNum] }));
  };

  const handleToggleExercise = (exercise: MasterExercise, checked: boolean) => {
    if (!exercise.isSelectable || !readyDbExercise) return;

    setConfigs((prev) => {
      const next = { ...prev };
      if (checked) {
        next[exercise.code] = {
          exerciseId: readyDbExercise.id,
          code: exercise.code,
          side: exercise.supportsSide ? "left" : null,
          sets: exercise.defaultSets,
          reps: exercise.defaultReps,
          frequency: 2,
          schedule: "daily",
          weekdays: [1, 2, 3, 4, 5, 6, 7],
          instructions: "ฝึกช้าๆ ควบคุมลมหายใจให้เป็นปกติ",
        };
      } else {
        delete next[exercise.code];
      }
      return next;
    });
  };

  const updateConfig = (code: string, updates: Partial<ExerciseConfig>) => {
    setConfigs((prev) => {
      if (!prev[code]) return prev;
      return {
        ...prev,
        [code]: { ...prev[code], ...updates },
      };
    });
  };

  const toggleWeekday = (code: string, day: number) => {
    const current = configs[code]?.weekdays || [];
    const nextDays = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort();
    updateConfig(code, { weekdays: nextDays });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;

    if (!name.trim()) {
      setErrorStatus("กรุณาระบุชื่อแผนการฝึก");
      return;
    }

    const selectedList = Object.values(configs);
    if (selectedList.length === 0) {
      setErrorStatus("กรุณาเลือกท่าการฝึกอย่างน้อย 1 ท่า");
      return;
    }

    setBusy(true);
    setErrorStatus("");

    const reqId = newRequestId();
    const payload = {
      requestId: reqId,
      baseId,
      name: name.trim(),
      description: description.trim(),
      items: selectedList.map((item) => ({
        exerciseId: item.exerciseId,
        side: item.side,
        sets: item.sets,
        reps: item.reps,
        frequency: item.frequency,
        schedule: item.schedule,
        weekdays: item.schedule === "weekly" ? item.weekdays : [],
        instructions: item.instructions,
      })),
    };

    try {
      await submitTemplate("/api/doctor/templates", payload);
      router.refresh();
      onClose();
    } catch (err) {
      setErrorStatus(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setBusy(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="doctor-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="doctor-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="doctor-modal-header">
          <div>
            <h2 className="doctor-modal-title">
              {isEditing ? "แก้ไขแผนการฝึก (สร้างเวอร์ชันใหม่)" : "สร้างแผนการฝึกกลางใหม่"}
            </h2>
            <p className="doctor-modal-subtitle">
              {isEditing
                ? `แก้ไขจาก ${template?.name_th} (v.${template?.version_number}) ระบบจะสร้างเวอร์ชัน ${
                    (template?.version_number || 1) + 1
                  } โดยไม่กระทบประวัติย้อนหลังของผู้ป่วย`
                : "กำหนดชื่อแผน รายละเอียด และท่าการฝึกเพื่อเป็นคอร์สมาตรฐานให้คนไข้เลือก"}
            </p>
          </div>
          <button
            type="button"
            className="doctor-modal-close-btn"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="doctor-modal-form">
          {errorStatus && (
            <div className="doctor-form-error" role="alert">
              <AlertCircle size={18} />
              <span>{errorStatus}</span>
            </div>
          )}

          {/* Section 1: Basic Info */}
          <div className="doctor-form-section">
            <h3 className="doctor-section-title">1. ข้อมูลทั่วไปของคอร์ส</h3>
            <div className="doctor-form-field">
              <label htmlFor="course-name">
                ชื่อแผน / คอร์สการฝึก <span className="required">*</span>
              </label>
              <input
                id="course-name"
                type="text"
                required
                maxLength={145}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น คอร์สฟื้นฟูกำลังขาและข้อเท้า (ระยะเริ่มต้น)"
              />
            </div>

            <div className="doctor-form-field">
              <label htmlFor="course-desc">คำอธิบายและข้อแนะนำทางการแพทย์</label>
              <textarea
                id="course-desc"
                rows={3}
                maxLength={5000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="เช่น เหมาะสำหรับผู้ป่วยที่มีแรงขาพอประคองตัวได้ ควรมีผู้ดูแลอยู่ใกล้ชิดขณะฝึก..."
              />
            </div>
          </div>

          {/* Section 2: 5 Modules & 11 Exercises */}
          <div className="doctor-form-section">
            <div className="doctor-section-header">
              <h3 className="doctor-section-title">2. เลือกท่าฝึกจาก 5 Modules (ทั้งหมด 11 ท่า)</h3>
              <span className="doctor-section-note">
                (ท่าที่ระบบ AI ยังไม่พร้อมใช้งานจะแสดงสถานะปิดชั่วคราว)
              </span>
            </div>

            <div className="doctor-modules-accordion-list">
              {MASTER_EXERCISE_MODULES.map((module) => {
                const isOpen = openModules[module.moduleNumber];
                const selectedInModule = module.exercises.filter((ex) => !!configs[ex.code]).length;

                return (
                  <div key={module.moduleNumber} className="doctor-module-accordion">
                    <button
                      type="button"
                      className="doctor-module-accordion-header"
                      onClick={() => toggleModule(module.moduleNumber)}
                      aria-expanded={isOpen}
                    >
                      <div className="module-header-title">
                        <span className="module-badge">Module {module.moduleNumber}</span>
                        <span className="module-name">{module.nameTh}</span>
                        {selectedInModule > 0 && (
                          <span className="module-selected-count">
                            เลือก {selectedInModule} ท่า
                          </span>
                        )}
                      </div>
                      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    {isOpen && (
                      <div className="doctor-module-accordion-body">
                        <p className="module-desc">{module.descriptionTh}</p>
                        <div className="doctor-exercise-items-list">
                          {module.exercises.map((exercise) => {
                            const isSelected = !!configs[exercise.code];
                            const config = configs[exercise.code];
                            const isReady = exercise.isSelectable;

                            return (
                              <div
                                key={exercise.code}
                                className={`doctor-exercise-item ${
                                  !isReady ? "is-disabled" : isSelected ? "is-selected" : ""
                                }`}
                              >
                                <div className="exercise-item-header">
                                  <label className="exercise-item-label">
                                    <input
                                      type="checkbox"
                                      disabled={!isReady}
                                      checked={isSelected}
                                      onChange={(e) =>
                                        handleToggleExercise(exercise, e.target.checked)
                                      }
                                    />
                                    <div className="exercise-item-names">
                                      <span className="name-th">{exercise.nameTh}</span>
                                      <span className="name-en">{exercise.nameEn}</span>
                                    </div>
                                  </label>

                                  <div className="exercise-badges">
                                    {isReady ? (
                                      <span className="exercise-badge ready">
                                        <Sparkles size={12} />
                                        AI พร้อมใช้งาน
                                      </span>
                                    ) : (
                                      <span className="exercise-badge pending">
                                        เร็วๆ นี้
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <p className="exercise-item-desc">{exercise.descriptionTh}</p>

                                {/* Expanded configuration panel for selected exercise */}
                                {isSelected && config && (
                                  <div className="doctor-exercise-config-box">
                                    <div className="config-grid">
                                      {/* Target Sets */}
                                      <div className="config-field">
                                        <label>จำนวนเซต</label>
                                        <div className="number-input-wrap">
                                          <input
                                            type="number"
                                            min={1}
                                            max={50}
                                            required
                                            value={config.sets}
                                            onChange={(e) =>
                                              updateConfig(exercise.code, {
                                                sets: Number(e.target.value) || 1,
                                              })
                                            }
                                          />
                                          <span className="unit">เซต</span>
                                        </div>
                                      </div>

                                      {/* Target Reps */}
                                      <div className="config-field">
                                        <label>จำนวนครั้งต่อเซต</label>
                                        <div className="number-input-wrap">
                                          <input
                                            type="number"
                                            min={1}
                                            max={100}
                                            required
                                            value={config.reps}
                                            onChange={(e) =>
                                              updateConfig(exercise.code, {
                                                reps: Number(e.target.value) || 1,
                                              })
                                            }
                                          />
                                          <span className="unit">ครั้ง</span>
                                        </div>
                                      </div>

                                      {/* Sessions per day (Daily Frequency) */}
                                      <div className="config-field">
                                        <label>ความถี่ต่อวัน (รอบ/วัน)</label>
                                        <div className="frequency-selector">
                                          {[1, 2, 3].map((num) => (
                                            <button
                                              key={num}
                                              type="button"
                                              className={`frequency-btn ${
                                                config.frequency === num ? "active" : ""
                                              }`}
                                              onClick={() =>
                                                updateConfig(exercise.code, { frequency: num })
                                              }
                                            >
                                              {num} รอบ/วัน
                                              {num === 2 && <span className="rec-tag">แนะนำ</span>}
                                            </button>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Side selection */}
                                      {exercise.supportsSide && (
                                        <div className="config-field">
                                          <label>ข้างที่ฝึก</label>
                                          <select
                                            value={config.side || "none"}
                                            onChange={(e) =>
                                              updateConfig(exercise.code, {
                                                side: e.target.value === "none" ? null : e.target.value,
                                              })
                                            }
                                          >
                                            <option value="left">ข้างซ้าย</option>
                                            <option value="right">ข้างขวา</option>
                                            <option value="both">สองข้าง (ซ้ายและขวา)</option>
                                            <option value="none">ไม่แยกข้าง (ให้คนไข้เลือกก่อนฝึก)</option>
                                          </select>
                                        </div>
                                      )}
                                    </div>

                                    {/* Schedule Type (Daily vs Weekly) */}
                                    <div className="config-schedule-row">
                                      <label>ตารางการฝึกในรอบสัปดาห์:</label>
                                      <div className="schedule-type-radios">
                                        <label className="radio-label">
                                          <input
                                            type="radio"
                                            name={`schedule-${exercise.code}`}
                                            checked={config.schedule === "daily"}
                                            onChange={() =>
                                              updateConfig(exercise.code, { schedule: "daily" })
                                            }
                                          />
                                          ทุกวัน (7 วัน/สัปดาห์)
                                        </label>
                                        <label className="radio-label">
                                          <input
                                            type="radio"
                                            name={`schedule-${exercise.code}`}
                                            checked={config.schedule === "weekly"}
                                            onChange={() =>
                                              updateConfig(exercise.code, { schedule: "weekly" })
                                            }
                                          />
                                          เลือกวันเฉพาะในสัปดาห์
                                        </label>
                                      </div>

                                      {config.schedule === "weekly" && (
                                        <div className="weekdays-selector">
                                          {[
                                            { d: 1, label: "จ." },
                                            { d: 2, label: "อ." },
                                            { d: 3, label: "พ." },
                                            { d: 4, label: "พฤ." },
                                            { d: 5, label: "ศ." },
                                            { d: 6, label: "ส." },
                                            { d: 7, label: "อา." },
                                          ].map((dayItem) => {
                                            const isDaySelected = config.weekdays.includes(dayItem.d);
                                            return (
                                              <button
                                                key={dayItem.d}
                                                type="button"
                                                className={`weekday-pill ${
                                                  isDaySelected ? "active" : ""
                                                }`}
                                                onClick={() =>
                                                  toggleWeekday(exercise.code, dayItem.d)
                                                }
                                              >
                                                {dayItem.label}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>

                                    {/* Specific Instructions */}
                                    <div className="config-instructions">
                                      <label>คำแนะนำเฉพาะท่านี้</label>
                                      <input
                                        type="text"
                                        maxLength={500}
                                        value={config.instructions}
                                        onChange={(e) =>
                                          updateConfig(exercise.code, {
                                            instructions: e.target.value,
                                          })
                                        }
                                        placeholder="เช่น เหยียดขาค้างไว้ 2 วินาที อย่ากลั้นหายใจ"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="doctor-modal-actions">
            <button
              type="button"
              className="doctor-modal-cancel-btn"
              onClick={onClose}
              disabled={busy}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="doctor-modal-save-btn"
              disabled={busy}
            >
              <Save size={18} />
              <span>{busy ? "กำลังบันทึก..." : isEditing ? "บันทึกเป็นเวอร์ชันใหม่" : "สร้างแผนการฝึก"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
