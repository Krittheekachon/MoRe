"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Pencil, Calendar, Clock, User, CheckCircle2, Sparkles, Layers } from "lucide-react";
import { PageHeading } from "./shell";
import { DoctorCourseEditorModal } from "./doctor-course-editor-modal";

export type TemplateItem = {
  id: number;
  template_code: string;
  name_th: string;
  description: string | null;
  version_number: number;
  is_active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
  creator?: {
    display_name: string;
    role: string;
  } | null;
  exercises: Array<{
    id: number;
    exercise_id: number;
    selected_side: string | null;
    target_sets: number;
    target_reps_per_set: number;
    sessions_per_day: number;
    schedule_type: string;
    instructions: string | null;
    weekdays: Array<{ weekday: number }>;
    exercise: {
      name_th: string;
    };
  }>;
};

export type CatalogItem = {
  id: number;
  name_th: string;
  supports_side_selection: boolean;
};

const WEEKDAY_NAMES: Record<number, string> = {
  1: "จันทร์",
  2: "อังคาร",
  3: "พุธ",
  4: "พฤหัสบดี",
  5: "ศุกร์",
  6: "เสาร์",
  7: "อาทิตย์",
};

function formatThaiDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "-";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Bangkok",
    }).format(d);
  } catch {
    return "-";
  }
}

export function DoctorTemplateListView({
  templates,
  catalog,
}: {
  templates: TemplateItem[];
  catalog: CatalogItem[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((template) => {
      const name = template.name_th.toLowerCase();
      const desc = (template.description || "").toLowerCase();
      const exerciseMatch = template.exercises.some((e) =>
        e.exercise.name_th.toLowerCase().includes(q)
      );
      return name.includes(q) || desc.includes(q) || exerciseMatch;
    });
  }, [templates, searchQuery]);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (template: TemplateItem) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  return (
    <div className="doctor-templates-container">
      {/* Header section with Action button */}
      <div className="doctor-templates-header-row">
        <div>
          <PageHeading
            title="แผนการกายภาพบำบัดกลาง"
            subtitle="จัดการคอร์สการฝึกมาตรฐานเพื่อให้ผู้ป่วยเลือกนำไปฝึกฟื้นฟูตามคำแนะนำของแพทย์"
          />
        </div>
        <button
          type="button"
          className="doctor-create-course-btn"
          onClick={handleOpenCreate}
        >
          <Plus size={18} aria-hidden="true" />
          <span>สร้างแผนใหม่</span>
        </button>
      </div>

      {/* Search and summary filter */}
      <div className="doctor-templates-filter-row">
        <div className="doctor-templates-search-box">
          <Search size={18} aria-hidden="true" className="doctor-search-icon" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อแผน คอร์ส หรือท่าฝึก..."
            aria-label="ค้นหาแผนกลาง"
          />
        </div>
        <div className="doctor-templates-count-badge">
          <Layers size={15} aria-hidden="true" />
          <span>ทั้งหมด {templates.length} แผน</span>
        </div>
      </div>

      {/* Template Cards List */}
      <div className="doctor-templates-grid">
        {filteredTemplates.length === 0 ? (
          <div className="doctor-templates-empty">
            <p>ไม่พบแผนการฝึกที่ตรงกับการค้นหา</p>
          </div>
        ) : (
          filteredTemplates.map((template) => {
            const displayName = template.name_th.replace(/^DEMO\s+/, "");
            const editorName = template.creator?.display_name || "บุคลากรทางการแพทย์";
            const editorRole = template.creator?.role === "doctor" ? "แพทย์" : template.creator?.role === "therapist" ? "นักกายภาพ" : "บุคลากร";

            return (
              <article key={template.id} className="doctor-template-card">
                {/* Card Top: Title, Version, Status */}
                <div className="doctor-template-card-header">
                  <div className="doctor-template-title-group">
                    <h3 className="doctor-template-card-title">{displayName}</h3>
                    <div className="doctor-template-badge-group">
                      <span className="doctor-version-badge">
                        v.{template.version_number}
                      </span>
                      <span className="doctor-active-badge">
                        <CheckCircle2 size={13} aria-hidden="true" />
                        เปิดใช้งาน
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="doctor-edit-course-btn"
                    onClick={() => handleOpenEdit(template)}
                  >
                    <Pencil size={15} aria-hidden="true" />
                    <span>แก้ไขเป็นเวอร์ชันใหม่</span>
                  </button>
                </div>

                {/* Description */}
                {template.description && (
                  <p className="doctor-template-card-desc">
                    {template.description.replace(/^สังเคราะห์ ไม่ใช่แผนรักษา\n/, "")}
                  </p>
                )}

                {/* Exercises section */}
                <div className="doctor-template-exercises-section">
                  <h4 className="doctor-template-exercises-title">
                    ท่าในการฝึก ({template.exercises.length} ท่า)
                  </h4>
                  <div className="doctor-template-exercise-pills">
                    {template.exercises.map((item) => {
                      const isAiReady = item.exercise.name_th.includes("เหยียดขา") || item.exercise.name_th.includes("seated-leg-raise") || item.exercise_id === 3;
                      let sideLabel = "";
                      if (item.selected_side === "left") sideLabel = " • ข้างซ้าย";
                      else if (item.selected_side === "right") sideLabel = " • ข้างขวา";
                      else if (item.selected_side === "both") sideLabel = " • สองข้าง";

                      let scheduleLabel = "ทุกวัน";
                      if (item.schedule_type === "weekly" && item.weekdays.length > 0) {
                        scheduleLabel = item.weekdays
                          .map((w) => WEEKDAY_NAMES[w.weekday] || `${w.weekday}`)
                          .join(", ");
                      }

                      return (
                        <div key={item.id} className="doctor-template-exercise-pill">
                          <div className="pill-header">
                            <span className="pill-name">{item.exercise.name_th}</span>
                            {isAiReady && (
                              <span className="pill-ai-badge">
                                <Sparkles size={11} aria-hidden="true" />
                                AI พร้อม
                              </span>
                            )}
                          </div>
                          <div className="pill-details">
                            <span>
                              {item.target_sets} เซต × {item.target_reps_per_set} ครั้ง
                            </span>
                            <span> • วันละ {item.sessions_per_day} รอบ</span>
                            <span> • {scheduleLabel}</span>
                            {sideLabel && <span>{sideLabel}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Footer: Audit Trail */}
                <div className="doctor-template-card-footer">
                  <div className="doctor-template-audit">
                    <User size={14} aria-hidden="true" className="doctor-audit-icon" />
                    <span>
                      แก้ไขล่าสุดโดย: <strong>{editorName}</strong> ({editorRole})
                    </span>
                    <span className="audit-separator">•</span>
                    <Clock size={13} aria-hidden="true" className="doctor-audit-icon" />
                    <span>{formatThaiDate(template.updated_at || template.created_at)}</span>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Editor Modal */}
      {isModalOpen && (
        <DoctorCourseEditorModal
          template={editingTemplate}
          catalog={catalog}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
