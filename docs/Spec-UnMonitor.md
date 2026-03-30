# Spec: Unmonitor on Download

## Problem

Sonarr continues monitoring episodes after download, searching indexers for upgrades even when the user considers the episode "done." This wastes indexer API calls, bandwidth, and download client resources for users who don't want automatic upgrades.

## Solution

A global setting **Unmonitor On Download** (default: off) in Settings > Media Management > File Management. When enabled, episodes are automatically unmonitored after any file import. Users can re-monitor episodes manually if they want to search for upgrades.

### UI Specification

- **Location**: Settings > Media Management > File Management section (advanced)
- **Label**: "Unmonitor On Download"
- **Type**: Checkbox
- **Description**: "Automatically unmonitor episodes once they are downloaded. Episodes can be re-monitored manually."
- **Default**: Off (unchecked)

## Behaviour

The setting triggers in two scenarios:

### 1. On file import (`EpisodeFileAddedEvent`)

- **Trigger**: Fires after every successful import (new download, quality upgrade, or manual import)
- **Action**: Sets `episode.Monitored = false` for each affected episode in a single DB write alongside the file ID assignment

### 2. On series add with existing files (`SeriesScannedHandler`)

- **Trigger**: When a newly added series is scanned and existing episode files are found on disk
- **Action**: After monitoring rules from add options are applied, unmonitors any episode that already has a file
- **Purpose**: Prevents Sonarr from searching for and downloading inferior versions of episodes already in the library (e.g. when Overseerr adds a show the user already has)

### When it fires

| Scenario | Result |
|----------|--------|
| New download (any quality) | Unmonitored |
| Upgrade import | Unmonitored |
| Manual import | Unmonitored |
| Series added, episodes already have files | Unmonitored |
| Series added, episodes missing files | Stays monitored (searches normally) |
| Setting is off | No change (existing behaviour) |

### Relationship to existing settings

- **Unmonitor Deleted Episodes** (`AutoUnmonitorPreviouslyDownloadedEpisodes`): Unmonitors when a file is *deleted* (non-upgrade). Complementary — one fires on file add, the other on file delete.
- **Download Propers and Repacks**: Still applies while the episode is monitored. Once unmonitored by this setting, no further searching occurs.

## Implementation

### Config layer

| File | Change |
|------|--------|
| `IConfigService.cs` | `bool UnmonitorOnDownload { get; set; }` |
| `ConfigService.cs` | Property with `GetValueBoolean("UnmonitorOnDownload")`, default `false` |

**Note:** Uses a new DB key `UnmonitorOnDownload`, distinct from the upstream `UnmonitorOnCutoffMet` key. This prevents behavioral surprises on upgrade/rollback between this fork and upstream Sonarr.

### API layer (V3 and V5)

| File | Change |
|------|--------|
| `Sonarr.Api.V3/Config/MediaManagementConfigResource.cs` | `UnmonitorOnDownload` property + mapper |
| `Sonarr.Api.V5/Settings/MediaManagementSettingsResource.cs` | `UnmonitorOnDownload` property + mapper |

Both API versions are maintained: V5 is used by the frontend; V3 is preserved for third-party tool compatibility.

### Business logic

| File | Change |
|------|--------|
| `EpisodeService.cs` | Check `UnmonitorOnDownload` in `Handle(EpisodeFileAddedEvent)` handler |
| `EpisodeRepository.cs` | `SetFileId` extended with `bool unmonitor` parameter — combines file ID + monitored flag in a single `SetFields` call |
| `SeriesScannedHandler.cs` | After add options monitoring rules are applied, unmonitor episodes with existing files when `UnmonitorOnDownload` is enabled |

The `EpisodeFileAddedEvent` handler:
1. Checks if `UnmonitorOnDownload` is enabled
2. For each episode linked to the added file, calls `SetFileId(episode, fileId, unmonitor: true)` to set both fields atomically
3. Single DB write per episode (matches `ClearFileId` pattern)

The `SeriesScannedHandler` post-add logic:
1. Normal monitoring rules from add options are applied first (e.g. "Monitor All")
2. If `UnmonitorOnDownload` is enabled, queries all episodes for the series
3. Any episode that is both monitored and has a file is unmonitored
4. This runs before search commands are pushed, so searches only find genuinely missing episodes

### Frontend

| File | Change |
|------|--------|
| `useMediaManagementSettings.ts` | `unmonitorOnDownload: boolean` in settings model |
| `MediaManagement.tsx` | Checkbox in File Management section, below "Unmonitor Deleted Episodes" |

### Localization

| Key | Value |
|-----|-------|
| `UnmonitorOnDownload` | "Unmonitor On Download" |
| `UnmonitorOnDownloadHelpText` | "Automatically unmonitor episodes once they are downloaded or when a newly added series already has the episode files on disk. Prevents searching for episodes you already have. Episodes can be re-monitored manually." |

## Testing

### Unit tests

- `HandleEpisodeFileAddedFixture`: verify unmonitoring triggers when enabled, does not trigger when disabled, handles multi-episode files
- Config tests: verify default value is `false`, verify persistence round-trip

### Manual testing

- Toggle appears in Settings > Media Management > File Management (show advanced)
- Setting persists across page reloads
- Import of any file unmonitors the episode(s) when enabled
- Setting disabled: no monitoring changes on any import
- Episodes can be re-monitored manually after being unmonitored
