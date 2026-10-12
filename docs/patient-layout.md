# Patient layout and bottom navigation

## Maintenance map

- `src/components/app/shell.tsx`: `AppShell`, `.app-sidebar` wraps `.app-navigation`. The wrapper alone owns fixed positioning on mobile/touch tablets; desktop fine-pointer/hover uses a sticky sidebar.
- `src/app/system.css`: patient navigation grid, mobile/touch wrapper positioning, desktop media query and `.app-main` bottom padding. Do not reintroduce a second fixed position on the inner nav.
- `src/app/layout.tsx` and `src/app/globals.css`: root/body styles. Pages scroll through the document, not an overflow container. `.system-app` has a minimum dynamic viewport height, not a fixed scroll height.
- `AppShell` ResizeObserver measures navigation height into `--patient-navigation-height`; it changes content padding only, never the navigation position. Cleanup disconnects the observer and removes the property.

## Safe area and layout rules

Mobile/touch `.app-sidebar` uses fixed position, bottom/left/right zero, with its own opaque surface. `env(safe-area-inset-bottom)` appears inside navigation bottom padding exactly once. The measured height already includes this padding; `.app-main` adds 24px breathing room, not another safe-area inset. Desktop uses ordinary 48px content padding.

Do not add transform/filter/perspective/contain/will-change to navigation ancestors without inspecting the fixed containing block. Do not add negative bottom offsets or IP-specific styling. Browser toolbar animations and visualViewport coordinates must not be inferred from desktop viewport emulation.

## Investigation 2026-10-12

Confirmed in source: the inner navigation had an older fixed rule, superseded by a static rule in the later mobile media query; the outer sidebar was already fixed to bottom zero. Redundant positioning and duplicate mobile content-padding declarations were removed, leaving the wrapper as the sole positioning owner. No visualViewport/innerHeight scroll-position code exists in AppShell. No fixed-containing-block ancestor is declared in the patient shell/root styles. No duplicate safe-area bottom offset was found.

These findings do **not** prove the redundant rules caused the reported physical-iPad gap: their computed result already resolved to fixed wrapper/static child. The actual iPad browser-toolbar symptom remains unconfirmed locally; CSS cleanup must not be reported as a verified device fix.

## Verification on real devices

Open a long patient page in Chrome and Safari, portrait and landscape. Scroll top → middle → end → back to top with the browser toolbar expanded and collapsed. Check the nav background meets the visible bottom edge, all final-page controls remain reachable, and safe-area space is inside its background. Repeat after refresh, navigation and all font sizes. Desktop retains the sidebar.

If a gap remains, capture `innerHeight`, `document.documentElement.clientHeight`, `visualViewport.height/offsetTop/scale` and `.app-sidebar.getBoundingClientRect()` at each state using remote inspection before choosing a viewport workaround. Also inspect computed ancestor transform/filter/perspective/contain/will-change and document scrollingElement. Do not claim a browser-engine cause from a screenshot alone.

## Real-device debug panel (2026-10-12)

Development only: open the existing patient URL with `?debugNav=1`, for example `http://<computer-LAN-IP>:3000/patient?debugNav=1` (or the project's existing HTTPS origin). If the URL already has query parameters, append `&debugNav=1`. It is not an authentication bypass: patient login/session remain required. Production and doctor/camera pages never mount the panel. Remove the query to disable it. It also responds to client navigation/query changes.

1. At the top of a long page while the nav is correct, tap **ปกติ**.
2. Scroll until the visible bottom gap appears, then tap **ลอย** without changing orientation or reloading.
3. Tap **คัดลอกข้อมูล** and paste the full JSON back into the conversation. Both snapshots and latest live data are included. On HTTP LAN origins/iPad Clipboard API may be unavailable: a read-only text field appears; long-press, Select All and Copy manually.
4. Repeat separately in Chrome/Safari and portrait/landscape, noting whether the browser toolbar was expanded or collapsed. Snapshots live only in component memory; refresh/route change clears them. Copy before leaving the page.

Implementation:

- `src/components/app/nav-debug.tsx`: `NavDebug`, `capture`, `scrollContainers`, `styles`. A body portal renders a small fixed top panel after hydration; no nav bottom/transform writes, no scrolling commands or overflow locks.
- `AppShell` mounts it only in development for non-camera patient routes, inside a local Suspense boundary for useSearchParams. Server/initial client output is null, while the patient page retains its existing SSR/layout.
- `next.config.ts` exports only `NEXT_PUBLIC_NAV_DEBUG_BUILD_ID`: nav-debug implementation version plus development config evaluation timestamp. This identifies the dev configuration run, not a git commit or an individual HMR compilation. Restart development if the identifier is unavailable. Production exports no diagnostic ID.
- Events: passive window scroll/resize, visualViewport scroll/resize if available, detected scroll containers' scroll events, and navbar ResizeObserver. requestAnimationFrame coalesces/throttles captures to approximately 6.7 updates/second (150ms); it is idle between events. Cleanup removes listeners, observer, pending animation frame and safe-area probe.
- Scroll detection checks nav/main ancestry for genuinely overflowing auto/scroll containers and includes document.scrollingElement. The report lists candidates with documentScroller flag, scrollTop/clientHeight/scrollHeight and styles. It never labels a missing container based on speculation; a new overflow main container is discovered on the next geometry event.
- `navbar` is the positioning owner `.app-sidebar`; `navigationMenu` records the inner `.app-navigation` styles separately so safe-area padding can be distinguished from wrapper offsets.
- Probe is invisible, fixed, noninteractive and outside document flow; its computed padding-bottom resolves env(safe-area-inset-bottom). No nav transform/position is added by debugging.

Collected: redacted URL, public build identifier, UA, innerHeight/innerWidth, document clientHeight, window scrollY, scroll container values, visualViewport height/offsetTop/pageTop/scale, wrapper top/bottom/height/styles, safe-area value, and ancestor styles (including filter/backdrop-filter/perspective/contain/will-change/overflow).

`layoutGap = innerHeight - navbar.rect.bottom`; `visualGap = visualViewport.offsetTop + visualViewport.height - navbar.rect.bottom`. Missing visualViewport is reported as **ไม่รองรับ**, not zero. A positive gap is a measured coordinate difference, not by itself proof of a browser cause.

Privacy: query parameters/hash are discarded except the fixed debug flag; unrecognized route segments are redacted. No cookies, session/token/localStorage, form values, DOM text, patient object, element IDs or arbitrary class names are read/exported. No automatic upload or database write occurs. Reported URLs are deliberately not the full original URL.

### Audit of existing movement code

`src/components/app/shell.tsx` AppShell's ResizeObserver callback `update` writes only `--patient-navigation-height` for content padding. It does not set bottom or transform. `src/app/system.css` defines fixed bottom/left/right zero on the touch/mobile wrapper and sticky desktop sidebar; no scroll-dependent positioning rule was found. `src/components/app/pose-camera.css` hides the sidebar on camera routes; video/canvas mirroring transforms do not apply to Navbar ancestors. `display-settings.tsx` temporarily locks body overflow while its existing modal is open; close settings before capturing comparable snapshots. No existing visualViewport/innerHeight position-adjustment JavaScript was found. The new debug listeners read geometry only. Root cause remains unconfirmed until physical-device snapshots are compared.

### Checks

Browser harness `scripts/test-nav-debug-browser.js` uses the Playwright CLI run-code function format, with `/*ACCOUNTS*/` substituted only into a temporary ignored file by the local managed-demo launcher. Do not print or commit that file/credentials. Chromium verifies flag on/off, direct reload/client navigation, snapshots, equations, privacy, viewport resize, identical page/nav geometry and clipboard fallback. Desktop emulation cannot reproduce physical iPad toolbar behavior completely.

Verified debug implementation: Chromium 46 checks (mobile/iPad portrait/landscape emulation), lint/typecheck/production build passed. Authenticated production patient page with debugNav=1 showed no panel; temporary production server was stopped afterward. Physical iPad and Chrome/Safari toolbar geometry remain to collect, not claimed verified.
