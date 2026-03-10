# TODO

## Known Issues

### NLog 6.x / Moq Proxy Failure (154 Test Failures)

**Impact**: 154 unit tests fail in `NzbDrone.Core.Test` during SetUp

**Error**:
```
System.ArgumentException : Can not create proxy for type NLog.Config.ILoggingConfigurationLoader
because it is not accessible. Make it public, or internal and mark your assembly with
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2, PublicKey=...")]
```

**Root Cause**: NLog 6.x made `ILoggingConfigurationLoader` internal. Castle.Core's dynamic proxy (used by Moq) cannot create proxies for internal interfaces in strong-named assemblies without an `InternalsVisibleTo` attribute.

**Options**:
1. **Downgrade NLog** to 5.x where the interface was public (not ideal long-term)
2. **Upgrade Moq** — check if a newer Moq version handles this differently
3. **Change test base class** — avoid mocking NLog's internal config loader; use a real `LogFactory` or stub the logger differently
4. **Contribute upstream** — ask NLog to add `InternalsVisibleTo` for `DynamicProxyGenAssembly2`

**Priority**: High — blocks 154 tests from running

---

### Korean Diacritics Test Failure

**Impact**: 1 test failure in `SeriesTitleFirstCharacterFixture`

**Error**: Korean character decomposition produces different first character than expected (`ᄌ` vs `좀`)

**Root Cause**: Related to removal of `AdditionalDiacriticsProvider` / changes to `StringExtensions.cs` diacritics handling. Unicode NormalizationForm.FormD decomposes Hangul syllables into Jamo, so `좀` → `좀` and the first character becomes the leading consonant `ᄌ` rather than the full syllable.

**Priority**: Medium — affects series folder naming for Korean titles

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
