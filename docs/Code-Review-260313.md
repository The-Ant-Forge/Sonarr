# Code Review — 2026-03-13

Second periodic review, focused on changes since the 2026-03-10 review: RefreshMonitoredOnly feature, UnmonitorOnDownload simplification, 8 frontend dependency removals, Twitter provider removal, deploy.sh rewrite, and 4 cherry-picked upstream commits. Covers all 26 checklist items across 5 phases per CLAUDE.md.

Architecture changes arising from implementation should be captured in `docs/Transformation-260313.md`.

## Summary Table

Findings ranked by Impact (H/M/L) then Effort (L/M/H). Deduplicated across phases.

### Lane A — Bugs & Data Safety

| # | Phase | Category | Finding | Action | Impact | Effort | Risk |
|---|-------|----------|---------|--------|--------|--------|------|
| 1.1 | P1/P4 | API v3/v5 parity | `RefreshMonitoredOnly` missing from V5 API resource — setting won't persist from UI | Add property + mapper to V5 `MediaManagementSettingsResource` | **H** | L | L |
| 1.2 | P1 | Upstream compat | `UnmonitorOnCutoffMet` DB key reused with different semantics — upgrade/rollback surprise | Use new DB key `UnmonitorOnDownload` with fresh default | **H** | L | M |
| 1.3 | P2 | Frontend hooks | `SeriesSearchInput.tsx:170` passes ref object instead of `.current` to worker | Change `requestValue` → `requestValue.current` | **M** | L | L |
| 1.4 | P2 | Error handling | `ErrorBoundaryError.tsx:43` — `info.componentStack` not null-safe in error boundary | Add optional chaining `info?.componentStack` | **M** | L | L |
| 1.5 | P4 | Logging | `DiskScanService.cs:175` — wrong stopwatch variable in log message | Change `decisionsStopwatch` → `fileInfoStopwatch` | **M** | L | L |
| 1.6 | P4 | Doc drift | `Spec-UnMonitor.md` describes cutoff check but implementation unconditionally unmonitors | Rewrite spec to match simplified behavior | **M** | L | L |
| 1.7 | P4 | Naming | `en.json:2160-2161` — loc key says "CutoffMet", display text says "On Download" | Rename key when implementing 1.2 | **M** | L | L |

### Lane B — Design & Correctness

| # | Phase | Category | Finding | Action | Impact | Effort | Risk |
|---|-------|----------|---------|--------|--------|--------|------|
| 2.1 | P1/P2/P4 | Command pipeline | `RefreshMonitoredOnly` skips unmonitored series even on manual "Refresh All" / "Rescan All" | Only filter on automatic triggers, not `CommandTrigger.Manual` | **M** | M | L |
| 2.2 | P4 | Hot-path perf | `RefreshSeriesService` + `DiskScanService` load ALL series then filter in memory | Add `GetMonitoredSeries()` to repository with DB-level filter | **M** | M | L |
| 2.3 | P2/P4 | Resource mgmt | `EpisodeService.cs:303-309` — double DB write per episode when UnmonitorOnDownload enabled | Combine into single `SetFields` call (like `ClearFileId` pattern) | **L** | L | L |
| 2.4 | P2 | Frontend hooks | `SeriesSearchInput.tsx:128-150` — `useMemo` reads `isLoading.current` but ref changes don't re-render | Convert `isLoading` to state or add parallel state variable | **L** | L | L |
| 2.5 | P1 | Deploy safety | `deploy.sh:70` — stale cleanup `*.json`/`*.xml` globs too broad | Narrow to known build-output patterns or add whitelist | **L** | L | L |

### Lane C — Structural Debt & Cleanup

| # | Phase | Category | Finding | Action | Impact | Effort | Risk |
|---|-------|----------|---------|--------|--------|--------|------|
| 3.1 | P3 | Dead dep (NuGet) | `Microsoft.Data.SqlClient 6.1.4` — zero usage, Sonarr uses SQLite+Postgres only (~5MB bloat) | Remove from `Sonarr.Core.csproj` | **M** | L | L |
| 3.2 | P3 | Dead dep (NuGet) | `System.Drawing.Common 10.0.4` — zero usage in Core; tray app gets it from WindowsForms target | Remove from `Sonarr.Core.csproj` | **M** | L | L |
| 3.3 | P3 | Dead dep (npm) | `ts-loader 9.5.4` — not in webpack config, TS uses babel-loader | Remove from devDependencies | **L** | L | L |
| 3.4 | P3 | Dead dep (npm) | `worker-loader 3.0.8` — not referenced anywhere, webpack 5 has native worker support | Remove from devDependencies | **L** | L | L |
| 3.5 | P3 | Dead dep (npm) | `@babel/plugin-syntax-dynamic-import` — built into @babel/core since 7.14, current is 7.28.5 | Remove from babel config + deps | **L** | L | L |
| 3.6 | P3 | Inconsistency | `QualityProfileItems.tsx:2` imports `react-use-measure` directly, bypassing project wrapper | Fix to use `Helpers/Hooks/useMeasure` | **L** | L | L |
| 3.7 | P3/P4 | Dead code | Twitter/X references remain: `MoreInfo.tsx:35-39` link + `"Twitter"` localization key in 14 files | Remove link and localization keys | **L** | L | L |
| 3.8 | P3 | Dead code | `SeriesIndexOverview.tsx:32` — stale comment referencing removed `react-measure` | Remove comment | **L** | L | L |

### Lane D — Test Coverage [Deferred]

| # | Phase | Category | Finding | Action | Impact | Effort | Risk |
|---|-------|----------|---------|--------|--------|--------|------|
| 4.1 | P5 | Test coverage | Zero tests for `EpisodeService.Handle(EpisodeFileAddedEvent)` — UnmonitorOnDownload untested | Create `HandleEpisodeFileAddedFixture.cs` | **H** | M | M |
| 4.2 | P5 | Test coverage | No test for "refresh all" path or `RefreshMonitoredOnly` filter in `RefreshSeriesServiceFixture` | Add fixture tests for filtered + unfiltered paths | **M** | M | L |
| 4.3 | P5 | Test coverage | No test fixture for `DiskScanService.Execute` `RescanSeriesCommand` handler | Create fixture with monitored-only + full-scan paths | **M** | M | L |
| 4.4 | P5 | Doc drift | `TODO.md:45` — deploy script testing item still unchecked | Check off or update | **L** | L | L |

### Low-Priority Notes (No Action Required)

| # | Phase | Category | Finding | Notes |
|---|-------|----------|---------|-------|
| N.1 | P2 | Concurrency | `ConfigService._cache` static dict locked on itself + reference replacement | Existing pattern, tiny race window. Future cleanup: lock on dedicated `_cacheLock` |
| N.2 | P2 | Frontend hooks | `useDebouncedCallback.ts:59` — `cancel` assigned outside useCallback | Fragile but not broken. Stable reference makes it safe today |
| N.3 | P2 | Frontend hooks | Leading+trailing debounce fires twice for single call | Standard lodash behavior. No current consumer uses both |
| N.4 | P2 | Concurrency | `parseUrl.ts` shared mutable anchor element | JS single-threaded makes this safe. `new URL()` would be cleaner |
| N.5 | P3 | Underused dep | `react-tabs 4.3.0` used in 1 file | Replaceable with ~30 lines CSS+state when editing that file |

## Detailed Findings

### 1.1 RefreshMonitoredOnly Missing from V5 API (BUG)

**Files:** `src/Sonarr.Api.V5/Settings/MediaManagementSettingsResource.cs`, `src/Sonarr.Api.V3/Config/MediaManagementConfigResource.cs:20,55`

The V3 resource correctly includes `RefreshMonitoredOnly` (property + mapper). The V5 resource has neither. Since the frontend settings page uses the V5 API, the toggle appears in the UI but changes are silently lost on save — the reflection-based `SaveSettings` builds its dictionary from resource properties, so a missing property means the value is never written.

**Fix:** Add property and mapper line to V5 resource.

### 1.2 UnmonitorOnCutoffMet DB Key Semantic Change (UPGRADE RISK)

**Files:** `src/NzbDrone.Core/Tv/EpisodeService.cs:299`, `src/NzbDrone.Core/Configuration/ConfigService.cs:94-98`

The config key `UnmonitorOnCutoffMet` was repurposed from upstream's "unmonitor when quality cutoff is met" to our "unmonitor on any download." This creates two risks:

1. **Upgrade from upstream:** Users who had this enabled (meaning "stop upgrading at cutoff") suddenly get "unmonitor every episode on download" — episodes at low quality get unmonitored with no upgrade path.
2. **Rollback to upstream:** The `true` value persists and re-enables the original cutoff behavior.

**Fix:** Create new DB key `UnmonitorOnDownload` with `default=false`. Add migration or config-level rename. Update the `ConfigService` property name, API resources (V3+V5), localization keys, and frontend bindings.

### 1.3 SeriesSearchInput Ref Bug

**File:** `frontend/src/Components/Page/Header/SeriesSearchInput.tsx:170`

In `handleSuggestionsReceived`, the else branch dispatches `{ value: requestValue, series }` to the worker — but `requestValue` is a `useRef` object, not the string. The worker receives `{ current: "..." }` as the search term instead of the string. Fuse search silently fails or returns no results.

**Fix:** Change `value: requestValue` to `value: requestValue.current`.

### 2.1 RefreshMonitoredOnly on Manual Triggers

**Files:** `src/NzbDrone.Core/Tv/RefreshSeriesService.cs:252-258`, `src/NzbDrone.Core/MediaFiles/DiskScanService.cs:312-316`

Both services apply the monitored-only filter regardless of trigger type. A user clicking "Refresh All" or "Rescan All" in the UI would silently skip unmonitored series. This is surprising — manual triggers should process everything.

**Fix:** Check `message.Trigger != CommandTrigger.Manual` before filtering. `RefreshSeriesCommand` already carries a trigger; add one to `RescanSeriesCommand` if missing.

### 2.2 Load-All-Then-Filter Pattern

**Files:** `src/NzbDrone.Core/Tv/RefreshSeriesService.cs:251`, `src/NzbDrone.Core/MediaFiles/DiskScanService.cs:310`

Both call `_seriesService.GetAllSeries()` which materializes every series with all JSON fields (Images, Actors, Genres, etc.) before filtering `.Where(s => s.Monitored)`. For large libraries this wastes memory.

**Fix:** Add `ISeriesRepository.GetMonitoredSeries()` using `Query(s => s.Monitored)` to filter at DB level.

### 3.1–3.2 Dead NuGet Dependencies

**File:** `src/NzbDrone.Core/Sonarr.Core.csproj`

- **Microsoft.Data.SqlClient 6.1.4** — Zero `using Microsoft.Data.SqlClient` anywhere. Sonarr uses SQLite + Postgres exclusively. Adds ~5MB + transitive deps.
- **System.Drawing.Common 10.0.4** — Zero `using System.Drawing` in Core. The Windows tray app gets it from its WindowsForms target.

### 3.3–3.5 Dead npm Dependencies

- **ts-loader** — Not in webpack config; TS uses babel-loader
- **worker-loader** — Not referenced; webpack 5 has native worker support
- **@babel/plugin-syntax-dynamic-import** — Built into @babel/core since 7.14

## Recommended Execution Order

### Immediate (bugs)
1. **1.1** — V5 API fix (1 file, 2 lines)
2. **1.3** — Search ref bug (1 line)
3. **1.4** — Error boundary null safety (1 character)
4. **1.5** — Wrong stopwatch (1 word)

### Short-term (design fixes)
5. **1.2 + 1.7** — New `UnmonitorOnDownload` DB key + rename loc keys
6. **2.1** — Manual trigger bypass for monitored-only filter
7. **1.6** — Rewrite spec to match implementation
8. **2.3** — Combine double DB write

### Cleanup sprint
9. **3.1–3.5** — Remove 5 dead dependencies (2 NuGet, 3 npm)
10. **3.6** — Fix useMeasure import
11. **3.7** — Remove Twitter references
12. **3.8** — Remove stale comment

### Performance
13. **2.2** — DB-level monitored series query

### Deferred (test coverage)
14. **4.1–4.3** — New test fixtures for changed services
15. **4.4** — TODO.md cleanup

## Process Notes

- Per CLAUDE.md: **do NOT implement during review**
- Review and approve findings with user
- Implement approved items in focused commits
- Re-run tests after each change
- Architecture changes → `docs/Transformation-260313.md`
