"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useSearchParams } from "next/navigation";

const intervalMs = 150;
const allowedSegments = new Set(["patient", "exercises", "progress", "profile", "plan", "camera", "guide", "edit", "password", "results"]);

// Do not collect DOM text, IDs, cookies or arbitrary query parameters.
function elementName(element: Element) {
  return element.tagName.toLowerCase() + ["system-app", "patient-app", "app-sidebar", "app-navigation", "app-main"]
    .filter(name => element.classList.contains(name)).map(name => `.${name}`).join("");
}

function styles(element: Element) {
  const s = getComputedStyle(element);
  return { position: s.position, bottom: s.bottom, transform: s.transform,
    marginBottom: s.marginBottom, paddingBottom: s.paddingBottom, zIndex: s.zIndex,
    filter: s.filter, backdropFilter: s.backdropFilter, perspective: s.perspective,
    willChange: s.willChange, contain: s.contain, overflow: s.overflow,
    overflowX: s.overflowX, overflowY: s.overflowY };
}

function scrollContainers(nav: Element) {
  const containers: Element[] = [];
  // The document is normally the scroller. Also inspect main's ancestry, since
  // a fixed nav is not necessarily a descendant of an overflow content scroller.
  for (const start of [nav, document.querySelector(".patient-app .app-main")]) {
    for (let p = start; p; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (/(auto|scroll|overlay)/.test(s.overflowY) && p.scrollHeight > p.clientHeight + 1 && !containers.includes(p)) containers.push(p);
    }
  }
  const documentScroller = document.scrollingElement;
  if (documentScroller && !containers.includes(documentScroller)) containers.push(documentScroller);
  return containers;
}

function capture(nav: HTMLElement, probe: HTMLElement, trigger: string) {
  const rect = nav.getBoundingClientRect(), vv = window.visualViewport;
  const menu = nav.querySelector(".app-navigation");
  const containers = scrollContainers(nav);
  const ancestors = [];
  for (let p = nav.parentElement; p; p = p.parentElement) ancestors.push({ element: elementName(p), styles: styles(p) });
  const path = location.pathname.split("/").map(s => !s || allowedSegments.has(s) ? s : "[redacted]").join("/");
  return {
    timestamp: new Date().toISOString(), trigger,
    url: `${location.origin}${path}?debugNav=1`, urlRedacted: true,
    buildIdentifier: process.env.NEXT_PUBLIC_NAV_DEBUG_BUILD_ID ?? "development / nav-debug-v1 (identifier unavailable)",
    userAgent: navigator.userAgent,
    window: { innerHeight: window.innerHeight, innerWidth: window.innerWidth, scrollY: window.scrollY },
    document: { clientHeight: document.documentElement.clientHeight, scrollingElement: document.scrollingElement ? elementName(document.scrollingElement) : null },
    scrollContainers: containers.map(p => ({ element: elementName(p), documentScroller: p === document.scrollingElement,
      scrollTop: p.scrollTop, scrollHeight: p.scrollHeight, clientHeight: p.clientHeight, styles: styles(p) })),
    visualViewport: vv ? { height: vv.height, offsetTop: vv.offsetTop, pageTop: vv.pageTop, scale: vv.scale } : "ไม่รองรับ",
    navbar: { element: elementName(nav), rect: { top: rect.top, bottom: rect.bottom, height: rect.height }, styles: styles(nav) },
    navigationMenu: menu ? { element: elementName(menu), styles: styles(menu) } : null,
    safeAreaInsetBottom: parseFloat(getComputedStyle(probe).paddingBottom), ancestors,
    layoutGap: window.innerHeight - rect.bottom,
    visualGap: vv ? vv.offsetTop + vv.height - rect.bottom : "ไม่รองรับ",
  };
}

type Snapshot = ReturnType<typeof capture>;

export function NavDebug() {
  const path = usePathname();
  const search = useSearchParams();
  const [live, setLive] = useState<Snapshot | null>(null);
  const [snapshots, setSnapshots] = useState<Partial<Record<"ปกติ" | "ลอย", Snapshot>>>({});
  const [copyStatus, setCopyStatus] = useState("");
  const captureRef = useRef<((trigger: string) => Snapshot) | null>(null);
  const exportRef = useRef<HTMLTextAreaElement>(null);
  const [manualCopy, setManualCopy] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || search.get("debugNav") !== "1") return;
    const nav = document.querySelector<HTMLElement>(".patient-app .app-sidebar");
    if (!nav) return;
    const probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = "position:fixed;visibility:hidden;pointer-events:none;width:0;height:0;bottom:0;padding-bottom:env(safe-area-inset-bottom,0px)";
    document.body.append(probe);
    let frame = 0, last = -Infinity, trigger = "initial";
    const cleanups: Array<() => void> = [];
    const watched = new Set<Element>();
    const listen = (target: EventTarget, name: string, callback: EventListener) => {
      target.addEventListener(name, callback, { passive: true });
      cleanups.push(() => target.removeEventListener(name, callback));
    };
    const read = (source: string) => capture(nav, probe, source);
    captureRef.current = read;
    const tick = (now: number) => {
      if (now - last < intervalMs) { frame = requestAnimationFrame(tick); return; }
      frame = 0; last = now;
      for (const container of scrollContainers(nav)) {
        if (!watched.has(container)) {
          watched.add(container);
          listen(container, "scroll", () => schedule("scroll-container.scroll"));
        }
      }
      setLive(read(trigger));
    };
    const schedule = (source: string) => { trigger = source; if (!frame) frame = requestAnimationFrame(tick); };
    listen(window, "scroll", () => schedule("window.scroll"));
    listen(window, "resize", () => schedule("window.resize"));
    if (window.visualViewport) {
      listen(window.visualViewport, "scroll", () => schedule("visualViewport.scroll"));
      listen(window.visualViewport, "resize", () => schedule("visualViewport.resize"));
    }
    const observer = new ResizeObserver(() => schedule("navbar.resize"));
    observer.observe(nav);
    schedule("initial");
    return () => {
      cleanups.forEach(cleanup => cleanup()); observer.disconnect(); cancelAnimationFrame(frame);
      probe.remove(); captureRef.current = null;
    };
  }, [path, search]);

  if (process.env.NODE_ENV !== "development" || search.get("debugNav") !== "1" || !live) return null;
  const exported = JSON.stringify({ tool: "MoRe nav-debug-v1", live, snapshots }, null, 2);
  const save = (label: "ปกติ" | "ลอย") => {
    const snapshot = captureRef.current?.(`snapshot:${label}`);
    if (snapshot) setSnapshots(previous => ({ ...previous, [label]: snapshot }));
  };
  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(exported);
      setCopyStatus("คัดลอกแล้ว"); setManualCopy(false);
    } catch {
      // HTTP LAN origins may block Clipboard API: select text for manual copy.
      setManualCopy(true); setCopyStatus("แตะช่องข้อมูล แล้วเลือกทั้งหมดและคัดลอก");
      requestAnimationFrame(() => { exportRef.current?.focus({ preventScroll: true }); exportRef.current?.select(); });
    }
  };
  return createPortal(<aside className="nav-debug-panel" aria-label="Debug Bottom Navbar">
    <strong>Navbar debug</strong> <span>layoutGap: {live.layoutGap.toFixed(1)} · visualGap: {typeof live.visualGap === "number" ? live.visualGap.toFixed(1) : live.visualGap}</span>
    <div className="nav-debug-actions">
      <button type="button" onClick={() => save("ปกติ")}>ปกติ{snapshots.ปกติ ? " ✓" : ""}</button>
      <button type="button" onClick={() => save("ลอย")}>ลอย{snapshots.ลอย ? " ✓" : ""}</button>
      <button type="button" onClick={copy}>คัดลอกข้อมูล</button>
    </div>
    <small role="status">{copyStatus}</small>
    <details><summary>ข้อมูลสด / snapshot</summary><pre>{exported}</pre></details>
    {manualCopy && <textarea ref={exportRef} aria-label="ข้อมูลสำหรับคัดลอก" readOnly value={exported} />}
  </aside>, document.body);
}
