# Sonarr - Project Guide

## What is Sonarr?
TV series collection manager for Usenet/BitTorrent. Users select shows via web UI, Sonarr monitors RSS feeds for new episodes, searches indexers, sends to download clients, and organizes files for Plex/media servers. Supports automatic quality upgrades.

## Architecture
- **Backend**: C# .NET 10 (solution at `src/Sonarr.sln`)
- **Frontend**: React/TypeScript with webpack (`frontend/src/`)
- **API**: REST API v3 (`src/Sonarr.Api.V3/`) and v5 (`src/Sonarr.Api.V5/`)
- **Database**: SQLite (migrations in `src/NzbDrone.Core/Datastore/`)

## Key Backend Projects
| Directory | Purpose |
|---|---|
| `src/NzbDrone.Core/` | Core business logic (series, episodes, indexers, download clients, etc.) |
| `src/NzbDrone.Common/` | Shared utilities, disk, HTTP, environment |
| `src/NzbDrone.Host/` | Application host, startup, web server |
| `src/Sonarr.Api.V3/` | API v3 controllers (current stable API) |
| `src/Sonarr.Api.V5/` | API v5 controllers (next-generation API) |
| `src/Sonarr.Http/` | HTTP framework, routing, authentication |
| `src/NzbDrone.SignalR/` | Real-time push notifications |
| `src/NzbDrone.Windows/` | Windows-specific platform code |
| `src/NzbDrone.Console/` | Console entry point (startup project) |

**Note**: Namespace is `NzbDrone.*` (legacy), project files are `Sonarr.*.csproj`.

## Code Style
- **C#**: 4-space indent, `var` everywhere, `_camelCase` for private fields, no `this.` qualifier
- **Frontend**: 2-space indent (JS/TS/CSS)
- .editorconfig enforced; tests use NUnit
- Test projects mirror source (`NzbDrone.Core.Test/` tests `NzbDrone.Core/`)

## Prerequisites
- **.NET 10 SDK** v10.0.103 (pinned in `global.json`; project targets `net10.0`)
- **Visual Studio 2022** v17.8+ or Rider (or VS Code with C# Dev Kit)
- **Node.js 24.x** (upstream pins 20.x but we use 24 — works fine)
- **Yarn 1.22.x** (Classic): `npm install -g yarn`

## Build & Run
```bash
# Frontend
yarn install
yarn start        # dev server with hot reload
yarn build        # production build → _output/UI/

# Backend (console + libraries)
dotnet build src/Sonarr.sln -c Release

# Windows tray app (separate — targets net10.0-windows)
dotnet build src/NzbDrone/Sonarr.csproj -c Release -p:EnableAnalyzers=false

# Quick dev run (console mode, uses C:\ProgramData\Sonarr by default)
dotnet run --project src/NzbDrone.Console/Sonarr.Console.csproj
```

## Local Testing Deployment

**Installation directory:** `D:\Apps\Sonarr` — matches the official Inno Setup installer layout (`{commonappdata}\Sonarr\bin`).

| Path | Contents |
|---|---|
| `D:\Apps\Sonarr/` | Data directory: `config.xml`, `sonarr.db`, `logs.db`, `Backups/`, `logs/` |
| `D:\Apps\Sonarr/bin/` | Application binaries, UI assets, localization (everything from build output) |
| `_output/net10.0-windows/` | Build output: backend DLLs + tray app (use this for Windows, not `net10.0/`) |
| `_output/UI/` | Build output: frontend assets |
| `_tests/net10.0/` | Test assemblies |

### Deploying

Both modes use `deploy.sh` which copies `_output/net10.0-windows/*` → `bin/` and `_output/UI/*` → `bin/UI/`.

```bash
# Standard deploy — wipes bin/, copies fresh build. Preserves config, database, logs, backups.
bash deploy.sh

# Clean deploy — wipes ENTIRE install directory (config, db, logs — everything gone).
# Back up first if needed. Use for a completely fresh start.
bash deploy.sh --clean
```

Standard deploy is the normal workflow — it also cleans up stale flat-layout files from previous installs. Use `--clean` only when you want a factory-reset install.

### Running

```bash
"D:\Apps\Sonarr\bin\Sonarr.exe" -data="D:\Apps\Sonarr"        # tray mode (port 9103)
"D:\Apps\Sonarr\bin\Sonarr.Console.exe" -data="D:\Apps\Sonarr" # console mode (port 9103)
```
Web UI: http://localhost:9103 | API key: see `D:\Apps\Sonarr\config.xml`

**Important:** The `-data` flag MUST use Windows backslash paths (`D:\Apps\Sonarr`), not forward slashes. Without `-data`, Sonarr defaults to `C:\ProgramData\Sonarr`.

## Linting (required before committing frontend changes)
```bash
yarn lint --fix
yarn stylelint "frontend/**/*.css" --config frontend/.stylelintrc --fix
```

## Testing
- NUnit for unit/integration/automation tests
- Test projects mirror source: `NzbDrone.Core.Test/` → `NzbDrone.Core/`
- Run via VS Test Explorer or command line: `dotnet test src/Sonarr.sln`

## Localization
- Source strings: `src/NzbDrone.Core/Localization/en.json`
- Backend: `_localizationService.GetLocalizedString("KeyName")`
- Frontend: `import translate from 'Utilities/String/translate'` → `translate('KeyName')`

## Working Style

### Keep diffs focused
- One logical change per commit
- Avoid unrelated reformatting

### Planning sessions → write a spec
Whenever we do a planning session (plan mode), always write the finalised specification into `docs/` as a named document. This ensures we have a durable reference if context is lost or the session is interrupted.

### Update docs before committing
Before committing, check if `docs/`, `README.md` and `CLAUDE.md` need updating to reflect the changes (new features, architectural changes, etc.) and check whether a `docs/TODO.md` can be checked. If an entire TODO section is completed then move the section to Completed.md in the same folder.

### Compile/test locally after changes
1. Make a small, targeted change
2. Run tests/linting after each change
3. Only then commit/push

### Codex CLI for second opinions
The Codex CLI (`codex`) is installed globally via npm. Use it for spec/plan review:
```bash
codex exec -o /tmp/output.md "Read <file> and review it. Tell me what we missed, priority changes, and what's not worth the effort."
```

### Documentation or commentary
Never use real TV show names. Always make up example ones.

## Code Review Phases

Periodically we do a consolidation review covering all source, tests, build config, and metadata.

### Review Checklist

Guiding rule: recommend a change only if it reduces risk or removes recurring cost. Avoid speculative abstraction churn.

#### Phase 1 — Exploit / Data Loss / Upgrade Risk
1. **Security & network boundaries** — SSRF via indexers/webhooks/proxies, redirect policy (external→internal bounce), certificate validation, auth header leakage across redirects, secret redaction in logs/errors, API-key/session/CORS/SignalR behavior, path traversal in disk operations, credential storage
2. **Migrations & upgrade safety** — forward-only migration replay, startup after interrupted upgrade, backup restore, config.xml + DB version skew, enum/string key renames persisted in DB, irreversible migrations, whether obsolete fields must remain for compatibility
3. **API version parity** — v3/v5 route parity, request/response shape drift, deprecated fields still required by old clients, both versions tested
4. **Upstream compatibility** — schema changes that break rollback, config key collisions with upstream, patterns that diverge unnecessarily, merge conflict risk assessment
5. **Configuration wiring** — config keys read but not settable (or vice versa), missing UI for API-exposed settings, wrong defaults on fresh install vs upgrade

#### Phase 2 — Runtime Correctness
6. **API contracts** — input validation, response shape consistency, correct HTTP status codes, no internal types leaked
7. **Error handling** — swallowed exceptions, inconsistent patterns (some throw, some return null, some log-and-continue for the same class of error), missing user-facing messages
8. **Command pipeline & scheduling** — duplicate command execution, exclusivity flag correctness, retry/cancellation behavior, long-running scan/import/search work, queue starvation
9. **Concurrency & async** — `async void`, missing `CancellationToken` propagation, `Task.Result`/`.Wait()` deadlock risks, shared mutable state without synchronization
10. **Resource management** — undisposed HTTP clients/streams/DB connections, missing `finally`/`using` blocks, event handler leaks, file handle retention
11. **Cross-platform filesystem** — path normalization, case sensitivity, symlink/relative path handling, long paths, file locking, permission failures, process invocation differences
12. **Frontend state & hooks** — stale closures, missing dependency array entries, derived state that should be computed, prop drilling that should be context, unnecessary re-renders, missing memoization

#### Phase 3 — Structural Debt
13. **Dead code & stale markers** — unused functions, classes, modules, imports, unreachable branches, commented-out code, TODO/FIXME/HACK markers to resolve or remove
14. **Dead dependencies** — NuGet/npm packages unused, underused (replaceable with < 20 lines), or superseded by framework APIs
15. **Duplication & abstraction** — repeated logic that should be shared; also over-abstraction where indirection hides bugs
16. **DI wiring & service lifetime** — wrong scope registrations, unused injections, singleton state bugs, circular dependencies
17. **Database queries** — missing indexes, N+1 queries, SQLite write contention, unbounded result sets
18. **Type safety** — frontend: `any` overuse, missing discriminated unions, untyped API responses, legacy JS/Redux boundaries; backend: nullable reference warnings, unchecked casts
19. **Naming & consistency** — mixed conventions, unclear names, stale comments, `NzbDrone` vs `Sonarr` confusion in new code

#### Phase 4 — Performance & Operability
20. **Hot-path performance** — unnecessary allocations in loops, LINQ in tight paths, redundant disk/network I/O, missing caching where data is stable
21. **Startup & memory** — slow initialization, unbounded caches, large object pinning, services doing work in constructors
22. **Logging & observability** — missing context in catch blocks, sensitive data exposure, trace-level noise in hot paths, inconsistent levels, log correlation across API/background jobs, generic UI messages hiding root cause

#### Phase 5 — Verification & Documentation
23. **Test coverage** — untested code paths, missing edge cases, integration tests that should exist but don't
24. **Stale & quarantined tests** — ignored/flaky tests, assertions that no longer prove anything, test fixtures that no longer reflect runtime wiring
25. **Migration & contract test coverage** — migration replay tests, API contract tests, backup restore tests
26. **Documentation drift** — specs, README, CLAUDE.md sections that no longer match the code

### Deliverable
A review document in `docs/Code-Review-YYMMDD.md` (or similar) with:
- Summary table: Category, Description, Action, Impact, Effort, Risk
- Detailed findings grouped by category, ordered by impact then effort
- Out-of-scope items noted for `docs/TODO.md`
- Transformation Document - The deliverable should specify that during the execution of recommended items any architecture changes are captured in `docs/Transformation-YYMMDD.md` for future refactors of the upstream code base.

### Process
1. Produce the review document — do NOT implement during review
2. Review and approve findings with the user
3. Implement approved items in focused commits
4. Re-run tests after each change

## Planned Work
- **No-monitor feature**: Unmonitor series/episodes on cutoff met (similar to Radarr implementation — see `docs/Spec-UnMonitor.md` when created)
- **Dependency updates**: Update all NuGet and Yarn dependencies to latest compatible versions
- **Code review**: Thorough review covering performance, security, best practices, reliability, robustness, and unit tests

## Relationship to Radarr
Sonarr is the original *arr project (formerly NzbDrone). Radarr was forked from Sonarr for movies. Both share similar architecture, patterns, and the `NzbDrone.*` namespace. Work done here may inform upstream contributions. Radarr is at `D:\Dev\Radarr` on .NET 8; Sonarr is ahead on .NET 10.

## Releases
Before doing a release check that all primary documents are updated and current with respect to what you know of the changes made. This includes TODO.md, completed.md and readme.md (in the root). Then do a commit and push to capture those changes in the remote before starting the normal release procedure.

All releases should have a thorough description in markdown format. Descriptions should start with an intro paragraph giving a broad summary of changes, improvements and fixes then list in order:
1. New Features: What they are, how they work and what benefit they bring
2. Code improvements: What changes to existing feature or code was made and why
3. Bug fixes: What bugs were fixed and how
4. Anything else we want to say about this release
