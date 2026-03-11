# Code Review — 2026-03-10

First periodic code review following the dependency audit & update sprint. Covers the full Sonarr codebase: backend (C#/.NET 10), frontend (React/TypeScript), tests (NUnit), and build configuration. Findings are organized into 20 categories (12 from CLAUDE.md's Code Review Phases + 5 additional categories identified during exploration + 3 categories added after Codex review).

Architecture changes arising from implementation should be captured in `docs/Transformation-260310.md`.

## Summary Table

Findings ranked by Impact (H/M/L) then Effort (L/M/H). Items marked **[Deferred]** go to `docs/TODO.md`.

Findings are grouped into three execution lanes and ranked by Impact (H/M/L) then Effort (L/M/H).

### Lane A — Exploit / Data Loss Prevention

| # | Category | Finding | Action | Impact | Effort | Risk |
|---|---|---|---|---|---|---|
| 6.1 | Security | `FileSystemController` accepts arbitrary paths | ~~Add path validation~~ DONE — defense-in-depth validation added; full sandboxing not appropriate (admin endpoint) | H | L | L |
| 6.2 | Security | Credential fields lack `Privacy` annotations | ~~Add `PrivacyLevel.ApiKey`~~ DONE — 5 provider settings annotated; HostConfigResource verified correct | H | L | L |
| 6.3 | Security | X509 certificate validation — zero tests | ~~Add unit tests~~ DONE — 17 tests covering all code paths (sender types, localhost bypass, validation modes, local/public IPs, error flags). Commit `256a385` | H | M | L |
| 15.1 | Logging | SignalR logs full message bodies (data leak) | ~~Redact sensitive fields~~ DONE — removed body payload from debug log | H | L | L |
| 18.1 | Network Security | SSRF via user-configurable URLs (indexers, webhooks, etc.) | Review outbound URL paths for private-network access, redirect following, scheme restrictions | H | M | M |
| 18.2 | Network Security | API-key scope & auth/authz gaps | Audit local-network trust, CSRF/CORS, websocket auth, stale auth state | H | M | M |
| 18.3 | Network Security | Secret handling across layers | Verify secrets protected in API resources, logs, exceptions, UI state, SignalR, persisted settings | H | M | L |
| 19.1 | Migrations | Migration 171 incomplete data migration | Resolve "Kill references to Preferred" TODO | H | M | M |
| 19.2 | Migrations | No migration/recovery test coverage | Add tests for forward-only migrations, backup restore, startup after interrupted upgrade | H | H | M |

### Lane B — Correctness

| # | Category | Finding | Action | Impact | Effort | Risk |
|---|---|---|---|---|---|---|
| 11.1 | Robustness | `SingleOrDefault().ToResource()` NRE risk | ~~Add null checks~~ DONE — null-conditional operator added in V3 SeriesController | H | L | L |
| 5.1 | Error Handling | 4 swallowed exceptions across backend | ~~Log exception details~~ DONE — added logging to ImportMechanismCheck, DbFactory, RTorrentProxy, createAjaxRequest | H | L | L |
| 8.1 | Test Gaps | Test name/assertion mismatch in `CoverExistsSpecificationFixture` | ~~Fix mismatch~~ DONE — test name corrected (assertion was correct) | H | L | L |
| 5.3 | Error Handling | `DelayProfileService.cs:114` silent return | ~~Throw when item not found~~ DONE — throws ModelNotFoundException | M | L | L |
| 20.1 | Concurrency | Command handler duplicate execution | Assessed — in-memory dedup exists with narrow race window; 3-thread pool + IsExclusive/IsLongRunning flags mitigate. DB unique constraint would be proper fix but low real-world risk. | M | M | M |
| 20.2 | Concurrency | Unbounded parallelism in scans/imports | Assessed — indexer searches use unbounded Task.WhenAll (mitigated by per-indexer rate limits); FFProbe has no concurrency limiter. SemaphoreSlim around FFProbe would be highest-value fix. | M | M | M |
| 20.3 | Concurrency | Resource lifecycle (HttpClient, file handles) | Assessed — HttpClient pooled per-proxy (good), FileStream disposal correct, HappyEyeballs cleanup excellent. Gap: no external CancellationToken on IHttpClient. Low real-world risk. | M | M | L |
| 5.2 | Error Handling | Download clients catch broad `Exception` | Assessed — catches are in validation methods, broad catch is acceptable as last-resort fallback | M | M | L |
| 8.3 | Test Gaps | Security-critical code untested (Auth, Validation, FileSystem) | Partially DONE — X509CertificateValidationService now has 17 tests (commit `256a385`). Auth and FileSystem controller tests deferred. | H | M | L |
| 17.1 | Stale Tests | 7 `[Ignore]` tests with stale reasons | ~~Triage~~ DONE — 2 removed, 1 re-enabled, 3 docs improved | M | L | L |
| 16.2 | API Parity | `ProviderControllerBase` V5 fallback to body ID | ~~Remove~~ DONE — V5 now uses route ID only | M | L | M |
| 11.2 | Robustness | `window.Sonarr` null guard missing | ~~Add guard~~ DONE — error page shown if initialization fails | M | L | L |
| 7.2 | Type Safety | `window.Sonarr` untyped in 40+ locations | Deferred — init guard (11.2) mitigates crash risk; typed accessor is large refactor for 30+ files | M | M | L |
| 7.3 | Type Safety | Unsafe type assertions (`as unknown as`, `{} as T`) | Assessed — all 3 instances are at Redux/AJAX system boundaries where types can't be enforced without rewriting the underlying untyped systems. Deferred to Redux→Zustand migration. | M | M | M |
| 5.4 | Error Handling | Frontend stores raw XHR in error state | Assessed — error handlers are in untyped JS files (`createSaveHandler.js`, etc.) pending Redux→Zustand rewrite. Normalizing in code about to be replaced adds no value. | M | M | M |
| 10.1 | Performance | `VideoFileInfoReader` re-reads media info | ~~Implement cache~~ DONE — 30min rolling cache keyed on path/mtime/size | M | M | L |

### Lane C — Maintainability (opportunistic)

| # | Category | Finding | Action | Impact | Effort | Risk |
|---|---|---|---|---|---|---|
| 1.1 | Dead Code | `[Obsolete]` LatestSeason in MonitoringOptions.cs | ~~Remove~~ DONE — can't remove (DB ordinals), improved [Obsolete] message. Queue.Episode stays (V3 API uses it). | M | L | L |
| 1.2 | Dead Code | `polyfills.js` "Remove in v5" — we're on v5 | ~~Remove polyfills~~ DONE — removed startsWith, endsWith, contains. Kept Object.groupBy (Firefox ESR). | M | L | L |
| 1.3 | Dead Code | Empty `Helpers/Props/Shapes/` directory | ~~Delete~~ DONE — directory removed (git doesn't track empty dirs) | L | L | L |
| 1.4 | Dead Code | `selectSettings.ts` legacy field aliases | ~~Remove~~ DONE — removed `link` and `detailedMessage`. Kept `message` (still used in 3 components). | M | L | L |
| 15.2 | Logging | `index.ts` monkey-patches console.error | ~~Refactor~~ DONE — extracted SUPPRESSED_WARNINGS array, added docs linking to react-custom-scrollbars replacement | M | M | L |
| 15.3 | Logging | Backend health checks log inconsistently | Assessed — all catch blocks already log full exception objects at appropriate levels. No action needed. | M | M | L |
| 3.1 | Duplication | Filter/sort logic duplicated TS ↔ JS | Assessed — `clientSideFilterAndSort.ts` (Zustand) and `createClientSideCollectionSelector.js` (Redux) can't merge until Redux→Zustand migration | M | M | L |
| 14.1 | Abandoned Deps | `react-custom-scrollbars` (abandoned) | ~~Replace~~ DONE — replaced OverlayScroller with CSS Scroller in PageSidebar, deleted component and dependency. Commit `8316212` | M | M | L |
| 4.2 | Naming | `ConfigService` property naming TODOs | Assessed — `SkipFreeSpaceCheckWhenImporting` rename deferred (DB key stored as string, needs migration across 8+ files). Documented intent in code. | M | M | M |
| 9.1 | Doc Drift | 30+ stale TODO/FIXME markers | ~~Resolve~~ DONE — resolved 6 stale TODOs (TransmissionSettings, WebhookEventType, V3 ProviderController, SonarrSettings, MediaCoverController, AutoSuggestInput). ~50 remain as legitimate future-work notes. Commit `7807b26` | M | M | L |
| 7.1 | Type Safety | `@ts-expect-error` in request/response/settings boundaries | Assessed — all 44 instances are blocked on untyped Redux actions or JS theme files. `@ts-expect-error` is correct approach (auto-flags when types are fixed). Deferred to TS/Redux migration. | M | M | L |

### Deferred

| # | Category | Finding | Action | Impact | Effort |
|---|---|---|---|---|---|
| 13.1 | TS Migration | 25+ JS files / 4,700+ LOC untyped | Opportunistic during redux migration | H | VH |
| 16.1 | API Parity | V5 API: 142 files, 0 tests | Contract tests for highest-risk endpoints first | H | VH |
| 8.2 | Test Gaps | 73% of source files untested | Dedicated coverage sprint | H | VH |
| 3.3 | Duplication | `ToResource()`/`ToModel()` boilerplate | Generic mapper — only if unlocks a concrete fix | M | H |
| 3.2 | Duplication | 9+ `create*Handler.js` identical patterns | Extract factory — only when editing those files | M | H |
| 4.1 | Naming | `HostConfigResource` mixes multiple classes | Split — high compatibility cost, low short-term payoff | M | H |
| 14.2 | Abandoned Deps | Lodash in 27 JS files | Replace when editing those files | M | H |
| 14.3 | Abandoned Deps | `jquery` in 5 files | Replace with fetch when touching | L | M |
| 19.2 | Migrations | Full migration/recovery test suite | Dedicated sprint | H | H |

## Detailed Findings

### 1. Dead Code

**1.1 Obsolete properties**
- `Queue.cs:19` — `[Obsolete] Episode` property still exposed in API resource with no migration path
- `MonitoringOptions.cs:23` — `[Obsolete] LatestSeason` enum value, may be referenced in DB migrations

**Action**: Check if any migration or serialization depends on these. If not, remove. If yes, document why they remain.

**1.2 Stale v5 polyfills**
- `polyfills.js` lines 11, 24, 39 — `TODO: Remove in v5` comments for `String.prototype.startsWith`, `endsWith`, `contains`
- We're on v5 now. These ES5 polyfills are unnecessary for our browser support targets.

**Action**: Remove the polyfills and the file if it becomes empty.

**1.3 Empty directory**
- `frontend/src/Helpers/Props/Shapes/` — all 4 shape files deleted during prop-types removal, directory remains

**Action**: Delete the empty directory.

**1.4 Legacy field aliases**
- `selectSettings.ts:80-83` — `TODO: Remove these renamed properties` for `message`, `link`, `detailedMessage` aliases

**Action**: Search for consumers, remove if unused.

---

### 2. Dead Dependencies

Already addressed comprehensively in the dependency audit (`docs/Spec-Dependency-Update.md`). No additional findings.

---

### 3. Duplication

**3.1 Filter/sort logic duplication**
- `frontend/src/Utilities/Filter/clientSideFilterAndSort.ts` (168 LOC, TypeScript)
- `frontend/src/Store/Selectors/createClientSideCollectionSelector.js` (132 LOC, JavaScript)
- Both implement identical `getSortClause()`, filtering predicates, and sort logic

**Action**: Consolidate into the TypeScript version. Update JS consumers to import from the TS module.

**3.2 Handler creation pattern**
- 9+ files in `Store/Actions/Creators/` follow identical pattern: get state → dispatch SET for loading → AJAX request → dispatch batchActions on success/fail
- Files: `createFetchHandler.js`, `createSaveHandler.js`, `createTestProviderHandler.js`, `createBulkEditItemHandler.js`, `createBatchToggleEpisodeMonitoredHandler.js`, `createFetchServerSideCollectionHandler.js`, and others

**Action**: Extract parameterizable factory. Consider whether this becomes moot with planned redux migration (deferred).

**3.3 Resource mapper boilerplate** **[Deferred]**
- `ToResource()`/`ToModel()` pairs with similar structure across 7+ API resource types (SeriesResource, EpisodeResource, ReleaseResource, etc.)
- ~300 LOC of near-identical mapping code

**Action**: Deferred — generic mapper would require careful design. Document for future refactor.

**3.4 Null-check-after-SingleOrDefault pattern**
- `SeriesController.cs:267`, `CalendarController.cs:50`, and 3+ other controllers repeat the same null-check-then-convert pattern

**Action**: Consider a `.SingleOrNotFound()` extension method that throws `NotFoundException` automatically.

---

### 4. Naming & Consistency

**4.1 HostConfigResource mixed concerns**
- `HostConfigResource.cs:56` — existing TODO: "Clean this mess up. don't mix data from multiple classes"
- Combines properties from `IConfigFileProvider`, `IConfigService`, and direct properties (50+ fields)

**Action**: Split into `HostConfigResource`, `ProxyConfigResource`, `SecurityConfigResource` or similar. High effort — coordinate with API versioning.

**4.2 ConfigService property naming**
- `ConfigService.cs:200` — TODO: Rename to 'Skip Free Space Check'
- Affects API contract

**Action**: Rename in V5 API, keep V3 for backwards compatibility.

**4.3 Namespace legacy**
- `NzbDrone.*` namespace vs `Sonarr.*` project files — documented legacy, no action needed beyond awareness

---

### 5. Error Handling

**5.1 Swallowed exceptions (5 instances)**

| File | Line | Issue |
|---|---|---|
| `ImportMechanismCheck.cs` | 41 | `catch (Exception)` returns default HealthCheck without logging |
| `DbFactory.cs` | 187 | Logs "Unable to recreate logging database" but no exception details |
| `RTorrentProxy.cs` | 160 | `catch (Exception)` silently returns false in filter |
| `createAjaxRequest.ts` | 176-180 | `.catch()` silently swallows JSON parse errors |
| `RssParser.cs` | 169 | Wraps generic exception as SizeParsingException (acceptable) |

**Action**: Add exception detail logging where missing. For `createAjaxRequest.ts`, at minimum log the parse error.

**5.2 Broad exception types**
- Download clients (`RTorrentProxy`, others) catch `Exception` instead of specific types like `HttpRequestException`, `TimeoutException`

**Action**: Narrow catch blocks to specific exceptions. Add catch-all with full logging as fallback.

**5.3 Silent return in DelayProfileService**
- `DelayProfileService.cs:114` — `if (moving == null) { return all; }` — TODO in code says "This should throw"

**Action**: Throw `NotFoundException` or appropriate exception.

**5.4 Frontend error normalization**
- `createSaveHandler.js:40-47` stores raw XHR in state
- `createTestProviderHandler.js:61-68` stores raw XHR without formatting
- `createFetchServerSideCollectionHandler.js:57-65` inconsistent error handling

**Action**: Create shared error normalization utility. Extract status code, message, validation errors into standard shape.

---

### 6. Security

**6.1 Path validation (defense-in-depth)** — DONE
- `FileSystemController` is an admin-only filesystem browser — by design it needs unrestricted access so admins can select root folders and import paths. Radarr has the identical pattern. Full sandboxing would break the UI.
- **Applied**: Added `ValidatePath()` to both V3 and V5 controllers rejecting `..` traversal sequences and invalid OS paths. Documented design intent in code comments.
- Risk is mitigated by authentication (API key required for all requests).

**6.2 Credential field privacy** — DONE
- 5 provider settings fields were missing `Privacy = PrivacyLevel.ApiKey` annotations:
  - `MailgunSettings.ApiKey`
  - `SendGridSettings.ApiKey`
  - `JoinSettings.ApiKey`
  - `SonarrSettings.ApiKey` (import list)
  - `PlexListSettings.AccessToken`
- `HostConfigResource` fields (Password, ApiKey, SslCertPassword, ProxyPassword) don't use `[FieldDefinition]` — they're plain REST properties. Password is already a hash; other values are intentionally returned to the authenticated admin UI. No change needed.

**Action**: Complete. 5 settings fields annotated, 4 HostConfigResource fields verified as correctly handled.

**6.3 X509 certificate validation untested**
- `X509CertificateValidationService.cs` — security-critical SSL/TLS validation code with zero tests

**Action**: Add unit tests covering certificate acceptance/rejection scenarios.

**6.4 Frontend sensitive data in logs**
- `SignalRListener.tsx:91-96` logs full SignalR message bodies
- `SignalRLogger.ts:42` attempts API key cleansing but other console calls bypass it

**Action**: Route all SignalR logging through `SignalRLogger` which already has cleansing. Remove direct console calls.

---

### 7. Type Safety

**7.1 @ts-expect-error proliferation**
- 44 TypeScript files suppress type checking with `@ts-expect-error` or `@ts-ignore`
- Critical instance: `selectSettings.ts:130` — `@ts-expect-error - This is a valid key`

**Action**: Audit each instance. Fix underlying type issues where possible. Document legitimate suppressions with detailed comments.

**7.2 Untyped window.Sonarr**
- Accessed in 40+ locations (`window.Sonarr.urlBase`, `window.Sonarr.apiKey`, `window.Sonarr.version`)
- No null checks or typed interface
- Risk: if initialization fails, cascading crashes without meaningful error

**Action**: Create `SonarrConfig` interface and typed accessor function with null guard and fallback error.

**7.3 Unsafe type assertions**
- `Store/thunks.ts:14` — `payload as unknown as TResult`
- `OAuth/useOAuth.ts:180` — `response as unknown as AjaxOptions`
- `Utilities/createAjaxRequest.ts:188` — `{} as T`

**Action**: Fix underlying types so assertions aren't needed. Where unavoidable, add runtime validation.

---

### 8. Test Gaps

**8.1 Assertion bug** (HIGH)
- `CoverExistsSpecificationFixture.cs:60-64` — test named `should_return_true_if_there_is_no_size_header_and_file_exist()` but asserts `Should().BeFalse()` on line 63
- Either the test name is wrong or the assertion is wrong — either way it's masking a defect

**Action**: Investigate expected behavior and fix the mismatch.

**8.2 Major untested areas** **[Deferred]**
- V5 API: 0/142 files tested
- V3 API: 2/156 files tested
- Entire namespaces with 0 tests: Validation (23 files), Authentication (5), Backup (5), Queue (8), Tags (5), Security (2), RemotePathMappings (3), RootFolders (4), SeriesStats (4), CustomFilters (3), Analytics (1)
- Estimated 73% of source files have no direct test

**Action**: Deferred to a dedicated test coverage sprint. Prioritize security-critical code (X509, Authentication, Validation).

---

### 9. Documentation Drift

**9.1 Stale markers**
- `polyfills.js` — "Remove in v5" but we're on v5
- `index.ts:20` — "Remove after TypeScript migration" (ongoing, needs timeline)
- `createHandleActions.js:84` — "Move adding to its own reducer" (stale, no active work)
- 30+ backend TODO/FIXME markers with varying staleness

**Action**: Triage each marker in the TODO audit (category 12). Remove stale ones, convert actionable ones to tracked issues.

---

### 10. Performance

**10.1 VideoFileInfoReader media info re-reads** — DONE
- `VideoFileInfoReader.cs:53` — was re-reading ffprobe results on every call
- **Applied**: Added 30-minute rolling cache via `ICacheManager`, keyed on `path:mtime:fileSize`. Commit `a9d43c5`.
- Cache auto-invalidates when file changes (mtime/size in key).

**10.2 Lodash for trivial operations**
- 27 JS files import Lodash for operations like `_.omit()`, `_.isArray()`, `_.isEqual()`, `_.pick()`
- Native JS alternatives: `Object.fromEntries(Object.entries(obj).filter(...))`, `Array.isArray()`, structured equality

**Action**: Replace Lodash calls with native equivalents during TS migration (category 13). Remove Lodash when no longer imported.

---

### 11. Robustness

**11.1 NullReferenceException risks** (HIGH)
- `SeriesController.cs:267` — `SingleOrDefault(s => ...).ToResource()` will throw NRE if no match
- `CalendarController.cs:50` — similar pattern with manual null check (inconsistent)

**Action**: Add null checks. Consider `.SingleOrNotFound()` extension (see 3.4).

**11.2 window.Sonarr initialization guard**
- Frontend code assumes `window.Sonarr` is always populated
- If the server-rendered initialization script fails, all subsequent API calls crash

**Action**: Add guard in `index.ts` that shows error page if `window.Sonarr` is not populated.

---

### 12. TODO/FIXME/HACK Audit

High-priority TODOs requiring attention:

| File | Line | Marker | Notes |
|---|---|---|---|
| `ConfigService.cs` | 200 | TODO: Rename property | API contract change, V5 only |
| `ProviderControllerBase.cs` (V5) | 98 | TODO: Remove fallback to Id from body | V5 tech debt |
| `HostConfigResource.cs` | 56 | TODO: Clean this mess up | SRP violation (see 4.1) |
| `Migration 171` | 41 | TODO: Kill references to Preferred | Incomplete data migration |
| `VideoFileInfoReader.cs` | 53 | TODO: Cache media info | Performance (see 10.1) |
| `RTorrentProxy.cs` | 75 | TODO: Deluge timeouts with season packs | Download client reliability |
| `DownloadMonitoringService.cs` | 100 | TODO: Stop tracking offline clients | Resource optimization |
| `Parser.cs` | 625 | TODO: Skip for anime specials | Feature gap |
| `DelayProfileService.cs` | 114 | TODO: Should throw | Error handling (see 5.3) |

**Action**: Resolve high-priority items during implementation. Move low-priority items to `docs/TODO.md`.

---

### 13. TypeScript Migration Debt

**13.1 Untyped JavaScript files** **[Deferred]**

25+ JS files totaling 4,700+ LOC remain untyped:

| Directory | Files | LOC |
|---|---|---|
| `Store/Actions/Creators/` | 9 handler files | ~600 |
| `Store/Actions/Settings/` | 7+ settings files | ~1,400 |
| `Store/Selectors/` | 1 selector file | 132 |
| `Store/Actions/` | 1 base actions file | 32 |
| `Styles/Themes/` | 2 theme files | 490 |
| `Diag/` | 1 console API | 123 |
| `Helpers/Props/` | 1 index file | 28 |
| Other | polyfills, etc. | ~200 |

**Action**: Deferred — phased migration alongside redux upgrade (see `docs/TODO.md`). The Store/ files will largely be rewritten during redux 4→5 migration. Theme files and utilities can be converted independently.

---

### 14. Abandoned/Unmaintained Dependencies

**14.1 react-custom-scrollbars**
- Used only in `OverlayScroller.tsx`
- Library is abandoned (no updates in 3+ years)

**Action**: Replace with CSS `overflow: auto` + styled scrollbar, or a maintained alternative like `overlayscrollbars-react`.

**14.2 Lodash overuse**
- Imported in 27 JS files for basic operations (`_.omit()`, `_.isArray()`, `_.isEqual()`)
- Native JS alternatives exist for all use cases

**Action**: Replace during TS migration. Track as part of category 13.

**14.3 jQuery** **[Deferred]**
- Used in 5 files
- Already noted in dependency spec as deferred (medium effort)

**Action**: Deferred — replace with `fetch` API when touching those files.

---

### 15. Logging & Observability

**15.1 Sensitive data in frontend logs** — DONE
- `SignalRListener.tsx:91-96` — was logging full SignalR message bodies via `console.debug()`
- **Applied**: Changed to log only message name, version, and action — no resource payload. Commit `3c046bf`.
- `SignalRLogger.ts:42` already has API key cleansing for the SignalR transport layer.

**15.2 Global console monkey-patching**
- `index.ts:17-41` — overrides `console.error` to filter React deprecation warnings
- Fragile: breaks if React changes warning format; hides legitimate errors matching the filter

**Action**: Replace with React error boundary or proper warning suppression mechanism.

**15.3 Inconsistent backend exception logging**
- Health check handlers: some log full exception, some log only message, some log nothing
- Download clients: similar inconsistency

**Action**: Standardize in `HealthCheckBase` — always log exception at Warning level minimum.

---

### 16. API Parity (V3 vs V5)

**16.1 V5 API test coverage** **[Deferred]**
- 142 files in `Sonarr.Api.V5/`, zero test coverage
- `ProviderControllerBase.cs:98` — TODO about removing backwards-compat fallback
- V3 API also has minimal tests (2/156 files)

**Action**: Deferred — requires dedicated V5 test suite effort. Note: V5 shares many patterns with V3, so a testing approach for one informs the other. Prioritize after V5 stabilizes.

---

### 17. Stale [Ignore] Tests

7 tests currently disabled with `[Ignore]`:

| Test File | Reason | Recommendation |
|---|---|---|
| `ProviderSettingConverterFixture.cs:10` | "To reinstate once dapper changes worked out" | Investigate — Dapper changes were part of dependency update |
| `128_rename_quality_profiles_...Fixture.cs` | "not sure for now" | Vague — investigate or remove |
| `TorrentRssSettingsDetectorFixture.cs` | "Cannot reliably reject unparseable titles" | Legitimate limitation — document and keep |
| `EmailSettingsValidatorFixture.cs` | "Allowed coz some email servers allow arbitrary source..." | Design decision — convert to documented skip |
| `FileNameBuilderFixture.cs` | "not currently supported" | Feature gap — convert to TODO issue |
| `EpisodesWithoutFilesFixture.cs` | "Specials not implemented" | Feature gap — convert to TODO issue |
| `UpdateServiceFixture.cs:247` | "TODO fix" | Integration test — investigate and fix |

**Action**: Triage each. Fix the fixable ones (ProviderSettingConverter, UpdateService). Document the rest with clear rationale.

---

### 18. Network Boundary Security *(added after Codex review)*

**18.1 SSRF via user-configurable URLs**
- Sonarr makes outbound HTTP calls to user-specified endpoints: indexers, download clients, webhooks, notification targets, import lists
- Risk: private-network access (SSRF), redirect following to internal hosts, proxy bypass, scheme abuse (file://, gopher://)
- Credential leakage in exceptions/logs when requests to external services fail

**Action**: Review all provider/webhook/indexer/notification URL paths. Validate schemes (http/https only), block RFC1918/loopback addresses, limit redirect following.

**18.2 Authorization & session review**
- API-key scope — are all endpoints properly gated?
- Local-network trust assumptions — what's accessible without auth?
- CSRF/CORS posture — are origin checks enforced?
- WebSocket (SignalR) authorization — can unauthenticated clients subscribe?
- Stale/partial auth state — can sensitive endpoints be called with expired credentials?

**Action**: Audit each endpoint category. Document auth requirements. Add tests for unauthorized access paths.

**18.3 Secret handling audit**
- Verify secrets are protected across all layers: API resources, logs, exception messages, UI state, SignalR payloads, persisted settings
- Extend FileSystemController review to include canonicalization, symlink/junction handling, UNC/network-share rules, case-normalization

**Action**: Systematic audit of all secret-adjacent code paths. Ensure `Privacy` annotations, log redaction, and exception scrubbing are consistent.

---

### 19. Migrations, Upgrades & Recovery *(added after Codex review)*

**19.1 Migration 171 incomplete data migration**
- `Migration 171:41` — TODO: "Kill any references to Preferred in History and Files"
- Incomplete migration leaves stale data that can cause confusion or bugs

**Action**: Investigate scope. Create follow-up migration if data cleanup is needed.

**19.2 Migration and recovery testing** **[Deferred — dedicated sprint]**
- No tests for DB migration correctness (forward-only guarantees)
- No tests for backup/restore compatibility across versions
- No tests for config serialization changes
- No tests for startup recovery after interrupted upgrades

**Action**: Deferred to dedicated sprint. Create migration test framework and cover critical migration paths.

---

### 20. Concurrency, Cancellation & Resource Lifecycle *(added after Codex review)*

**20.1 Command handler duplicate execution** — Assessed

Investigation findings:
- `CommandQueueManager.Push()` has in-memory deduplication via `CommandEqualityComparer` under `lock (_commandQueue)`
- `CommandQueue.TryGet()` implements `IsExclusive` and `IsLongRunning` flags to prevent conflicting concurrent execution
- **Gap**: Dedup check is in-memory only; no database unique constraint. Narrow race window exists between command completion and 5-minute DB cleanup.
- **Risk**: LOW-MEDIUM. Worst case is duplicate RSS sync (wasteful, not data-corrupting). 3-thread pool (`THREAD_LIMIT = 3`) is the primary safety valve.
- **CancellationToken**: Queue dequeuing supports cancellation, but `IExecute<TCommand>.Execute()` has no token parameter — handlers are uninterruptible.

**Action**: Document as known limitation. DB unique constraint on `(CommandName, CommandBody)` would be the proper fix but is non-trivial and low real-world impact.

**20.2 Bounded parallelism** — Assessed

Investigation findings:
- **DiskScanService**: Fully sequential per-series (safe). Heavy I/O but single-threaded within each scan.
- **ImportDecisionMaker**: Sequential per-file loop (safe).
- **Indexer searches**: `Task.WhenAll()` fires ALL enabled indexers in parallel with no global cap. Mitigated by per-indexer `RateLimitService` (2s default) and graceful 429 handling.
- **FFProbe execution**: No concurrency limiter on subprocess creation during media info/sample detection. Mitigated by VideoFileInfoReader cache.
- **Global safety valve**: 3-thread command pool prevents unbounded command-level parallelism.

**Action**: Add `SemaphoreSlim` around FFProbe calls (highest-value fix). Indexer parallelism is acceptable given per-indexer rate limits. Document 3-thread pool as intentional design.

**20.3 Resource lifecycle** — Assessed

Investigation findings:
- **HttpClient pooling**: `ManagedHttpDispatcher.GetClient()` caches per-proxy config via `_httpClientCache` with `SocketsHttpHandler` (`MaxConnectionsPerServer = 12`). Follows Microsoft best practices.
- **FileStream disposal**: Correct — uses `await using` for download streams.
- **Response/request disposal**: Correct — `using var` for HttpRequestMessage, HttpResponseMessage, CancellationTokenSource.
- **HappyEyeballs**: Excellent socket cleanup — failed connection attempts explicitly disposed.
- **Timeouts**: Consistent — 100s default, 300s for downloads, enforced via per-request CancellationTokenSource.
- **Gap**: `IHttpClient` async methods don't accept external CancellationToken — callers can't cancel in-flight requests.
- **Gap**: Sync-over-async wrappers present (`Task.Run().GetAwaiter().GetResult()`) — mitigated by running on dedicated command threads.

**Action**: Low real-world risk. Adding CancellationToken to IHttpClient would be the proper fix but requires touching all callers. Document as future improvement.

---

## Out-of-Scope / Deferred Items

These go to `docs/TODO.md`:

1. **TypeScript migration** (13.1) — 4,700+ LOC, opportunistic alongside redux migration
2. **V5 API contract tests** (16.1) — prioritize highest-risk endpoints first, not blanket coverage
3. **Full test coverage sprint** (8.2) — 73% untested, dedicated sprint (but security-critical subsets are in Lane A/B)
4. **Migration/recovery test suite** (19.2) — dedicated sprint with migration test framework
5. **Generic resource mapper** (3.3) — only if it unlocks a concrete fix
6. **Handler factory extraction** (3.2) — only when editing those files
7. **HostConfigResource split** (4.1) — high compatibility cost, low short-term payoff
8. **Lodash removal** (14.2) — replace when editing those files
9. **jQuery removal** (14.3) — replace with fetch when touching
10. **redux/react-router/React major upgrades** — already tracked in TODO.md

## Implementation Priority

Work proceeds in three lanes. Lane A (security) takes precedence, then Lane B (correctness), then Lane C (maintainability, opportunistic).

### Lane A — Exploit / Data Loss Prevention
*Do first. Each item is a focused commit.*

1. ~~**6.1** Path traversal fix in FileSystemController~~ — **DONE** (commit `3728ba5`)
2. ~~**6.2** Privacy annotations on all credential fields~~ — **DONE** (commit `3728ba5`)
3. ~~**15.1** SignalR log redaction~~ — **DONE** (commit `3c046bf`)
4. **18.3** Secret handling audit — verify redaction across API resources, logs, exceptions
5. ~~**6.3** X509 certificate validation tests~~ — **DONE** (commit `256a385`)
6. **18.1** SSRF review — outbound URL validation for indexers, webhooks, download clients
7. **18.2** Auth/authz audit — API-key scope, CSRF/CORS, websocket auth
8. **19.1** Migration 171 data cleanup — resolve "Kill references to Preferred"

### Lane B — Correctness
*Do after Lane A critical items. Can interleave with Lane A medium-effort items.*

1. ~~**11.1** Null reference fixes (`SingleOrDefault().ToResource()`)~~ — **DONE** (commit `6d39259`)
2. ~~**5.1** Fix 4 swallowed exceptions~~ — **DONE** (commit `6d39259`)
3. ~~**8.1** Fix assertion bug in CoverExistsSpecificationFixture~~ — **DONE** (commit `6d39259`, name was wrong not assertion)
4. ~~**5.3** DelayProfileService throw instead of silent return~~ — **DONE** (commit `6d39259`)
5. **8.3** / **6.3** Targeted tests for security-critical code — **Partially DONE** (X509 tests: commit `256a385`; Auth/FileSystem deferred)
6. ~~**17.1** Stale [Ignore] test triage~~ — **DONE** (commit `9bb49ca`)
7. ~~**16.2** ProviderControllerBase V5 fallback review~~ — **DONE** (commit `a228364`)
8. ~~**11.2** window.Sonarr initialization guard~~ — **DONE** (commit `9bb49ca`)
9. **7.2** Typed window.Sonarr accessor — **Deferred** (init guard mitigates crash risk; 30+ file refactor)
10. **5.2** Narrow exception types in download clients — **Assessed** (catches are in validation methods, broad catch acceptable)
11. **20.1–20.3** Concurrency/resource lifecycle review — **Assessed** (see detailed findings in categories 20.1–20.3; only actionable item: SemaphoreSlim for FFProbe)
12. ~~**10.1** VideoFileInfoReader cache~~ — **DONE** (commit `a9d43c5`)
13. **5.4** Frontend error normalization — **Assessed** (blocked on Redux→Zustand migration; error handlers in untyped JS)
14. **7.3** Fix unsafe type assertions — **Assessed** (all 3 at Redux/AJAX boundaries; deferred to migration)

### Lane C — Maintainability (opportunistic)
*Do when touching related files or between other work.*

- ~~**1.1–1.4** Dead code removal~~ — **DONE** (commit `164d362`)
- ~~**15.2** Replace console monkey-patch~~ — **DONE** (commit `a2eee36`)
- **15.3** Standardize backend logging — **Assessed** (already consistent, no action needed)
- **3.1** Consolidate filter/sort duplication — **Assessed** (blocked on Redux→Zustand migration)
- ~~**14.1** Replace react-custom-scrollbars~~ — **DONE** (commit `8316212`)
- **4.2** ConfigService property renames — **Assessed** (deferred, DB key migration needed)
- ~~**9.1** Resolve TODO markers tied to active defects~~ — **DONE** (commit `7807b26`)
- **7.1** Fix @ts-expect-error at API boundaries only — **Assessed** (blocked on TS/Redux migration)

## Codex Review Feedback (incorporated)

The spec was reviewed by OpenAI Codex (gpt-5.4) on 2026-03-10. Key feedback incorporated:

1. **Security scope too narrow** — Added category 18 (Network Boundary Security) covering SSRF, auth/authz, and secret handling
2. **Missing migration/recovery review** — Added category 19 (Migrations, Upgrades & Recovery)
3. **Missing concurrency review** — Added category 20 (Concurrency, Cancellation & Resource Lifecycle)
4. **Phase 1 mixed risk reduction with housekeeping** — Restructured into three execution lanes (Exploit/Data Loss, Correctness, Maintainability)
5. **X509 tests buried** — Promoted to Lane A (security)
6. **Some items not worth dedicated effort** — Generic mapper, blanket TS migration, full @ts-expect-error audit, and bulk TODO triage marked as opportunistic/deferred

## Transformation Document

Any architecture changes made during implementation of this review should be captured in `docs/Transformation-260310.md` for reference when contributing upstream.
