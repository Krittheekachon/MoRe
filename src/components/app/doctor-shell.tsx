"use client";

import { MoreLogo } from "@/components/ui/more-logo";
import { CalendarDays, Home, UserRound, UsersRound, ClipboardList, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";


import { LogoutButton } from "./logout-button";
import { DisplaySettings } from "./display-settings";
import type { PatientProfile } from "@/lib/demo-data";

export function DoctorShell({ children, doctor = false, demo = false }: { children: ReactNode; doctor?: boolean; patientProfile?: PatientProfile; demo?: boolean }) {
  const path = usePathname();
  const cameraPage = /\/exercises\/[^/]+\/camera$/.test(path);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  useEffect(() => { if (menuOpen) drawerRef.current?.focus(); }, [menuOpen]);

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


  return (
    <div className={`system-app ${doctor ? "doctor-app" : "patient-app"} ${cameraPage ? "camera-workspace" : ""}`}>
      <a className="skip-link" href="#workspace-content">ข้ามไปเนื้อหา</a>
    <header className="app-topbar">
      {doctor && <button ref={menuRef} className="icon-command mobile-menu" aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"} title={menuOpen ? "ปิดเมนู" : "เปิดเมนู"} aria-expanded={menuOpen} aria-controls="workspace-navigation" onClick={() => setMenuOpen(v => !v)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>}
      <Link className="app-brand" href={doctor ? "/doctor" : "/patient"}><MoreLogo size="navigation" tagline /></Link>
      <span className="app-role">{doctor ? "แพทย์ / นักกายภาพ" : "ผู้ป่วย"}</span>
      <nav className="topbar-nav" aria-label="เมนูแพทย์">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="topbar-nav-link" aria-current={isDoctorNavActive(href) ? "page" : undefined}><Icon size={18} /><span>{label}</span></Link>)}</nav>
      {demo && <span className="demo-label" aria-label="DEMO สังเคราะห์">DEMO<span className="demo-label-detail"> สังเคราะห์</span></span>}
      <DisplaySettings hideAudio />
      <div className="app-logout"><LogoutButton compact={doctor} destination={doctor ? "/doctor/login" : "/"} /></div>
    </header>
      {doctor && menuOpen && (
        <>
          <div
            className="mobile-nav-backdrop"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <nav
            ref={drawerRef}
            tabIndex={-1}
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
              <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--line)" }}>
                <DisplaySettings labeled className="w-full justify-start" hideAudio />
              </div>
            </div>
          </nav>
        </>
      )}

      <main id="workspace-content" tabIndex={-1} className="app-main">
        {children}
      </main>
    </div>
  );
}
