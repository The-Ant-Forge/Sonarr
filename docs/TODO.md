# TODO

## Known Issues

_No known test failures. All 5,645 unit tests passing as of 2026-03-10._

### Resolved Issues

- ~~NLog 6.x / Moq Proxy (154 tests)~~ — Fixed in `1b7667316`: direct `new NLogLoggerProvider()` bypasses AutoMoqer
- ~~Korean & Æ Diacritics (2 tests)~~ — Fixed in `1b7667316`: FormC recomposition + Æ/æ ligature mappings
- ~~DryIoc Circular Dependency (8 tests)~~ — Fixed in `1b7667316`: `Lazy<ISeriesService>` in EpisodeService

## Deferred Major Upgrades

These are the only remaining items from the dependency audit (`docs/Spec-Dependency-Update.md`).
Each is a Very High effort project warranting its own spec document.

| Item | Effort | Files | Blocker | Notes |
|---|---|---|---|---|
| **FluentValidation 9→12** | Very High | 253+ | None | Mechanical: `RuleFor` API changes, validator registration |
| **react-router 5→7** | Very High | Many | Before React 19 | Paradigm shift to data routers; removes `connected-react-router`, `history` |
| **React 18→19** | Very High | Many | After router | `react-window` v2 requires React 19 |
| **redux 4→5 / react-redux 7→9** | Very High | Many | Independent | Also affects `redux-actions`, `redux-thunk`, `reselect`, `redux-batched-actions` |

## Code Review Deferred Items

From the 2026-03-10 code review (`docs/spec-code-review-260310.md`):

- [ ] **TypeScript migration** (13.1) — 25+ JS files / 4,700+ LOC, opportunistic alongside redux migration
- [ ] **V5 API contract tests** (16.1) — prioritize highest-risk endpoints first
- [ ] **Full test coverage sprint** (8.2) — 73% of source files untested
- [ ] **Migration/recovery test suite** (19.2) — DB migration tests, backup/restore compatibility
- [ ] **Generic resource mapper** (3.3) — only if it unlocks a concrete fix
- [ ] **HostConfigResource split** (4.1) — high compatibility cost, defer
- [ ] **Lodash removal** (14.2) — replace when editing those files
- [ ] **jQuery removal** (14.3) — replace with fetch when touching
- [x] **Drop legacy browser shims & polyfills** — Removed `polyfills.js` (console shims + Object.groupBy), `core-js`, `@juggle/resize-observer`, `Shims` resolve path. Tightened browserslist to drop Firefox ESR 115 and Opera Mini. Disabled Babel `useBuiltIns`.
- [x] **Dependency removal sprint** — Removed 8 more packages (`copy-to-clipboard`, `react-text-truncate`, `react-lazyload`, `jdu`, `qs`, `stacktrace-js`, `use-debounce`, `react-measure`) + 3 `@types` packages. All replaced with native browser APIs or custom hooks.

## Other Planned Work

- [x] Code review spec (see `docs/spec-code-review-260310.md`)
- [x] Code review implementation (Lanes A → B → C per spec) — All 3 lanes complete (8+14+11 = 33 items)
- [ ] Unmonitor feature refinements (if needed after testing)
- [ ] Deploy script testing with `bin/` directory layout
