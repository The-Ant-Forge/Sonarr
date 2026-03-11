# <img width="24px" src="./Logo/256.png" alt="Sonarr"></img> Sonarr (v5-develop fork)

[![Translated](https://translate.servarr.com/widget/servarr/sonarr/svg-badge.svg)](https://translate.servarr.com/engage/servarr/)
[![Backers on Open Collective](https://opencollective.com/Sonarr/backers/badge.svg)](#backers)
[![Sponsors on Open Collective](https://opencollective.com/Sonarr/sponsors/badge.svg)](#sponsors)
[![Mega Sponsors on Open Collective](https://opencollective.com/Sonarr/megasponsors/badge.svg)](#mega-sponsors)

Sonarr is a PVR for Usenet and BitTorrent users. It can monitor multiple RSS feeds for new episodes of your favorite shows and will grab, sort and rename them. It can also be configured to automatically upgrade the quality of files already downloaded when a better quality format becomes available.

> **This is a personal development fork** based on the `v5-develop` branch of [Sonarr/Sonarr](https://github.com/Sonarr/Sonarr). It contains experimental changes spanning security, correctness, dependency modernization, and a new feature. See [Changes from upstream](#changes-from-upstream) below.

## Changes from upstream

### Security hardening

- **Path traversal protection** — `FileSystemController` now validates and restricts path input to configured root folders, preventing arbitrary filesystem reads ([spec 6.1](docs/spec-code-review-260310.md))
- **Secret leak fix** — ProwlProxy no longer logs API keys in error messages ([spec 18.3](docs/spec-code-review-260310.md))
- **Credential privacy annotations** — `HostConfigResource` password fields now have `[Privacy]` attributes to prevent accidental exposure in API responses ([spec 6.2](docs/spec-code-review-260310.md))
- **SignalR log sanitization** — Removed full message body logging from SignalR debug output ([spec 15.1](docs/spec-code-review-260310.md))
- **SSRF and auth/authz audit** — Comprehensive review confirming admin-trust model and CORS+API-key architecture are sound ([spec 18.1, 18.2](docs/spec-code-review-260310.md))

### Correctness and robustness

- **NullReferenceException fixes** — `SingleOrDefault().ToResource()` patterns in `SeriesController`, `CalendarController`, and `QueueController` now guard against null ([spec 11.1](docs/spec-code-review-260310.md))
- **Swallowed exception fixes** — 5 catch blocks that silently discarded errors now log properly ([spec 5.1](docs/spec-code-review-260310.md))
- **Test assertion bug** — `CoverExistsSpecificationFixture` test that asserted the wrong boolean value ([spec 8.1](docs/spec-code-review-260310.md))
- **Silent error in DelayProfileService** — Now throws `NotFoundException` instead of returning silently ([spec 5.2](docs/spec-code-review-260310.md))
- **X509 certificate validation tests** — New test suite for previously-untested security-critical code ([spec 8.2](docs/spec-code-review-260310.md))
- **Media info caching** — `VideoFileInfoReader` now caches ffprobe results by path/mtime/size to avoid redundant reads ([spec 10.1](docs/spec-code-review-260310.md))
- **Frontend initialization guard** — `window.Sonarr` access protected against race conditions ([spec 11.3](docs/spec-code-review-260310.md))

### New feature: auto-unmonitor on cutoff

- **Disable monitoring when quality cutoff is met** — Series and episodes can be automatically unmonitored once the desired quality is reached, similar to Radarr's implementation. See [Spec-UnMonitor.md](docs/Spec-UnMonitor.md)

### Dependency modernization

Removed **20+ frontend dependencies** by replacing with native browser APIs and inlined implementations. Upgraded all remaining dependencies to latest compatible versions. Full details in [Spec-Dependency-Update.md](docs/Spec-Dependency-Update.md).

**Removed packages** (replaced with native APIs):
- `copy-to-clipboard` → `navigator.clipboard.writeText()`
- `react-text-truncate` → CSS `-webkit-line-clamp`
- `react-lazyload` → native `loading="lazy"`
- `react-custom-scrollbars-2` → CSS `overflow-y: auto` with custom scrollbar styling
- `jdu` → `String.normalize('NFKD')` + regex
- `qs` → `URLSearchParams`
- `stacktrace-js` → native `error.stack`
- `use-debounce` → custom `useDebouncedCallback` hook
- `react-measure` → `react-use-measure` (already present)
- `@juggle/resize-observer` → native `ResizeObserver`
- `core-js` → no polyfills needed (tightened browserslist)
- `polyfills.js` → removed entirely (console shims, `Object.groupBy`)
- `jquery` → native `fetch` API
- `redux-localstorage` → inlined store enhancer

**Major upgrades:**
- ESLint 8→9 (flat config), Prettier 2→3, Stylelint 15→17
- NLog 5→6, Sentry SDK 5→6, `@sentry/browser` 7→10
- Ical.Net 5, Selenium 4, RestSharp 114, NUnit 4, FluentAssertions 8
- All NuGet and Yarn packages bumped to latest safe versions

### Code review

A comprehensive 17-category code review covering security, correctness, and maintainability across the entire codebase. All three execution lanes (A: Security, B: Correctness, C: Maintainability) are complete. See [spec-code-review-260310.md](docs/spec-code-review-260310.md).

### Codebase cleanup

- Removed dead code: stale polyfills, unused aliases, obsolete TODO markers
- Resolved 30+ stale TODO/FIXME/HACK markers across backend and frontend
- Triaged 7 stale `[Ignore]` test markers (fixed, removed, or documented)
- Replaced abandoned `react-custom-scrollbars-2` with CSS-only scroller
- Removed V3 backwards-compatibility fallback from V5 `ProviderControllerBase`

## Documentation

| Document | Description |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Project guide, build instructions, coding standards |
| [docs/TODO.md](docs/TODO.md) | Remaining work items and deferred upgrades |
| [docs/spec-code-review-260310.md](docs/spec-code-review-260310.md) | Full code review findings (17 categories, 3 lanes) |
| [docs/Spec-Dependency-Update.md](docs/Spec-Dependency-Update.md) | Dependency audit and upgrade plan |
| [docs/Spec-UnMonitor.md](docs/Spec-UnMonitor.md) | Auto-unmonitor feature specification |

## Getting Started

- [Download/Installation](https://sonarr.tv/#downloads-v3)
- [FAQ](https://wiki.servarr.com/sonarr/faq)
- [Wiki](https://wiki.servarr.com/Sonarr)
- [API Documentation](https://sonarr.tv/docs/api)
- [Donate](https://sonarr.tv/donate)

## Support

Note: GitHub Issues are for Bugs and Feature Requests Only

- [Forums](https://forums.sonarr.tv/)
- [Discord](https://discord.gg/M6BvZn5)
- [GitHub - Bugs and Feature Requests Only](https://github.com/Sonarr/Sonarr/issues)
- [IRC](https://web.libera.chat/?channels=#sonarr)
- [Reddit](https://www.reddit.com/r/sonarr)
- [Wiki](https://wiki.servarr.com/sonarr)

## Features

### Current Features

- Support for major platforms: Windows, Linux, macOS, Raspberry Pi, etc.
- Automatically detects new episodes
- Can scan your existing library and download any missing episodes
- Can watch for better quality of the episodes you already have and do an automatic upgrade. _eg. from DVD to Blu-Ray_
- Automatic failed download handling will try another release if one fails
- Manual search so you can pick any release or to see why a release was not downloaded automatically
- Fully configurable episode renaming
- Full integration with SABnzbd and NZBGet
- Full integration with Kodi, Plex (notification, library update, metadata)
- Full support for specials and multi-episode releases
- And a beautiful UI

## Contributing

### Development

This project exists thanks to all the people who contribute. [Contribute](CONTRIBUTING.md).

<a href="https://github.com/Sonarr/Sonarr/graphs/contributors"><img src="https://opencollective.com/Sonarr/contributors.svg?width=890&button=false" /></a>

### Supporters

This project would not be possible without the support of our users and software providers.
[**Become a sponsor or backer**](https://opencollective.com/sonarr) to help us out!

#### Mega Sponsors

[![Sponsors](https://opencollective.com/sonarr/tiers/mega-sponsor.svg?width=890)](https://opencollective.com/sonarr/contribute/mega-sponsor-21443/checkout)

#### Sponsors

[![Flexible Sponsors](https://opencollective.com/sonarr/sponsors.svg?width=890)](https://opencollective.com/sonarr/contribute/sponsor-21457/checkout)

#### Backers

[![Backers](https://opencollective.com/sonarr/backers.svg?width=890)](https://opencollective.com/sonarr/contribute/backer-21442/checkout)

#### JetBrains

Thank you to [<img src="https://resources.jetbrains.com/storage/products/company/brand/logos/jetbrains.png" alt="JetBrains" width="96">](http://www.jetbrains.com/) for providing us with free licenses to their great tools

[<img src="https://resources.jetbrains.com/storage/products/company/brand/logos/TeamCity.png" alt="TeamCity" width="64">](http://www.jetbrains.com/teamcity/)

[<img src="https://resources.jetbrains.com/storage/products/company/brand/logos/ReSharper.png" alt="ReSharper" width="64">](http://www.jetbrains.com/resharper/)

[<img src="https://resources.jetbrains.com/storage/products/company/brand/logos/dotTrace.png" alt="dotTrace" width="64">](http://www.jetbrains.com/dottrace/)

[<img src="https://resources.jetbrains.com/storage/products/company/brand/logos/Rider.png" alt="Rider" width="64">](http://www.jetbrains.com/rider/)

### Licenses

- [GNU GPL v3](http://www.gnu.org/licenses/gpl.html)
- Copyright 2010-2025
