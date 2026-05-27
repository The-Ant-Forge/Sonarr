# Spec: React Router v7 Migration & Frontend Catch-up

**Status:** Draft — pending approval
**Branch:** `v5-develop`
**Date:** 2026-05-27
**Strategy:** Hybrid — PR 1 = React Router v5→v7 alone (paradigm shift), PR 2 = bundled react-query migrations + supporting v5 endpoints

---

## 1. Why

Our frontend has diverged from upstream Sonarr/Sonarr v5-develop on three axes:

1. **Stack modernization we did unilaterally** — ESLint 9, Prettier 3, Stylelint 17, Sentry 10, removed jQuery / mobile-detect / redux-localstorage / 8+ runtime deps. These move us _ahead_ of upstream.
2. **Our user-facing features** — Quality Profile size UX, `UnmonitorOnDownload`, quality-cutoff monitoring, security/correctness fixes. Small surface (≤6 commits total touching ≤15 frontend files).
3. **Migrations upstream did that we _haven't_** — React Router v5→v7 (single commit `b4b415731`); migrations to `@tanstack/react-query` for Delay Profiles, Custom Formats, Import Lists, Import List Options, Import List Exclusions, Auto Tagging, Indexer Options, Indexer Flags.

If we don't catch up, every future upstream cherry-pick that touches a migrated area becomes a manual re-port. The cost grows monthly. This spec covers catching up via two reviewable PRs.

## 2. Strategy: Hybrid two-PR approach

| PR | Scope | Why |
|---|---|---|
| **PR 1** | React Router v5 → v7 only | Biggest paradigm shift; deserves an isolated review and revertable PR. Cleanly establishes the new routing surface (data routers, no `connected-react-router`/`history`) before anything else changes. |
| **PR 2** | All seven react-query migrations + matching v5 API endpoints | Same mechanical pattern repeated. Easier to review as one batch because the diff form is identical across features. |

Rejected alternatives:
- **Big-bang (one PR)** — diff too large to review, hard to bisect regressions, freezes other frontend work for the duration.
- **Per-feature staged (one PR per react-query feature)** — too many rebases against upstream; the migrations are mechanically identical, so splitting them adds review overhead without reducing risk.

## 3. Inventory of our divergence (from `git log --author="The Ant Forge"`)

Areas we touched that the migration may hit. Detail captured in git history; this is a high-level map for risk assessment.

| Area | Commits | Frontend files | Overlap with upstream migrations |
|---|---|---|---|
| Quality Profile size UX | 3 | ~12 in `Settings/Profiles/Quality/` | None — UI-only |
| `UnmonitorOnDownload` / cutoff | 2 | `Settings/MediaManagement/` | None |
| jQuery / dep removal | 9 | ~25 across `OAuth/`, `Helpers/`, `Components/` | None (we're ahead) |
| Build/lint upgrades | 3 | ~70 reformatted files | None |
| Code review cleanups | 5 | ~12 across `Series/`, `AddSeries/`, etc. | Light |
| Security/infra | 3 | `SignalRListener.tsx`, `App.tsx`, `Modal.tsx` | None |

**Routing-critical files (matters for PR 1):**
- `App/App.tsx` — currently uses `ConnectedRouter` from `connected-react-router`. We removed PropTypes here in `c02cb2000` but didn't touch routing logic.
- `App/Select/SelectContext.tsx`, `App/State/*.ts`, `App/appStore.ts` — only formatting changes in `7251abb36`.

**Lazy-route audit (resolved):** zero hits for `React.lazy`, `Suspense`, or dynamic `import()` for routes. The only dynamic import in the codebase is `await import('./bootstrap')` in `frontend/src/index.ts` (entrypoint bootstrap, unrelated to routing). All 37 routes in `App/AppRoutes.tsx` use eager `<Route component={X}>` declarations. The v7 port is purely mechanical:

- `<Route component={X}>` → `<Route element={<X />} />`
- `<Switch>` → `<Routes>`
- `<Redirect>` → `<Navigate>`
- `useHistory().push()` → `useNavigate()(path)`
- `useRouteMatch()` → `useMatch()`
- `match.params` → `useParams()`

**Conclusion:** Our diverged work and upstream's React Router migration almost don't overlap. The migration risk is mostly mechanical (porting our route definitions to v7's API), not semantic conflicts.

## 4. PR 1 — React Router v5 → v7

### 4.1 Pre-work

- [ ] Read upstream commit `b4b415731 Upgrade React Router from v5 to v7` end-to-end (`git show b4b415731 --stat`)
- [ ] Identify every file in our tree that imports `react-router`, `react-router-dom`, `connected-react-router`, or `history`
- [ ] Capture each as a porting target (file + import + usage pattern)
- [ ] Confirm `@tanstack/react-query` 5.100.5 (our version) is compatible with React Router 7.x

### 4.2 Scope

- Bump `react-router` and `react-router-dom` from `5.2.0` → `7.x` (match upstream)
- Remove `connected-react-router` and `history` from `package.json`
- Migrate routing definitions to v7's `createBrowserRouter` / data-router API
- Update redux store to no longer house the router state (no more `connectedRouterReducer`)
- Replace all `useHistory`, `useRouteMatch`, `<Switch>`, `<Route component={X}>` usages with v7 equivalents
- Ensure `App.tsx` no longer wraps in `ConnectedRouter`

### 4.3 Risk areas

| File / area | Concern |
|---|---|
| `App/App.tsx` | Highest-touch routing setup; will need substantial rewrite. Our PropTypes cleanup may need to be re-applied. |
| Pages using `useHistory().push()` for redux-aware navigation | v7 uses `useNavigate()` + `useNavigation()` differently |
| Any `<Redirect>` usage | Replaced with `<Navigate>` in v7 |
| Lazy-loaded route components | v7 supports this differently; may need refactor |
| Tests that rely on `MemoryRouter` from v5 | API likely renamed/restructured |

### 4.4 Execution checklist

- [ ] Branch from `v5-develop`: `feat/react-router-v7`
- [ ] Cherry-pick upstream `b4b415731` (expect heavy conflicts; resolve file-by-file)
- [ ] Resolve conflicts by **keeping upstream's routing code**, then re-applying our PropTypes/Modal cleanups on top
- [ ] Update `package.json`: bump `react-router`/`react-router-dom`, remove `connected-react-router` + `history`, then `yarn install`
- [ ] Run `yarn lint --fix`
- [ ] Run `yarn build` (must succeed)
- [ ] Run backend build (it shouldn't be affected, but verify): `dotnet build src/Sonarr.sln -c Release`
- [ ] Manually exercise: navigation to `/series`, `/calendar`, `/activity`, `/wanted/*`, `/settings/*`, deep links, browser back/forward, refresh on a non-root URL
- [ ] Verify deep link with query string preserves state
- [ ] Open PR; ensure CI green
- [ ] If staying inside this fork's scope only: skip CI workflow concerns; otherwise note workflows are currently disabled (per `docs/TODO.md`)

### 4.5 Validation gates (static)

PR 1 must pass all of:
- [ ] `yarn build` succeeds with no warnings
- [ ] `yarn lint` passes
- [ ] `dotnet build src/Sonarr.sln -c Release` succeeds with 0 warnings, 0 errors
- [ ] `dotnet test src/Sonarr.sln -c Release --no-build` shows 5,682+ tests pass, 0 fail
- [ ] Grep confirms no remaining imports: `react-router` v5 patterns, `connected-react-router`, `history` (apart from React's own history API)

### 4.6 Smoke test plan (executable via Playwright MCP)

Sonarr listens on `http://localhost:9103` after `bash deploy.sh` + `Sonarr.Console.exe -data="D:\Apps\Sonarr"`. Each step is a discrete browser interaction I (Claude) can drive via the Playwright MCP tools and capture a snapshot or screenshot for. A test passes when the listed assertion holds.

**Setup**

1. `bash deploy.sh` → wait for build, then start Sonarr in console mode in the background
2. `browser_navigate http://localhost:9103` → wait for app shell to render
3. `browser_snapshot` → assert sidebar nav is visible and contains "Series", "Calendar", "Activity", "Wanted", "Settings", "System"

**Test 1 — Top-level nav (each link loads the right page)**

For each path: navigate via sidebar click, then assert.

| Step | Action | Assertion |
|---|---|---|
| 1.1 | Click "Series" | URL = `/`, page heading "Series" visible |
| 1.2 | Click "Calendar" | URL = `/calendar`, calendar grid renders |
| 1.3 | Click "Activity" → submenu "Queue" | URL = `/activity/queue`, queue table renders (may be empty) |
| 1.4 | Click "Activity" → "History" | URL = `/activity/history`, history table renders |
| 1.5 | Click "Activity" → "Blocklist" | URL = `/activity/blocklist`, blocklist table renders |
| 1.6 | Click "Wanted" → "Missing" | URL = `/wanted/missing`, missing table renders |
| 1.7 | Click "Wanted" → "Cutoff Unmet" | URL = `/wanted/cutoffunmet`, table renders |
| 1.8 | Click "Settings" | URL = `/settings`, settings index renders |
| 1.9 | Click "System" → "Status" | URL = `/system/status`, status page renders with backend version |

**Test 2 — Deep links + browser navigation (the highest router-migration risk)**

| Step | Action | Assertion |
|---|---|---|
| 2.1 | `browser_navigate /settings/profiles` directly (no prior nav) | Profiles settings page renders, sidebar "Settings" is highlighted |
| 2.2 | `browser_navigate /settings/quality` directly | Quality settings page renders |
| 2.3 | `browser_navigate /settings/mediamanagement` directly | MediaManagement page renders, includes our `UnmonitorOnDownload` toggle |
| 2.4 | `browser_navigate /system/logs/files` directly | Logs file page renders |
| 2.5 | `browser_navigate /nonsense-path-that-does-not-exist` | NotFound page renders (not blank screen, not error) |
| 2.6 | After 2.5, click `browser_navigate_back` | Returns to previous page intact |
| 2.7 | Navigate Series → Calendar → Series, click browser back | Should be on Calendar |
| 2.8 | Refresh on `/calendar` (`browser_navigate` to same URL) | Calendar page re-renders cleanly, no 404 |
| 2.9 | `browser_navigate /series/some-existing-titleslug` (use whatever exists in test DB; if empty, skip) | Series details renders OR redirects to series index if no match |

**Test 3 — Query string + state preservation**

| Step | Action | Assertion |
|---|---|---|
| 3.1 | `browser_navigate /activity/queue?page=1&pageSize=20` | Queue renders, query params preserved in URL after settle |
| 3.2 | Click into a sort header to change sort | URL updates with sort param, no full reload |
| 3.3 | `browser_navigate_back` | Returns to previous sort state |

**Test 4 — Our diverged features still work**

These are antforge-only features that must not regress with the router upgrade.

| Step | Action | Assertion |
|---|---|---|
| 4.1 | `browser_navigate /settings/mediamanagement` | "Unmonitor on Download" toggle present and clickable |
| 4.2 | `browser_navigate /settings/profiles`, click on a quality profile to edit | Quality profile edit modal opens; size editor (our UX work) renders |
| 4.3 | `browser_navigate /add/new`, type a series name in the search input | Search input retains focus after clearing (our `9c89d4416` fix) |

**Test 5 — Console + network sanity**

| Step | Action | Assertion |
|---|---|---|
| 5.1 | After full test run: `browser_console_messages` | Zero `error` or `warn` entries beyond known noise. Capture any new ones. |
| 5.2 | `browser_network_requests` | No 4xx/5xx on routing-related requests (HTML, JS chunks, /api/v5/series, /api/v5/calendar) |

**Failure handling**

Any assertion failure → capture `browser_take_screenshot` + `browser_console_messages`, attach to PR description, do not merge.

### 4.7 Rollback

PR is a single commit (or one commit + minimal port-back commits). To roll back: `git revert` the merge commit. The dropped `connected-react-router` / `history` packages need to be re-added to `package.json` manually if rolled back after `yarn install`.

## 5. PR 2 — React-query migrations bundle

### 5.1 Scope

Cherry-pick (or re-implement) these upstream commit pairs in order. Each pair is: **(a) add v5 backend endpoint**, **(b) migrate frontend to react-query against that endpoint**. They must land together — the frontend migration depends on the v5 endpoint existing.

| # | Backend endpoint commit | Frontend react-query commit | Feature |
|---|---|---|---|
| 1 | `b0fac1529` already-applied? confirm | `b0fac1529 (paired)` | Import List Exclusions |
| 2 | `5b79ee6d1` | `7a455dd0f` | Indexer Options |
| 3 | (paired with above) | `fbb70519b` | Indexer Flags |
| 4 | `f10e99f13` | `ba7b6b039` | Import List Options |
| 5 | `bdd04d7dc` | `75d1a9588` | Import Lists |
| 6 | `c5a013035` | `06aa7d570` | Custom Formats |
| 7 | `69069248e` | `0ebda892b` | Auto Tagging |
| 8 | `8bced0351` | `ed1d92c50` | Delay Profiles |

Verify the actual list against `git cherry -v v5-develop upstream/v5-develop` at the time of PR 2 — some may already be partly applied if we pick up more upstream commits between PR 1 and PR 2.

### 5.2 Pre-work

- [ ] Confirm PR 1 has merged and `v5-develop` builds cleanly
- [ ] Re-run `git cherry -v v5-develop upstream/v5-develop` to refresh the list above
- [ ] For each migration, identify whether **we have any antforge-only commit touching the same file** (per inventory: low likelihood, except possibly Quality Profiles which is NOT in this list — confirmed safe)

### 5.3 Execution checklist (per feature)

For each of the 8 features, in the order above:

- [ ] Cherry-pick the **backend endpoint** commit first
- [ ] Cherry-pick the **react-query migration** commit
- [ ] If conflicts: resolve favoring upstream's new pattern; re-apply our changes if any (highly unlikely per inventory)
- [ ] After each pair: `yarn lint --fix && yarn build && dotnet build src/Sonarr.sln -c Release`
- [ ] Continue to next pair

### 5.4 Validation gates (static)

PR 2 must pass all of:
- [ ] `yarn build` succeeds
- [ ] `yarn lint` passes
- [ ] All backend tests pass (`dotnet test ... 5,682+`)
- [ ] Grep confirms each migrated area now uses `@tanstack/react-query` hooks and no longer goes through redux for that slice
- [ ] All eight (backend endpoint, frontend migration) pairs from §5.1 are present and `git cherry -v` no longer flags them as missing

### 5.5 Smoke test plan (executable via Playwright MCP)

Each migrated feature must pass a Create/Read/Update/Delete + error-state smoke. Setup is identical to §4.6 (`bash deploy.sh` + start Sonarr + `browser_navigate http://localhost:9103`).

**Per-feature template** (apply to all 8 features below):

| Step | Action | Assertion |
|---|---|---|
| C | Click "Add" / "+", fill in minimal valid fields, save | New row appears in the list without page reload; `browser_network_requests` shows a POST returning 2xx |
| R | After save, `browser_navigate` back to the feature page (force a fresh load) | The newly created item is still present (proves the cache invalidated correctly and the next mount refetches) |
| U | Edit the new item, change one field, save | Updated value reflects in the list; PUT returns 2xx |
| D | Delete the new item | Item disappears from list; DELETE returns 2xx |
| E | Repeat C with **invalid** data (e.g. empty required field) | Form validation surfaces error inline; no POST sent (verify via `browser_network_requests`) |
| F | Trigger a server-side failure (use a name that hits a backend validator, e.g. duplicate name) | Error toast appears; previous list state unchanged |

**Per-feature targets:**

| # | Feature | URL | Notes |
|---|---|---|---|
| 1 | Delay Profiles | `/settings/profiles` (Delay Profiles section) | Default profile cannot be deleted — verify D step is disabled for it |
| 2 | Custom Formats | `/settings/customformats` | Create a custom format with a single specification; spec list itself uses react-query too |
| 3 | Import Lists | `/settings/importlists` | Use a "Plex" or test list type that doesn't require external auth |
| 4 | Import List Options | `/settings/importlists` (Options panel) | Toggle a setting; verify Save persists across navigation |
| 5 | Import List Exclusions | `/settings/importlists` (Exclusions tab) | Add exclusion by series ID; remove |
| 6 | Auto Tagging | `/settings/tags` (Auto Tagging section) | Create rule with one condition; verify it can be edited |
| 7 | Indexer Options | `/settings/indexers` (Options panel) | Change RSS sync interval, save, navigate away, return, verify persisted |
| 8 | Indexer Flags | `/settings/indexers` (Flags panel) | Toggle a flag, save, verify persisted |

**Cross-feature checks (run once at the end)**

| Step | Action | Assertion |
|---|---|---|
| X.1 | `browser_console_messages` after running all 8 feature tests | No new `error`/`warn` beyond known noise |
| X.2 | `browser_network_requests` (filter to `/api/v5/`) | All requests returned 2xx (except the deliberate validation failures from step E) |
| X.3 | Navigate to a non-migrated settings area (e.g. `/settings/general`) | Still functions normally — confirms react-query migration didn't break the rest |
| X.4 | Take a final screenshot of each settings sub-page | Visual baseline for future comparison |

**Failure handling:** same as §4.6 — screenshot + console + network log, attach to PR.

### 5.6 Rollback

Each migration is its own commit pair. Granular revert is possible: `git revert <frontend>..<backend>` per feature. Whole-PR revert via revert of the merge commit.

## 6. Out of scope (deferred)

These remain on the long-term radar but are **not** part of PR 1 or PR 2:

- React 18 → 19 (blocked by router migration; afterward, evaluate)
- redux 4 → 5 / react-redux 7 → 9 (independent of router)
- FluentValidation 9 → 12 (backend; tracked in `docs/TODO.md` separately)
- Upstream's "redesign" branch — explicitly out of scope; we track `v5-develop`

## 7. Open questions

1. **`@tanstack/react-query` version** — we're on 5.100.5; upstream on 5.61.0. Confirm v7 router + react-query 5.100 has no known incompatibility before starting PR 1.
2. **`reselect`, `redux-batched-actions`, `redux-actions`** — these are upstream-removed in some files via react-query migrations. Confirm we keep them where still used, drop where not.
3. **Browser-state assumptions** — anywhere in our code that reads from `window.history` directly? Such usages can survive a router migration but should be reviewed.

### Resolved during planning

- ~~**Lazy-loaded routes**~~ — **Resolved 2026-05-27.** Zero `React.lazy` / `Suspense` / dynamic-import hits in the routing layer. All 37 routes use eager `<Route component={X}>`. The v7 port is purely mechanical. See finding folded into §3.

## 8. Definition of done

The full migration (PR 1 + PR 2) is complete when:

- [ ] We are using `react-router` 7.x with no remaining v5 imports anywhere in the tree
- [ ] `connected-react-router` and `history` are not in `package.json`
- [ ] All eight react-query migrations are in
- [ ] `git cherry -v v5-develop upstream/v5-develop` no longer lists any of the eight migration commits (or their backend pairs) as "not applied"
- [ ] Full unit-test suite green (5,682+)
- [ ] Manual smoke pass on every feature listed in §5.4
- [ ] `docs/TODO.md` entry for "react-router 5→7" can be checked off
