# Plan picker hydration investigation — 2026-10-07

Installed versions: Next.js 16.3.8, React/React DOM 19.2.8 (`package.json`). Read the installed Next.js server/client boundary and hydration guidance before changing the components. This investigation concerns `/patient/plan` / `TrainingPlanSelection`, not camera processing or the test-only `CameraTestPlan` screen.

## Evidence and cause

- Case-insensitive `rg` searches found no runtime app code or installed dependency JS/TS/TSX/MJS/JSON creating `__gCrUniqueID`, `__gCrRemoteFrameToken`, or the reported `__gcremoteframetoken` spelling. Existing documentation and the earlier Login hydration test mention/inject only the Autofill field ID; that test is not served to application users.
- Chromium's iOS Autofill [constants](https://raw.githubusercontent.com/chromium/chromium/main/components/autofill/ios/form_util/resources/fill_constants.ts) define `__gCrUniqueID`. Its [renderer ID implementation](https://raw.githubusercontent.com/chromium/chromium/main/components/autofill/ios/form_util/resources/renderer_id.ts) writes the ID to DOM attributes. Its [frame-token implementation](https://raw.githubusercontent.com/chromium/chromium/main/components/autofill/ios/form_util/resources/fill_util.ts) defines `__gCrRemoteFrameToken` and explicitly calls `document.documentElement.setAttribute(...)`.
- HTML attribute names are lowercased in the HTML DOM. The canonical frame spelling is therefore `__gcrremoteframetoken`, with two adjacent `r` characters. The user's written `__gcremoteframetoken` omits one `r`; both spellings were simulated, without claiming Chromium produces the shortened spelling. The original physical-device DOM was not accessible to confirm the spelling or timing on that device.
- Before changing app code, a controlled Chromium test blocked all external client scripts, captured the actual document response, and compared every attribute of `<html>` and the search input with the parsed DOM before releasing hydration. They matched exactly. Neither Chrome attribute was in server HTML. The input had the expected empty initial value.
- Clean light/m, dark/xl and system/l with dark OS preference had no hydration warnings. Adding the frame-token attribute to `<html>` and the field ID to the search input before releasing client scripts reproduced two hydration warnings containing both attribute names. This isolates the reported mechanism from app-generated initial markup differences; it does not reproduce a native Chrome iPad Autofill implementation.

Root theme/font values come from cookies via `parseTheme`/`parseFontSize` on the server and are passed to `useState(initial...)` in the provider. `matchMedia` is read only inside `useEffect` for the settings dialog's effective system theme. Search starts from `useState("")`. No initial-render `localStorage`, browser/device branch, `Date.now()` or random value was found in the affected root/search path. Dates elsewhere in Home are not rendered by the plan picker. Theme/font/search initialization did not need changing.

## Scoped compatibility change

- `src/app/layout.tsx`: `suppressHydrationWarning` only on `<html>`, with the Chrome frame-token reason documented. It does not suppress descendant element mismatches.
- `src/components/app/training-views.tsx`: `suppressHydrationWarning` only on TrainingPlanSelection's search input, with the Autofill ID reason documented.
- `scripts/test-plan-hydration-browser.js` and `test-plan-hydration.mjs`: regression evidence for SSR/pre-hydration DOM equality, clean browsers, controlled injection and real plan/search/preference interactions. The runner privately uses an existing synthetic Demo account, authenticates once per run to respect the login limit, and saves the already-selected template without replacing its plan. No credentials/session HTML are printed or committed; temporary injected runner code is removed in finally.

This is a browser compatibility escape hatch, not a repair to SSR/theme logic and not an attribute-name filter. React suppresses all hydration attribute mismatches on each marked element. Separate explicit checks compare application-owned attributes, and a negative-control mismatch on the search label still emits a warning, proving descendants/sibling elements are not silenced. See [React's limitation](https://react.dev/reference/react-dom/client/hydrateRoot#suppressing-unavoidable-hydration-mismatch-errors).

SSR remains enabled. No console interception in application code, browser-attribute removal script, Autofill disabling, framework/schema change or broad component-tree suppression was added. Existing Login suppression is unchanged. The pre-existing camera-mode work remains separate from this fix.

## Verification

- Before change: Chromium baseline 71 checks. Clean cases: zero hydration warnings; each injected-attribute case: two warnings; unsuppressed search-label negative control: one warning.
- After change: Chromium **66 checks** and desktop WebKit **66 checks**. Clean and injected cases: zero hydration warnings; search-label negative control: one expected warning in each browser.
- Covered direct authenticated `/patient/plan`, reload, Home → exercises → plan navigation, search/no-match/reset, saving the current plan through the real API (same plan ID), theme/font interaction and cookie persistence after reload. Viewport 820 × 1180 is an automated tablet-sized browser, not a physical iPad.
- `npx.cmd tsc --noEmit`, `npm.cmd run lint`, `npm.cmd run build` passed. No production/data schema changes, commits or pushes.
- Used the local Demo server on `http://localhost:3001` to exercise this picker independently of the user's server on port 3000. `camera:test` shows a different test-only form without this search input; use `npm.cmd run demo` for this regression.

To rerun with the existing seeded Demo account/active plan:

```powershell
npm.cmd run demo
# In another terminal
npx.cmd --yes --package @playwright/cli playwright-cli -s=more-hydration open http://localhost:3001
node scripts/test-plan-hydration.mjs
npx.cmd --yes --package @playwright/cli playwright-cli -s=more-hydration-webkit open http://localhost:3001 --browser webkit
$env:HYDRATION_SESSION='more-hydration-webkit'
node scripts/test-plan-hydration.mjs
```

The runner's `--baseline` option expects the original unsuppressed warnings and was used only before the patch. It is not a passing mode after this change.

## Physical iPad follow-up

Physical Chrome/Safari on iPad and the native injection timing remain unverified. After the device loads the updated development build:

1. Open the same `http://192.168.1.92:3000/patient/plan` route in Chrome and Safari with the same test account. Keep the current flags consistent so both show TrainingPlanSelection, not CameraTestPlan.
2. In each browser, open the route directly, reload twice, and enter it through Home → exercises → manage plan. Check that the Next.js mismatch overlay no longer appears.
3. Search for an existing plan, search for a nonexistent name, clear the query, select/save a test plan, and check the selected plan after reload. Confirm light/dark/system and all font sizes still behave normally.
4. If a mismatch remains, capture its exact attribute diff and browser/version. A new mismatch on another element or application-owned attribute needs investigation; do not expand suppression automatically. Safari comparison helps distinguish Chrome-specific injection, but does not establish the cause of an unrelated mismatch.
