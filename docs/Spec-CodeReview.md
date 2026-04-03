# Code Review Process

Periodically we do a consolidation review covering all source, tests, build config, and metadata.

## Review Checklist

Guiding rule: recommend a change only if it reduces risk or removes recurring cost. Avoid speculative abstraction churn.

### Phase 1 — Exploit / Data Loss / Upgrade Risk
1. **Security & network boundaries** — SSRF via indexers/webhooks/proxies, redirect policy (external→internal bounce), certificate validation, auth header leakage across redirects, secret redaction in logs/errors, API-key/session/CORS/SignalR behavior, path traversal in disk operations, credential storage
2. **Migrations & upgrade safety** — forward-only migration replay, startup after interrupted upgrade, backup restore, config.xml + DB version skew, enum/string key renames persisted in DB, irreversible migrations, whether obsolete fields must remain for compatibility
3. **API version parity** — v3/v5 route parity, request/response shape drift, deprecated fields still required by old clients, both versions tested
4. **Upstream compatibility** — schema changes that break rollback, config key collisions with upstream, patterns that diverge unnecessarily, merge conflict risk assessment
5. **Configuration wiring** — config keys read but not settable (or vice versa), missing UI for API-exposed settings, wrong defaults on fresh install vs upgrade

### Phase 2 — Runtime Correctness
6. **API contracts** — input validation, response shape consistency, correct HTTP status codes, no internal types leaked
7. **Error handling** — swallowed exceptions, inconsistent patterns (some throw, some return null, some log-and-continue for the same class of error), missing user-facing messages
8. **Command pipeline & scheduling** — duplicate command execution, exclusivity flag correctness, retry/cancellation behavior, long-running scan/import/search work, queue starvation
9. **Concurrency & async** — `async void`, missing `CancellationToken` propagation, `Task.Result`/`.Wait()` deadlock risks, shared mutable state without synchronization
10. **Resource management** — undisposed HTTP clients/streams/DB connections, missing `finally`/`using` blocks, event handler leaks, file handle retention
11. **Cross-platform filesystem** — path normalization, case sensitivity, symlink/relative path handling, long paths, file locking, permission failures, process invocation differences
12. **Frontend state & hooks** — stale closures, missing dependency array entries, derived state that should be computed, prop drilling that should be context, unnecessary re-renders, missing memoization

### Phase 3 — Structural Debt
13. **Dead code & stale markers** — unused functions, classes, modules, imports, unreachable branches, commented-out code, TODO/FIXME/HACK markers to resolve or remove
14. **Dead dependencies** — NuGet/npm packages unused, underused (replaceable with < 20 lines), or superseded by framework APIs
15. **Duplication & abstraction** — repeated logic that should be shared; also over-abstraction where indirection hides bugs
16. **DI wiring & service lifetime** — wrong scope registrations, unused injections, singleton state bugs, circular dependencies
17. **Database queries** — missing indexes, N+1 queries, SQLite write contention, unbounded result sets
18. **Type safety** — frontend: `any` overuse, missing discriminated unions, untyped API responses, legacy JS/Redux boundaries; backend: nullable reference warnings, unchecked casts
19. **Naming & consistency** — mixed conventions, unclear names, stale comments, `NzbDrone` vs `Sonarr` confusion in new code

### Phase 4 — Performance & Operability
20. **Hot-path performance** — unnecessary allocations in loops, LINQ in tight paths, redundant disk/network I/O, missing caching where data is stable
21. **Startup & memory** — slow initialization, unbounded caches, large object pinning, services doing work in constructors
22. **Logging & observability** — missing context in catch blocks, sensitive data exposure, trace-level noise in hot paths, inconsistent levels, log correlation across API/background jobs, generic UI messages hiding root cause

### Phase 5 — Verification & Documentation
23. **Test coverage** — untested code paths, missing edge cases, integration tests that should exist but don't
24. **Stale & quarantined tests** — ignored/flaky tests, assertions that no longer prove anything, test fixtures that no longer reflect runtime wiring
25. **Migration & contract test coverage** — migration replay tests, API contract tests, backup restore tests
26. **Documentation drift** — specs, README, CLAUDE.md sections that no longer match the code

## Deliverable
A review document in `docs/Code-Review-YYMMDD.md` (or similar) with:
- Summary table: Category, Description, Action, Impact, Effort, Risk
- Detailed findings grouped by category, ordered by impact then effort
- Out-of-scope items noted for `docs/TODO.md`
- Transformation Document — during execution of recommended items any architecture changes are captured in `docs/Transformation-YYMMDD.md` for future refactors of the upstream code base.

## Process
1. Produce the review document — do NOT implement during review
2. Review and approve findings with the user
3. Implement approved items in focused commits
4. Re-run tests after each change
5. On completion of review items update the code review doc to reflect tasks done, deferred or ignored.
