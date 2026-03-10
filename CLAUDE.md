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

# Backend
dotnet build src/Sonarr.sln -c Release

# Backend — win-x64 self-contained (for deployment)
dotnet publish src/NzbDrone.Console/Sonarr.Console.csproj -c Release -r win-x64 --self-contained

# Quick dev run
dotnet run --project src/NzbDrone.Console/Sonarr.Console.csproj
```
App runs at http://localhost:8989

## Local Testing Deployment

**Installation directory:** `D:\Apps\Sonarr` — a configured Sonarr instance with database, config, and indexers already set up. Deploy build output here for smoke testing.

| Path | Description |
|---|---|
| `D:\Apps\Sonarr/` | Live installation (preserve `config.xml`, `sonarr.db`, `logs.db`, `Backups/`, `logs/`) |
| `_output/net10.0/` | Backend DLLs (copy to install dir root) |
| `_output/UI/` | Frontend assets (copy to install dir as `UI/`) |
| `_tests/net10.0/` | Test assemblies |

**Deploy & run:**
```bash
bash deploy.sh --clean                                           # deploy build output
"D:\Apps\Sonarr\Sonarr.Console.exe" -data="D:\Apps\Sonarr"      # start (port 9103)
```
Web UI: http://localhost:9103 | API key: see `D:\Apps\Sonarr\config.xml`

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

### Documentation or commentary
Never use real TV show names. Always make up example ones.

## Code Review Phases

Periodically we do a consolidation review covering all source, tests, build config, and metadata.

### Review Checklist
1. **Dead code** — unused functions, classes, modules, imports, config keys
2. **Dead dependencies** — libraries that are unused or underused relative
   to what we could replace inline
3. **Duplication** — repeated or near-identical logic that should be shared
4. **Naming & consistency** — mixed conventions, unclear names, stale comments
5. **Error handling** — inconsistent patterns, swallowed exceptions, missing
   user-facing messages
6. **Security** — input validation gaps, credential handling, OWASP patterns
7. **Type safety** — missing annotations, `Any` overuse, type errors
8. **Test gaps** — untested code paths, stale tests, missing edge cases
9. **Documentation drift** — specs, docstrings, or README sections that no
   longer match the code
10. **Performance** — unnecessary work, avoidable allocations, slow patterns
11. **Robustness** — race conditions, resource leaks, missing cleanup
12. **TODO/FIXME/HACK audit** — resolve or remove stale markers

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
