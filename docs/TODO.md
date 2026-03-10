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

## Other Planned Work

- [ ] Code review (see `CLAUDE.md` — Code Review Phases)
- [ ] Unmonitor feature refinements (if needed after testing)
