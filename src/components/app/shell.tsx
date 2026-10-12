"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, UserRound, UsersRound, ClipboardList, ArrowLeft, Menu, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { useDemo } from "./demo-provider";
import { DisplayMenu, DisplaySettings } from "./display-settings";
import { LogoutButton } from "./logout-button";
import type { PatientProfile } from "@/lib/demo-data";

export function AppShell({ children, doctor = false, patientProfile, demo = false }: { children: ReactNode; doctor?: boolean; patientProfile?: PatientProfile; demo?: boolean }) {
  const path = usePathname();
  const cameraPage = /\/exercises\/[^/]+\/camera$/.test(path);
  const { profiles } = useDemo();
  const patient = patientProfile || profiles[0];
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);

  const nav = doctor
    ? [
        { href: "/doctor", label: "ผู้ป่วย", icon: UsersRound },
        { href: "/doctor/templates", label: "แผนกลาง", icon: ClipboardList },
      ]
    : [
        { href: "/patient", label: "หน้าหลัก", icon: Home },
        { href: "/patient/exercises", label: "ท่าฝึก", icon: ClipboardList },
        { href: "/patient/progress", label: "ความก้าวหน้า", icon: CalendarDays },
        { href: "/patient/profile", label: "โปรไฟล์", icon: UserRound },
      ];

  const isDoctorNavActive = (href: string) => {
    if (href === "/doctor") {
      return path === "/doctor" || path.startsWith("/doctor/patients/");
    }
    return path.startsWith(href);
  };

  const isPatientNavActive = (href: string) => {
    if (href === "/patient") {
      return path === "/patient";
    }
    return path.startsWith(href);
  };

  return (
    <div className={`system-app ${doctor ? "doctor-app" : "patient-app"} ${cameraPage ? "camera-workspace" : ""}`}>
      <a className="skip-link" href="#workspace-content">ข้ามไปเนื้อหา</a>
      <header className="app-topbar">
        <div className="topbar-left">
          {doctor && (
            <button
              ref={menuRef}
              className="icon-command mobile-menu"
              aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"}
              title={menuOpen ? "ปิดเมนู" : "เปิดเมนู"}
              aria-expanded={menuOpen}
              aria-controls="workspace-navigation"
              onClick={() => setMenuOpen(v => !v)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
          <Link className="app-brand" href={doctor ? "/doctor" : "/patient"}>
            <Image src="/more-mark.png" alt="" width={38} height={38} priority />
            <span className="brand-text">
              MoRe
              <small>ระบบฟื้นฟูผู้ป่วย</small>
            </span>
          </Link>
          <span className="app-role-badge">{doctor ? "แพทย์ / นักกายภาพ" : "ผู้ป่วย"}</span>

          {doctor && (
            <nav className="topbar-nav" aria-label="เมนูแพทย์">
              {nav.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="topbar-nav-link"
                  aria-current={isDoctorNavActive(href) ? "page" : undefined}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="topbar-actions">
          {demo && (
            <span className="demo-label" aria-label="DEMO สังเคราะห์">
              DEMO<span className="demo-label-detail"> สังเคราะห์</span>
            </span>
          )}
          <DisplaySettings className="topbar-settings-btn" />
          <LogoutButton compact destination={doctor ? "/doctor/login" : "/"} />
        </div>
      </header>

      {doctor && menuOpen && (
        <>
          <div
            className="mobile-nav-backdrop"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <nav
            id="workspace-navigation"
            className="mobile-nav-drawer"
            aria-label="เมนูแพทย์บนมือถือ"
            onKeyDown={event => {
              if (event.key === "Escape") {
                setMenuOpen(false);
                menuRef.current?.focus();
              }
            }}
          >
            <div className="mobile-nav-header">
              <span className="mobile-nav-role">แพทย์ / นักกายภาพ</span>
              <button
                type="button"
                className="icon-command mobile-nav-close"
                aria-label="ปิดเมนู"
                onClick={() => setMenuOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="mobile-nav-links">
              {nav.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="mobile-nav-link"
                  onClick={() => setMenuOpen(false)}
                  aria-current={isDoctorNavActive(href) ? "page" : undefined}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </nav>
        </>
      )}

      {!doctor && (
        <aside className="app-sidebar">
          <Link className="app-brand sidebar-brand" href="/patient">
            <Image src="/more-mark.png" alt="" width={40} height={40} />
            <span className="brand-text">
              MoRe
              <small>ระบบฟื้นฟูผู้ป่วย</small>
            </span>
          </Link>
          <nav id="workspace-navigation" className="app-navigation" aria-label="เมนูผู้ป่วย">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isPatientNavActive(href) ? "page" : undefined}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className="sidebar-footer">
            <Link className="sidebar-patient" href="/patient/profile">
              <span className="patient-avatar"><UserRound size={22} /></span>
              <span><strong>{patient.full_name}</strong><small>ผู้ป่วย{patient.hn && ` · ${patient.hn}`}</small></span>
            </Link>
            <div className="sidebar-footer-actions">
              <DisplaySettings className="sidebar-settings-btn" />
              <LogoutButton />
            </div>
          </div>
        </aside>
      )}

      <main id="workspace-content" tabIndex={-1} className="app-main">
        {!doctor && (path === "/patient" || path === "/patient/exercises") && (
          <div className="patient-display-toolbar">
            {path === "/patient" && <DisplaySettings />}
            <DisplayMenu navigation />
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
export function PageHeading({ title, subtitle, back, backLabel = "กลับ", children }: { title: string; subtitle?: string; back?: string; backLabel?: string; children?: ReactNode }) {
  return <header className="page-heading">{back && <Link className="back-command" href={back}><ArrowLeft size={18} /> {backLabel}</Link>}<div className="heading-line"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{children}</div></header>;
}
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="empty-state"><ClipboardList size={32} aria-hidden="true" /><h2>{title}</h2>{children}</div>;
}
