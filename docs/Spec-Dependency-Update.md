# Dependency Update Specification

**Date:** 2026-03-10
**Scope:** All NuGet (backend) and Yarn (frontend) dependencies
**Reviewed by:** Codex (GPT-5.4) on 2026-03-10 — corrections incorporated below

> **Radarr note:** Sonarr shares architecture with Radarr (forked from NzbDrone). Radarr
> completed its own dependency audit on 2026-03-08 on .NET 8. Sonarr is already on .NET 10,
> so many packages Radarr couldn't update are already at their latest here. Findings from
> Radarr's audit are referenced where they de-risk decisions.

---

## 1. Safe Updates (patch / minor — low risk)

### 1a. NuGet — Runtime Patches

These are patch bumps within the .NET 10.x track. All proven safe.

| Package | Current | Latest | Type | Projects |
|---|---|---|---|---|
| Microsoft.Extensions.DependencyInjection | 10.0.3 | 10.0.4 | Patch | Common, Core |
| Microsoft.Extensions.Hosting.WindowsServices | 10.0.3 | 10.0.4 | Patch | Common, Host |
| Microsoft.Extensions.Configuration | 10.0.3 | 10.0.4 | Patch | Core |
| Microsoft.Extensions.Logging | 10.0.3 | 10.0.4 | Patch | Core |
| Microsoft.AspNetCore.Cryptography.KeyDerivation | 10.0.3 | 10.0.4 | Patch | Core |
| Microsoft.AspNetCore.SignalR.Client | 10.0.3 | 10.0.4 | Patch | Integration.Test |
| System.Drawing.Common | 10.0.3 | 10.0.4 | Patch | Core |
| System.Configuration.ConfigurationManager | 10.0.3 | 10.0.4 | Patch | Common |
| System.ServiceProcess.ServiceController | 10.0.3 | 10.0.4 | Patch | Common |
| Swashbuckle.AspNetCore.SwaggerGen | 10.1.4 | 10.1.5 | Patch | Host |
| Swashbuckle.AspNetCore.Annotations | 10.1.4 | 10.1.5 | Patch | Api.V3, Api.V5 |
| Moq | 4.18.4 | 4.20.72 | Minor | Test.Common |

### 1b. Yarn — Runtime Patches/Minors

| Package | Current | Latest | Type |
|---|---|---|---|
| @tanstack/react-query | 5.61.0 | 5.90.21 | Minor |
| @floating-ui/react | 0.27.5 | 0.27.19 | Patch |
| @fortawesome/* (4 packages) | 7.1.0 | 7.2.0 | Minor |
| @fortawesome/react-fontawesome | 3.1.1 | 3.2.0 | Minor |
| react-focus-lock | 2.9.4 | 2.13.7 | Minor |
| use-debounce | 10.0.4 | 10.1.0 | Minor |
| zustand | 5.0.3 | 5.0.11 | Patch |

### 1c. Yarn — Tooling Patches/Minors

Separated from runtime updates because they affect build/lint behaviour, not
application code. Should be committed separately.

| Package | Current | Latest | Type |
|---|---|---|---|
| typescript | 5.7.2 | 5.9.3 | Minor |
| @typescript-eslint/eslint-plugin | 8.18.1 | 8.57.0 | Minor |
| @typescript-eslint/parser | 8.18.1 | 8.57.0 | Minor |
| webpack | 5.105.2 | 5.105.4 | Patch |
| terser-webpack-plugin | 5.3.17 | 5.4.0 | Minor |
| ts-loader | 9.5.1 | 9.5.4 | Patch |
| mini-css-extract-plugin | 2.9.1 | 2.10.1 | Minor |
| postcss | 8.4.47 | 8.5.8 | Minor |
| autoprefixer | 10.4.20 | 10.4.27 | Patch |
| core-js | 3.47.0 | 3.48.0 | Minor |
| eslint-plugin-import | 2.31.0 | 2.32.0 | Minor |
| eslint-plugin-react | 7.37.1 | 7.37.5 | Patch |
| typescript-plugin-css-modules | 5.0.1 | 5.2.0 | Minor |
| @types/lodash | 4.14.202 | 4.17.24 | Minor |
| @types/qs | 6.9.16 | 6.15.0 | Minor |

---

## 2. Major Upgrades — Breaking API Changes

These require code changes and carry risk. Each is its own work item.

### NuGet

| Package | Current | Latest | Effort | Risk | Notes |
|---|---|---|---|---|---|
| FluentValidation | 9.5.4 | 12.1.1 | Very High | Medium | 253+ files; API changes but mechanical; prioritise before NLog |
| NLog | 5.5.1 | 6.1.1 | Very High | High | 435+ files; pervasive and operationally sensitive |
| NLog.Extensions.Logging | 5.5.0 | 6.1.2 | Very High | High | Must upgrade in lockstep with NLog |
| Sentry | 5.16.3 | 6.1.0 | Medium | Medium | 16 files; integrated with NLog — do after NLog |
| NUnit | 3.14.0 | 4.5.1 | High | Medium | All test projects; broader than classic→constraint — uses `CollectionAssert`, `Assert.IsFalse`, `Assert.DoesNotThrowAsync` |
| NUnit3TestAdapter | 5.2.0 | 6.1.0 | Low | Low | Update alongside NUnit |
| FluentAssertions | 6.12.0 | 8.8.0 | High | Medium | All tests; API breaking changes |
| RestSharp | 106.15.0 | 114.0.0 | Medium | Low | 15 files; test-only |
| Selenium.Support | 3.141.0 | 4.41.0 | Medium | Low | Automation tests only |
| Microsoft.NET.Test.Sdk | 17.10.0 | 18.3.0 | Low | Low | Test infrastructure (in Directory.Build.props) |
| coverlet.collector | 6.0.4 | 8.0.0 | Low | Medium | Central props + hardcoded identity in coverlet.runsettings |

### Yarn

| Package | Current | Latest | Effort | Risk | Notes |
|---|---|---|---|---|---|
| react-router / react-router-dom | 5.2.0 | 7.13.1 | Very High | High | Do on React 18 first, before React 19 |
| React / react-dom | 18.3.1 | 19.2.4 | Very High | High | After router migration |
| redux / react-redux | 4.2.1 / 7.2.4 | 5.0.1 / 9.2.0 | Very High | High | State management layer |
| @sentry/browser | 7.119.1 | 10.43.0 | Medium | Medium | API changes but migration guide exists |
| eslint | 8.57.1 | 10.0.3 | Medium | Medium | Flat config migration |
| prettier | 2.8.8 | 3.8.1 | Low | Low | Formatting only; may change style |
| stylelint / stylelint-order | 15.6.1 / 6.0.4 | 17.4.0 / 8.0.0 | Low | Low | CSS linting config changes |
| jquery | 3.7.1 | N/A | Medium | Medium | Remove entirely (see §4.4) — data-layer refactor |
| css-loader | 6.7.3 | 7.1.4 | Medium | Medium | Build config changes |
| postcss-mixins | 9.0.4 | 12.1.2 | Medium | Medium | Major version jump |
| postcss-nested | 6.2.0 | 7.0.2 | Low | Low | Minor API changes |
| webpack-cli | 5.1.4 | 6.0.1 | Medium | Medium | CLI changes |
| postcss-loader | 7.3.0 | 8.2.1 | Low | Low | Loader config changes |

---

## 3. Already Current (no action needed)

### NuGet

| Package | Version | Notes |
|---|---|---|
| Newtonsoft.Json | 13.0.4 | Latest stable |
| Dapper | 2.1.72 | Latest stable |
| MailKit | 4.15.1 | Latest stable |
| Polly | 8.6.6 | Latest stable |
| SixLabors.ImageSharp | 3.1.12 | Latest stable |
| SourceGear.sqlite3 | 3.50.4.5 | Latest stable |
| Microsoft.Data.SqlClient | 6.1.4 | Latest stable |
| NLog.Layouts.ClefJsonLayout | 1.0.5 | Latest stable |
| NLog.Targets.Syslog | 7.0.0 | Latest stable |
| Npgsql | 10.0.1 | Latest for .NET 10 |
| FluentMigrator.Runner.* | 8.0.1 | Latest stable |
| DryIoc.dll | 5.4.3 | Latest stable |
| DryIoc.Microsoft.DependencyInjection | 6.2.0 | Latest stable |
| MiniProfiler.AspNetCore | 4.5.4 | Latest stable |
| MiniProfiler.AspNetCore.Mvc | 4.5.4 | Latest stable |
| MonoTorrent | 3.0.2 | Latest stable |
| SharpZipLib | 1.4.2 | Latest stable |
| Lib.Harmony | 2.4.2 | Latest stable |
| Equ | 2.3.0 | Latest stable |
| ImpromptuInterface | 8.0.6 | Latest stable |
| Ical.Net | 4.3.1 | Latest stable |
| NBuilder | 6.1.0 | Latest stable (test-only) |
| Openur.FFMpegCore | 5.4.0.31 | Custom Servarr build |
| Openur.FFprobeStatic | 8.0.1.302 | Custom Servarr build |
| Mono.Posix.NETStandard | 5.20.1.34-servarr24 | Custom Servarr build |

### NuGet — Pinned (keep as-is, review separately)

| Package | Version | Notes |
|---|---|---|
| System.IO.FileSystem.AccessControl | 6.0.0-preview.5.21301.5 | Preview version; used in Common, Windows, Mono — evaluate stable release |
| System.Data.SQLite | 2.0.2 | Operational; paired with SourceGear.sqlite3 |
| System.Resources.Extensions | 10.0.3 | Windows Forms entry point (Sonarr.csproj) |

### Yarn

| Package | Version | Notes |
|---|---|---|
| react-window | 1.8.11 | Latest v1 (v2 is React 19 only) |
| classnames | 2.5.1 | Latest |
| fuse.js | 7.1.0 | Latest |
| moment | 2.30.1 | Latest (maintenance mode) |
| @microsoft/signalr | 10.0.0 | Latest for .NET 10 |
| react-dnd + backends | 16.0.1 | Latest v16 |
| @babel/* | 7.28.5 | Latest |
| normalize.css | 8.0.1 | Latest |
| lodash | 4.17.23 | Latest |
| rimraf | 6.1.3 | Latest |

---

## 4. Dependency Usage Audit

### 4.1 Dead Dependencies (zero imports — remove immediately)

| Package | Listed Version | Evidence |
|---|---|---|
| react-addons-shallow-compare | 15.6.3 | Zero imports; deprecated React 15 addon |
| react-async-script | 1.2.0 | Zero imports found anywhere |

**Action:** Remove from `package.json`, run `yarn install`.

### 4.2 Deeply Integrated — Keep

These are load-bearing. Replacing them would be a rewrite, not a refactor.

| Package | Files | Role | Verdict |
|---|---|---|---|
| Newtonsoft.Json | 113+ | Primary JSON serializer, custom converters | Keep |
| FluentValidation | 253+ | Validation across all settings/entities | Keep |
| FluentMigrator | 148+ | All database migrations | Keep |
| NLog | 435+ | Logging in nearly every class | Keep |
| Dapper | 75+ | All database access via repositories | Keep |
| lodash | 185+ | Utilities (debounce, reduce, filter, merge, etc.) | Keep |
| moment | 126+ | Date handling throughout frontend | Keep |
| redux-actions | 51 | `createAction()` in all Redux action files | Keep (see §4.4) |
| react-dnd + backends | 9 | Drag-and-drop for profiles & table columns | Keep |
| react-window | 13+ | Series index table, posters, overviews | Keep |
| qs | 126+ | Query string parsing throughout frontend | Keep |

### 4.3 Moderate Integration — Keep (not worth replacing)

| Package | Files | Role | Why Keep |
|---|---|---|---|
| Sentry (.NET) | 16 | Error reporting, NLog integration | Important operational feature |
| @sentry/browser | 3 | Frontend error reporting + Redux middleware | Operational; integrates with backend Sentry |
| MailKit | 2 | Email notifications via SMTP | `System.Net.Mail.SmtpClient` is deprecated |
| SixLabors.ImageSharp | 4 | Image resizing for covers | Cross-platform; `System.Drawing` is Windows-only |
| Polly | 3 | HTTP retry with exponential backoff | Well-maintained; Radarr kept it too |
| react-tabs | 1 | Episode details modal tab UI | Used in `EpisodeDetailsModalContent.tsx` — NOT dead |
| react-slider | 1 | Quality profile range sliders | 3-thumb range slider is non-trivial to rewrite |
| react-focus-lock | 1 | Focus trap in Modal.tsx | Accessibility concern; keep |
| react-google-recaptcha | 1 | Captcha input component | Handles callback lifecycle |
| react-autosuggest | 1 | AutoCompleteInput | Works well, no simpler alternative |
| fuse.js | 6 | Fuzzy search for series search | Lightweight, well-maintained |
| @floating-ui/react | 1 | Tooltip/dropdown positioning | Modern popper replacement |
| mousetrap | 3 | Keyboard shortcuts | Small, focused library |
| zustand | 23 | Modern state management | Growing usage, replacing Redux over time |
| @tanstack/react-query | 35 | Data fetching / server state | Core data layer |
| jdu | 1 | Accent-insensitive matching in `AutoCompleteInput.tsx` | Pairs with react-autosuggest; small library |
| stacktrace-js | 1 | Renders user-visible stack traces in `ErrorBoundaryError.tsx` | Not redundant with Sentry — Sentry captures server-side; this renders client-side |
| mobile-detect | 3 | iOS detection for modal scroll-lock + mobile layout | `isIOS()` drives scroll-lock in `Modal.tsx`; simple touch detection insufficient |
| copy-to-clipboard | 1 | Clipboard fallback in `ClipboardButton.tsx` | Already used as fallback when `navigator.clipboard` unavailable; still needed |

### 4.4 Light Usage — Candidates for Inlining

#### Diacritical.Net → inline (~15 lines)

- **Used in:** 3 files (primarily `FileNameBuilder.cs`)
- **Purpose:** Strip diacritical marks (accents) from strings
- **Replacement:** `System.Globalization` — `Normalize(FormD)` + filter `NonSpacingMark`
- **Risk:** Low — proven in Radarr
- **Recommendation:** **REMOVE**

#### IPAddressRange → inline (~25 lines)

- **Used in:** 2 files (`HttpProxySettingsProvider.cs`)
- **Purpose:** Parse CIDR notation and check if IP is in range
- **Replacement:** `System.Net.IPAddress` + manual CIDR mask comparison
- **Risk:** Low — proven in Radarr
- **Recommendation:** **REMOVE**

#### filesize → inline (~15 lines)

- **Used in:** 2 files (`formatBytes.ts`, `formatBitrate.ts`)
- **Purpose:** Format byte counts for display (e.g., "1.5 GB")
- **Replacement:** Simple `const units = ['B','KB','MB','GB','TB']` formatter
- **Risk:** Low — proven in Radarr
- **Recommendation:** **REMOVE**

#### element-class → inline (~3 lines)

- **Used in:** 1 file (`Modal.tsx`)
- **Purpose:** Add/remove CSS classes on DOM elements
- **Replacement:** `document.body.classList.add/remove()`
- **Risk:** Very low
- **Recommendation:** **REMOVE**

#### react-document-title → inline (~10 lines)

- **Used in:** 2 files (`App.tsx`, `PageContent.tsx`)
- **Purpose:** Set `document.title`
- **Replacement:** `useEffect(() => { document.title = title; }, [title])` hook
- **Risk:** Very low
- **Recommendation:** **REMOVE**

#### prop-types → gradual removal

- **Used in:** 4 files (legacy code)
- **Purpose:** Runtime type checking (replaced by TypeScript)
- **Replacement:** TypeScript interfaces (already in use everywhere else)
- **Risk:** Very low
- **Recommendation:** **REMOVE** as files are touched

#### jquery → replace with fetch (data-layer refactor)

- **Used in:** 5-7 files (`createAjaxRequest.js`, `requestAction.js`, action creators)
- **Purpose:** AJAX calls (`$.ajax`, `$.param`, `$.Deferred`)
- **Replacement:** Native `fetch` + `URLSearchParams` + `Promise`
- **Complexity:** Medium — callers depend on jqXHR/Deferred-style `.done/.fail/.always`
  contract plus abort behaviour. Webpack aliasing in `webpack.config.js:54`. This is a
  small frontend data-layer refactor, not just a dependency cleanup.
- **Risk:** Medium — 28KB bundle savings
- **Recommendation:** **REMOVE** — proven in Radarr

#### redux-localstorage → replace (medium complexity)

- **Used in:** `createPersistState.js` (store enhancer)
- **Purpose:** Persist Redux state to localStorage with custom slicing and migration
- **Complexity:** Medium — current implementation includes custom path slicing, merge
  semantics, and column migration logic in `createPersistState.js`. Not a trivial swap.
- **Risk:** Medium — unmaintained since 2016
- **Recommendation:** **REMOVE** — but budget for proper replacement, not a quick inline

#### connected-react-router → defer

- **Used in:** 5 files (`App.tsx`, `bootstrap.tsx`, `middlewares.js`, `createReducers.js`)
- **Purpose:** Redux ↔ React Router sync
- **Replacement:** React Router v6 built-in patterns
- **Risk:** Tied to React Router upgrade
- **Recommendation:** **DEFER** — remove with router migration

#### redux-batched-actions → defer

- **Used in:** `createReducers.js` (reducer composition) + action creators (10+ files)
- **Purpose:** Batch Redux dispatches to prevent intermediate renders
- **Complexity:** Medium — wired into `enableBatching()` in reducer composition and
  explicitly used in action creators like `createSaveProviderHandler.js`. React 18's
  automatic batching does NOT make this obsolete because it operates at the reducer
  level, not the React render level.
- **Risk:** Medium
- **Recommendation:** **DEFER** — remove as part of Redux layer overhaul

---

## 5. Dependency Clusters

Related packages that must move together during major upgrades.

| Cluster | Packages |
|---|---|
| **React** | `react`, `react-dom`, `@types/react`, `@types/react-dom`, `react-window` (v2 needs React 19) |
| **Router** | `react-router`, `react-router-dom`, `connected-react-router`, `history`, `@types/react-router-dom` |
| **Redux** | `redux`, `react-redux`, `redux-actions`, `redux-thunk`, `reselect`, `redux-batched-actions`, `redux-localstorage`, `@types/redux-actions` |
| **NLog** | `NLog`, `NLog.Extensions.Logging`, `NLog.Layouts.ClefJsonLayout`, `NLog.Targets.Syslog` |
| **Swashbuckle** | `Swashbuckle.AspNetCore.SwaggerGen`, `Swashbuckle.AspNetCore.Annotations` |
| **Sentry** | `Sentry` (NuGet), `@sentry/browser` (Yarn) — coordinate backend + frontend |
| **Test Infra** | `NUnit`, `NUnit3TestAdapter`, `FluentAssertions`, `Microsoft.NET.Test.Sdk`, `coverlet.collector` + `coverlet.runsettings` |
| **Linting** | `eslint`, `eslint-config-prettier`, `eslint-plugin-prettier`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-import`, `eslint-plugin-simple-import-sort`, `eslint-plugin-filenames`, `prettier`, `stylelint`, `stylelint-order` |

---

## 6. Type Definition Cleanup

When removing packages, also remove corresponding `@types/*`:

| Remove Package | Also Remove |
|---|---|
| react-addons-shallow-compare | (no @types) |
| react-async-script | (no @types) |
| react-document-title | @types/react-document-title |
| prop-types | (no @types) |
| qs (if removed) | @types/qs |
| redux-actions (if removed) | @types/redux-actions |

---

## 7. Recommendations Summary

### Phase 1a: Dead Package Removal (manifest-only, no code changes)

| # | Action | Effort |
|---|---|---|
| 1 | Remove `react-addons-shallow-compare` from package.json | Trivial |
| 2 | Remove `react-async-script` from package.json | Trivial |

### Phase 1b: Inline Replacements (code changes, one file each)

| # | Action | Effort |
|---|---|---|
| 3 | Inline `element-class` → classList API in `Modal.tsx` | Trivial |
| 4 | Inline `react-document-title` → useEffect hook in `App.tsx` + `PageContent.tsx` | Trivial |
| 5 | Inline `Diacritical.Net` → `StringExtensions.RemoveAccent()` (3 files) | Low |
| 6 | Inline `IPAddressRange` → manual CIDR check (2 files) | Low |
| 7 | Inline `filesize` → custom formatter (2 files) | Low |
| 8 | Remove `prop-types` from 4 legacy files | Low |

### Phase 1c: Safe Version Bumps — NuGet

| # | Action | Effort |
|---|---|---|
| 9 | Apply all NuGet patch updates from §1a | Low |
| 10 | Update Moq 4.18 → 4.20 | Low |

### Phase 1d: Safe Version Bumps — Yarn Runtime

| # | Action | Effort |
|---|---|---|
| 11 | Apply all Yarn runtime updates from §1b | Low |

### Phase 1e: Safe Version Bumps — Yarn Tooling

| # | Action | Effort |
|---|---|---|
| 12 | Apply all Yarn tooling updates from §1c | Low |

### Phase 2: Medium Effort (one session each)

| # | Action | Effort | Notes |
|---|---|---|---|
| 13 | Replace `jquery` → `fetch` API (data-layer refactor, 7 files) | Medium | Includes jqXHR contract + webpack alias |
| 14 | Replace `redux-localstorage` → custom persistence middleware | Medium | Custom slicing + migration logic |

### Phase 3: Deferred Major Upgrades

These require dedicated migration sprints. Each should have its own spec in `docs/`.

| # | Action | Trigger / Timing | Cluster |
|---|---|---|---|
| 15 | FluentValidation 9→12 | Dedicated sprint; 253+ files; mechanical | — |
| 16 | NLog 5→6 + NLog.Extensions.Logging 5→6 | Dedicated sprint; 435+ files | NLog |
| 17 | Sentry 5→6 (.NET) + @sentry/browser 7→10 | After NLog upgrade | Sentry |
| 18 | NUnit 3→4 + FluentAssertions 6→8 + coverlet 6→8 | Test modernization sprint | Test Infra |
| 19 | RestSharp 106→114 | When overhauling integration tests | — |
| 20 | react-router 5→7 + remove connected-react-router, history | On React 18 first | Router |
| 21 | React 18→19 + react-dom | After router migration | React |
| 22 | redux 4→5 / react-redux 7→9 + redux-batched-actions + redux-actions | State management overhaul | Redux |
| 23 | eslint 8→10 + prettier 2→3 + stylelint 15→17 | Tooling modernization sprint | Linting |
| 24 | Selenium 3→4 | Automation test refresh | — |

---

## 8. Supply-Chain Reduction Summary

If all Phase 1 + Phase 2 items are completed:

- **Packages removed:** ~10 (react-addons-shallow-compare, react-async-script,
  element-class, @types/react-document-title, react-document-title, Diacritical.Net,
  IPAddressRange, filesize, jquery, redux-localstorage, prop-types)
- **Net bundle size reduction:** ~35KB+ (jquery alone is 28KB minified)
- **Supply-chain surface area:** Reduced by ~12% of production dependencies
- **Radarr parity:** Aligned with Radarr's successful inlining of Diacritical.Net,
  IPAddressRange, and filesize (we keep qs since it has 126+ imports vs Radarr's 1)

---

## 9. Execution Order

```
Phase 1a (Items 1-2)    →  yarn install  →  yarn build (verify)
Phase 1b (Items 3-8)    →  yarn build + dotnet build  →  test
Phase 1c (Items 9-10)   →  dotnet build  →  dotnet test
Phase 1d (Item 11)      →  yarn build  →  verify
Phase 1e (Item 12)      →  yarn build + yarn lint  →  verify
Phase 2  (Items 13-14)  →  yarn build + dotnet build  →  full test
Phase 3  (Items 15-24)  →  individual migration sprints with their own specs
```

Each sub-phase should be committed separately so regressions are attributable.
Phase 3 items each warrant their own specification document in `docs/`.

---

## 10. Unreviewed / Explicitly Deferred

The following packages exist in the codebase but are not targeted for changes
in this specification. They are listed here for completeness.

### NuGet — No Action

| Package | Version | Reason |
|---|---|---|
| System.IO.FileSystem.AccessControl | 6.0.0-preview.5 | Preview pin; needs separate evaluation for stable release |
| System.Data.SQLite | 2.0.2 | Operational; paired with SourceGear.sqlite3 |
| System.Resources.Extensions | 10.0.3 | Windows Forms entry point only |
| Mono.Posix.NETStandard | 5.20.1.34-servarr24 | Custom Servarr build; Linux/macOS only |
| Openur.FFMpegCore / FFprobeStatic | Custom | Custom Servarr builds |
| StyleCop.Analyzers.Unstable | 1.2.0.556 | Analyzer; no runtime impact |
| GitHubActionsTestLogger | 2.4.1 | CI-only; update with test infra |
| NunitXml.TestLogger | 3.1.20 | CI-only; update with test infra |

### Yarn — No Action

| Package | Version | Reason |
|---|---|---|
| react-measure / react-use-measure | 1.4.7 / 2.1.7 | Wrapped by useMeasure hook; working |
| @juggle/resize-observer | 3.4.0 | Polyfill; still needed for older browsers |
| react-custom-scrollbars-2 | 4.5.0 | Functional; 1 file |
| react-lazyload | 3.2.1 | Functional; 1 file |
| babel-plugin-inline-classnames | 2.0.1 | Build optimisation; working |
| babel-plugin-transform-react-remove-prop-types | 0.4.24 | Remove when prop-types removed |
| @babel/plugin-syntax-dynamic-import | 7.8.3 | Babel plugin; working |
| @babel/plugin-proposal-export-default-from | 7.27.1 | Babel plugin; working |
| css-modules-typescript-loader | 4.0.1 | Build tooling; working |
| require-nocache | 1.0.0 | Build utility; working |
| file-loader / url-loader | 6.2.0 / 4.1.1 | Webpack loaders; working |
| style-loader | 3.3.2 | Webpack loader; working |
| worker-loader | 3.0.8 | Web worker loading; working |
| filemanager-webpack-plugin | 8.0.0 | Build plugin; working |
| fork-ts-checker-webpack-plugin | 8.0.0 | Build plugin; working |
| webpack-livereload-plugin | 3.0.2 | Dev-only; working |
| eslint-config-prettier | 8.10.0 | Update with linting cluster |
| eslint-plugin-prettier | 4.2.1 | Update with linting cluster |
| eslint-plugin-filenames | 1.3.2 | Update with linting cluster |
| eslint-plugin-simple-import-sort | 12.1.1 | Update with linting cluster |
| eslint-plugin-react-hooks | 5.2.0 | Update with linting cluster |
| history | 4.10.1 | Remove with Router cluster |
| redux-thunk | 2.4.2 | Update with Redux cluster |
| reselect | 4.1.8 | Update with Redux cluster |
| react-dom | 18.3.1 | Update with React cluster |
| @types/react / @types/react-dom | 18.x | Update with React cluster |
| @types/react-router-dom | 5.3.3 | Remove with Router cluster |
| @types/redux-actions | 2.6.5 | Remove with Redux cluster |
