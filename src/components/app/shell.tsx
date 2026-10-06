"use client";

import { MoreLogo } from "@/components/ui/more-logo";
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
    ? [{ href: "/doctor", label: "ผู้ป่วย", icon: UsersRound }, { href: "/doctor/templates", label: "แผนกลาง", icon: ClipboardList }]
    : [{ href: "/patient", label: "หน้าหลัก", icon: Home }, { href: "/patient/exercises", label: "ท่าฝึก", icon: ClipboardList }, { href: "/patient/progress", label: "ความก้าวหน้า", icon: CalendarDays }, { href: "/patient/profile", label: "โปรไฟล์", icon: UserRound }];
  return <div className={`system-app ${doctor ? "doctor-app" : "patient-app"} ${cameraPage ? "camera-workspace" : ""}`}>
    <a className="skip-link" href="#workspace-content">ข้ามไปเนื้อหา</a>
    <header className="app-topbar">
      {doctor && <button ref={menuRef} className="icon-command mobile-menu" aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"} title={menuOpen ? "ปิดเมนู" : "เปิดเมนู"} aria-expanded={menuOpen} aria-controls="workspace-navigation" onClick={() => setMenuOpen(v => !v)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>}
      <Link className="app-brand" href={doctor ? "/doctor" : "/patient"}><MoreLogo size="navigation" tagline /></Link>
      <span className="app-role">{doctor ? "แพทย์ / นักกายภาพ" : "ผู้ป่วย"}</span>
      {demo && <span className="demo-label" aria-label="DEMO สังเคราะห์">DEMO<span className="demo-label-detail"> สังเคราะห์</span></span>}
      <LogoutButton compact destination={doctor ? "/doctor/login" : "/"} />
    </header>
    <aside className="app-sidebar">
      {!doctor && <Link className="app-brand sidebar-brand" href="/patient"><MoreLogo size="navigation" tagline /></Link>}
      <nav id="workspace-navigation" className="app-navigation" data-open={menuOpen} aria-label={doctor ? "เมนูแพทย์" : "เมนูผู้ป่วย"} onKeyDown={event => { if (event.key === "Escape") { setMenuOpen(false); menuRef.current?.focus(); } }}>
      {nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} aria-current={(href === "/doctor" ? path === href || path.startsWith("/doctor/patients/") : href === "/patient" ? path === href : path.startsWith(href)) ? "page" : undefined}><Icon size={20} /><span>{label}</span></Link>)}
    </nav>
      {!doctor && <div className="sidebar-footer"><Link className="sidebar-patient" href="/patient/profile"><span className="patient-avatar"><UserRound size={22} /></span><span><strong>{patient.full_name}</strong><small>ผู้ป่วย{patient.hn && ` · ${patient.hn}`}</small></span></Link><LogoutButton /></div>}
    </aside>
    <main id="workspace-content" tabIndex={-1} className="app-main">{!doctor && (path === "/patient" || path === "/patient/exercises") && <div className="patient-display-toolbar">{path === "/patient" && <DisplaySettings />}<DisplayMenu navigation /></div>}{children}</main>
  </div>;
}
export function PageHeading({ title, subtitle, back, backLabel = "กลับ", children }: { title: string; subtitle?: string; back?: string; backLabel?: string; children?: ReactNode }) {
  return <header className="page-heading">{back && <Link className="back-command" href={back}><ArrowLeft size={18} /> {backLabel}</Link>}<div className="heading-line"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{children}</div></header>;
}
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="empty-state"><ClipboardList size={32} aria-hidden="true" /><h2>{title}</h2>{children}</div>;
}
