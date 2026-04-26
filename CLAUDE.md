# Sonarr - Project Guide

## What is Sonarr?
TV series collection manager for Usenet/BitTorrent. Users select shows via web UI, Sonarr monitors RSS feeds for new episodes, searches indexers, sends to download clients, and organizes files for Plex/media servers. Supports automatic quality upgrades.

## Architecture
- **Backend**: C# .NET 10 (solution at `src/Sonarr.sln`)
- **Frontend**: React/TypeScript with webpack (`frontend/src/`)
- **API**: REST API v3 (`src/Sonarr.Api.V3/`) and v5 (`src/Sonarr.Api.V5/`)
- **Database**: SQLite (migrations in `src/NzbDrone.Core/Datastore/`)

## Key Backend Projects
Core logic is in `NzbDrone.Core/`, APIs in `Sonarr.Api.V3/` (stable) and `Sonarr.Api.V5/` (next-gen), shared utilities in `NzbDrone.Common/`, hosting in `NzbDrone.Host/`. Entry points: `NzbDrone.Console/` (console) and `NzbDrone/` (Windows tray).

**Note**: Namespace is `NzbDrone.*` (legacy), project files are `Sonarr.*.csproj`.

## Code Style
- **C#**: 4-space indent, `var` everywhere, `_camelCase` for private fields, no `this.` qualifier
- **Frontend**: 2-space indent (JS/TS/CSS)
- .editorconfig enforced; tests use NUnit
- Test projects mirror source (`NzbDrone.Core.Test/` tests `NzbDrone.Core/`)

## Prerequisites
- **.NET 10 SDK** v10.0.203 (pinned in `global.json`; project targets `net10.0`)
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

### Versioning convention

Tags follow the pattern `v{upstream}-antforge.{commit-count}`:

| Tag | Meaning |
|---|---|
| `v4.0.17-antforge.80` | 80 of our own commits, rooted in upstream v4.0.17 |
| `v4.0.18-antforge.95` | After cherry-picking from upstream v4.0.18 |

The upstream version part reflects which stable release we're aligned with. The `antforge.N` counter is the number of our own commits (`git log --oneline v5-develop --not --remotes=upstream | wc -l`). When cherry-picking from a new upstream release, bump the upstream part.

### Documentation or commentary
Never use real TV show names. Always make up example ones.

## Code Review
See `docs/Spec-CodeReview.md` for the full review checklist and process.

## Planned Work
- **Code review**: Thorough review covering performance, security, best practices, reliability, robustness, and unit tests

## Git & Upstream

### Repository status
This is a **standalone repository** (detached from the GitHub fork of Sonarr/Sonarr). The `upstream` git remote is retained for cherry-picking useful commits. PRs are not sent upstream.

### Remotes
- `origin` → `The-Ant-Forge/Sonarr` (standalone)
- `upstream` → `Sonarr/Sonarr` (reference for cherry-picks)

### Incorporating upstream changes
Cherry-pick individual commits rather than merging/rebasing, as the histories have diverged.

```bash
git fetch upstream
git log main..upstream/main --oneline         # review new commits
git cherry-pick <sha>                         # pick what we need
```

## Relationship to Radarr
Sonarr is the original *arr project (formerly NzbDrone). Radarr was forked from Sonarr for movies. Both share similar architecture, patterns, and the `NzbDrone.*` namespace. Radarr is at `D:\Dev\Radarr` on .NET 8; Sonarr is ahead on .NET 10.

## Releases
Before doing a release check that all primary documents are updated and current with respect to what you know of the changes made. This includes TODO.md, completed.md and readme.md (in the root). Then do a commit and push to capture those changes in the remote before starting the normal release procedure.

All releases should have a thorough description in markdown format. Descriptions should start with an intro paragraph giving a broad summary of changes, improvements and fixes then list in order:
1. New Features: What they are, how they work and what benefit they bring
2. Code improvements: What changes to existing feature or code was made and why
3. Bug fixes: What bugs were fixed and how
4. Anything else we want to say about this release
