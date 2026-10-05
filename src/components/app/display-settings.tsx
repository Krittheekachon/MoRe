"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Menu, MoreHorizontal, Moon, Settings, Sun, X } from "lucide-react";
import { fontSizeCookie, themeCookie, type FontSize, type Theme } from "@/lib/display-settings";

const DisplayContext = createContext<{
  size: FontSize;
  setSize: (size: FontSize) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  open: (trigger: HTMLElement) => void;
} | null>(null);

export function DisplaySettingsProvider({ initialSize, initialTheme, children }: { initialSize: FontSize; initialTheme: Theme; children: ReactNode }) {
  const [size, setCurrentSize] = useState(initialSize);
  const [theme, setCurrentTheme] = useState(initialTheme);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef("");
  function open(trigger: HTMLElement) {
    triggerRef.current = trigger;
    scrollRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.showModal();
  }
  function restoreFocus() {
    document.body.style.overflow = scrollRef.current;
    if (triggerRef.current?.isConnected) {
      triggerRef.current.focus({ preventScroll: true });
      triggerRef.current.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }
  function savePreference(name: string, value: string) {
    document.cookie = `${name}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  }
  function setSize(nextSize: FontSize) {
    setCurrentSize(nextSize);
    document.documentElement.dataset.size = nextSize;
    savePreference(fontSizeCookie, nextSize);
  }
  function setTheme(nextTheme: Theme) {
    setCurrentTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    savePreference(themeCookie, nextTheme);
  }
  return <DisplayContext.Provider value={{ size, setSize, theme, setTheme, open }}>{children}
    <dialog ref={dialogRef} className="display-dialog" aria-labelledby="display-settings-title" onClose={restoreFocus} onKeyDown={event => {
      if (event.key !== "Tab") return;
      const controls = event.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled]), input:checked");
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }} onClick={event => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}>
      <div className="display-panel">
        <header><h2 id="display-settings-title"><Settings size={22} aria-hidden="true" />การแสดงผล</h2><button type="button" className="icon-command" aria-label="ปิดการแสดงผล" onClick={() => dialogRef.current?.close()}><X size={22} /></button></header>
        <DisplayOptions />
        <button type="button" className="command primary display-done" onClick={() => dialogRef.current?.close()}>เสร็จสิ้น</button>
      </div>
    </dialog>
  </DisplayContext.Provider>;
}

export function DisplaySettings({ className = "" }: { className?: string }) {
  const settings = useContext(DisplayContext);
  if (!settings) throw new Error("DisplaySettingsProvider is required");
  return <button type="button" className={`icon-command display-trigger ${className}`} aria-label="การแสดงผล" title="การแสดงผล" aria-haspopup="dialog" onClick={event => settings.open(event.currentTarget)}><Settings size={22} aria-hidden="true" /></button>;
}

export function DisplayMenu({ navigation = false }: { navigation?: boolean }) {
  const settings = useContext(DisplayContext);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const triggerRef = useRef<HTMLElement>(null);
  if (!settings) throw new Error("DisplaySettingsProvider is required");
  return <details ref={detailsRef} className="display-menu" onKeyDown={event => { if (event.key === "Escape") { detailsRef.current?.removeAttribute("open"); triggerRef.current?.focus(); } }}>
    <summary ref={triggerRef} className="icon-command" aria-label={navigation ? "เมนูผู้ป่วยเพิ่มเติม" : "เมนูเพิ่มเติม"} title={navigation ? "เมนูผู้ป่วยเพิ่มเติม" : "เมนูเพิ่มเติม"}>{navigation ? <Menu size={22} /> : <MoreHorizontal size={24} />}</summary>
    <div className="display-menu-items"><button type="button" className="command" onClick={() => { detailsRef.current?.removeAttribute("open"); if (triggerRef.current) settings.open(triggerRef.current); }}><Settings size={20} aria-hidden="true" />การแสดงผล</button></div>
  </details>;
}

function DisplayOptions() {
  const settings = useContext(DisplayContext);
  const [systemDark, setSystemDark] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  if (!settings) throw new Error("DisplaySettingsProvider is required");
  const effectiveTheme = settings.theme === "system" ? (systemDark ? "dark" : "light") : settings.theme;
  return (
    <section className="display-settings">
      <fieldset>
        <legend>ขนาดตัวอักษร</legend>
        <div className="font-size-options">
          {([
            { value: "m", label: "ปกติ" },
            { value: "l", label: "ใหญ่" },
            { value: "xl", label: "ใหญ่มาก" },
          ] as const).map(option => (
            <label key={option.value}>
              <input type="radio" name="font-size" value={option.value} checked={settings.size === option.value} onChange={() => settings.setSize(option.value)} />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>โหมดสี</legend>
        <div className="theme-options">
          {([
            { value: "light", label: "สว่าง", icon: Sun },
            { value: "dark", label: "มืด", icon: Moon },
          ] as const).map(option => {
            const Icon = option.icon;
            return (
              <label key={option.value}>
                <input type="radio" name="theme" value={option.value} checked={effectiveTheme === option.value} onClick={() => settings.setTheme(option.value)} onChange={() => settings.setTheme(option.value)} />
                <span><Icon size={18} aria-hidden="true" />{option.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <p className="display-preview">ตัวอย่างข้อความ<br />ฝึกอย่างมั่นใจ ในจังหวะของคุณ</p>
    </section>
  );
}
