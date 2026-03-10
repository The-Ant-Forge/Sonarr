# TODO

## Known Issues

### ~~NLog 6.x / Moq Proxy Failure (154 Test Failures)~~ — RESOLVED

**Fix**: Changed `MigrationTest.SetupLogging()` to use `new NLogLoggerProvider()` instead of `Mocker.Resolve<NLogLoggerProvider>()`. The AutoMoqer was trying to auto-mock `ILoggingConfigurationLoader` (made internal in NLog 6), but `NLogLoggerProvider` has a public parameterless constructor that uses `LogManager.LogFactory` directly, bypassing the need to resolve internal interfaces.

---

### ~~Korean & Æ Diacritics Test Failures (2 failures)~~ — RESOLVED

**Fix**: Added `.Normalize(NormalizationForm.FormC)` recomposition at the end of `RemoveDiacritics()` to recompose Hangul jamos back into syllable characters. Added Æ/æ ligature mappings to the `AdditionalDiacritics` dictionary.

---

### ~~DryIoc Recursive Dependency (8 Test Failures)~~ — RESOLVED

**Fix**: Changed `ISeriesService` to `Lazy<ISeriesService>` in `EpisodeService` constructor. The circular dependency (`EpisodeService` ↔ `SeriesService`) was introduced by the Disable Monitoring feature. `Lazy<T>` defers resolution until runtime, breaking the DI cycle.

## Planned Work

### Dependency Updates (Step 6 — Moderate Effort)

Per `docs/Spec-Dependency-Update.md`:

- [ ] Remove `prop-types` package (4 shape files → TS interfaces) — **DONE** (shape files already deleted, babel plugin cleaned up)
- [ ] Upgrade `Ical.Net` 4→5 — **DONE**
- [ ] Upgrade `Selenium.Support` 3→4 — **DONE**
- [ ] Upgrade `RestSharp` 106→114 — **DONE**
- [ ] Upgrade `NUnit` 3→4 + `FluentAssertions` 6→8 — **DONE**

### Deferred Major Upgrades

These require significant effort and are tracked in `Spec-Dependency-Update.md` Step 7:

- [ ] FluentValidation 9→11+ (268 files)
- [ ] React 18→19, react-router 5→7, redux 4→5
- [ ] `jquery` → `fetch` API (5 files)
- [ ] `file-loader`/`url-loader` → webpack 5 asset modules
