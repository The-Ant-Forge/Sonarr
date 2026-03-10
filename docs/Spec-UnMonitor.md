# Spec: Unmonitor on Cutoff Met

## Problem

Sonarr continues monitoring episodes after download, searching indexers for upgrades even when the imported file already meets the quality profile's cutoff. This wastes indexer API calls, bandwidth, and download client resources.

## Solution

A new global setting **Disable Monitoring** (default: off) in Settings > Media Management > File Management. When enabled, episodes are automatically unmonitored after a file import once the imported file's quality meets or exceeds the quality profile's cutoff.

### UI Specification

- **Location**: Settings > Media Management > File Management section
- **Label**: "Disable Monitoring"
- **Type**: Checkbox
- **Description**: "Turn off monitoring of downloaded media once the quality cutoff is met"
- **Default**: Off (unchecked)

## Behaviour

- **Trigger**: `EpisodeFileAddedEvent` — fires after every successful import (new download, quality upgrade, or manual import)
- **Check**: Uses `IUpgradableSpecification.QualityCutoffNotMet()` to compare the imported file's quality against the series' quality profile cutoff
- **Action**: If cutoff is met and the setting is enabled, sets `episode.Monitored = false` for each affected episode before persisting
- **Scope**: Quality cutoff only (not custom format score cutoff). Custom format cutoff can be added later if needed

### When it fires

| Scenario | Cutoff met? | Result |
|----------|-------------|--------|
| New download at or above cutoff | Yes | Unmonitored |
| New download below cutoff | No | Stays monitored |
| Upgrade that reaches cutoff | Yes | Unmonitored |
| Upgrade still below cutoff | No | Stays monitored |
| Manual import at cutoff | Yes | Unmonitored |
| Setting is off | N/A | No change (existing behaviour) |

### Relationship to existing settings

- **Unmonitor Deleted Episodes** (`AutoUnmonitorPreviouslyDownloadedEpisodes`): Unmonitors when a file is *deleted* (non-upgrade). Complementary — one fires on file add, the other on file delete.
- **Download Propers and Repacks**: Still applies while the episode is monitored. Once unmonitored by this setting, no further searching occurs.

## Implementation

### Config layer

| File | Change |
|------|--------|
| `IConfigService.cs` | `bool UnmonitorOnCutoffMet { get; set; }` |
| `ConfigService.cs` | Property with `GetValueBoolean("UnmonitorOnCutoffMet")`, default `false` |

### API layer (V3 and V5)

| File | Change |
|------|--------|
| `Sonarr.Api.V3/Config/MediaManagementConfigResource.cs` | Add `UnmonitorOnCutoffMet` property + mapper |
| `Sonarr.Api.V5/Settings/MediaManagementSettingsResource.cs` | Add `UnmonitorOnCutoffMet` property + mapper |

Both API versions are maintained: V5 is used by the frontend; V3 is preserved for third-party tool compatibility.

### Business logic

| File | Change |
|------|--------|
| `EpisodeService.cs` | Inject `IUpgradableSpecification` and `ISeriesService`, check cutoff in `Handle(EpisodeFileAddedEvent)` handler |

The handler will:
1. Check if `UnmonitorOnCutoffMet` is enabled
2. Load the series and its quality profile
3. For each episode linked to the added file, call `QualityCutoffNotMet()`
4. If cutoff IS met (i.e. `QualityCutoffNotMet()` returns `false`), set `episode.Monitored = false`
5. Persist the change via `EpisodeRepository`

### Frontend

| File | Change |
|------|--------|
| `useMediaManagementSettings.ts` | Add `unmonitorOnCutoffMet: boolean` to `MediaManagementSettingsModel` |
| `MediaManagement.tsx` | Add checkbox in File Management section, below existing "Unmonitor Deleted Episodes" |

### Localization

| File | Change |
|------|--------|
| `en.json` | `UnmonitorOnCutoffMet` label key ("Disable Monitoring") |
| `en.json` | `UnmonitorOnCutoffMetHelpText` help text key ("Turn off monitoring of downloaded media once the quality cutoff is met") |

## Testing

### Unit tests

- `EpisodeService` tests: verify unmonitoring triggers on cutoff met, does not trigger when cutoff not met, does not trigger when setting is off
- Config tests: verify default value is `false`, verify persistence round-trip

### Manual testing

- Toggle appears in Settings > Media Management > File Management
- Setting persists across page reloads
- Import of file at/above cutoff unmonitors the episode(s) when enabled
- Import of file below cutoff leaves monitoring unchanged
- Setting disabled: no monitoring changes on any import
