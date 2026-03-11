#!/usr/bin/env bash
# Deploy Sonarr dev build to local installation
# Usage: bash deploy.sh [--clean]
#
# Standard deploy: wipes bin/ and copies fresh build output.
#   Preserves data files (config.xml, sonarr.db, logs.db, Backups/, logs/).
#
# Clean deploy (--clean): wipes the ENTIRE install directory for a fresh start.
#   You will lose config, database, and logs. Back up first if needed.
#
# Directory layout matches the official Inno Setup installer:
#   D:/Apps/Sonarr/           ← data directory (config, db, logs, backups)
#   D:/Apps/Sonarr/bin/       ← application binaries, UI, localization

set -euo pipefail

INSTALL_DIR="D:/Apps/Sonarr"
BIN_DIR="$INSTALL_DIR/bin"
BUILD_DIR="d:/Dev/Sonarr/_output"
BACKEND_DIR="$BUILD_DIR/net10.0-windows"
UI_DIR="$BUILD_DIR/UI"

MODE="standard"
if [[ "${1:-}" == "--clean" ]]; then
  MODE="clean"
fi

echo "=== Sonarr Deploy ($MODE) ==="
echo "Source:  $BUILD_DIR"
echo "Target:  $BIN_DIR"

# Verify build output exists
if [[ ! -f "$BACKEND_DIR/Sonarr.exe" ]]; then
  echo "ERROR: Tray app not built. Run:"
  echo "  dotnet build src/Sonarr.sln -c Release"
  echo "  dotnet build src/NzbDrone/Sonarr.csproj -c Release -p:EnableAnalyzers=false"
  exit 1
fi

if [[ ! -f "$UI_DIR/index.html" ]]; then
  echo "ERROR: Frontend not built. Run: yarn build"
  exit 1
fi

# Check if Sonarr is running
if tasklist.exe 2>/dev/null | grep -qi "Sonarr"; then
  echo "ERROR: Sonarr is running. Stop it first before deploying."
  exit 1
fi

if [[ "$MODE" == "clean" ]]; then
  # Clean mode: wipe entire install directory (config, db, logs — everything)
  echo ""
  echo "CLEAN DEPLOY: Removing entire install directory..."
  if [[ -d "$INSTALL_DIR" ]]; then
    rm -rf "$INSTALL_DIR"
    echo "  Removed: $INSTALL_DIR"
  fi
else
  # Standard mode: wipe bin/ only, preserve data files
  echo ""
  if [[ -d "$BIN_DIR" ]]; then
    echo "Removing bin/..."
    rm -rf "$BIN_DIR"
  fi

  # Also clean up any stale flat-layout files from previous deploys
  # (DLLs/EXEs that were copied to root instead of bin/)
  stale_count=0
  for item in "$INSTALL_DIR"/*.dll "$INSTALL_DIR"/*.exe "$INSTALL_DIR"/*.pdb "$INSTALL_DIR"/*.xml "$INSTALL_DIR"/*.json; do
    if [[ -f "$item" ]]; then
      basename=$(basename "$item")
      # Preserve data files
      if [[ "$basename" == "config.xml" ]]; then
        continue
      fi
      echo "  Removing stale: $basename"
      rm -f "$item"
      stale_count=$((stale_count + 1))
    fi
  done
  # Clean stale directories that belong in bin/
  for dir in "$INSTALL_DIR/UI" "$INSTALL_DIR/Localization" "$INSTALL_DIR/asp"; do
    if [[ -d "$dir" ]]; then
      echo "  Removing stale: $(basename "$dir")/"
      rm -rf "$dir"
      stale_count=$((stale_count + 1))
    fi
  done
  if [[ $stale_count -gt 0 ]]; then
    echo "  Cleaned $stale_count stale flat-layout items from root"
  fi
fi

# Copy backend DLLs into bin/ (matches official installer layout)
echo ""
mkdir -p "$BIN_DIR"
echo "Copying backend ($(ls "$BACKEND_DIR" | wc -l) files) to bin/..."
cp -r "$BACKEND_DIR"/* "$BIN_DIR/"

# Copy frontend UI into bin/UI/
echo "Copying frontend UI to bin/UI/..."
mkdir -p "$BIN_DIR/UI"
cp -r "$UI_DIR"/* "$BIN_DIR/UI/"

echo ""
echo "=== Deploy complete ($MODE) ==="
echo "Start with: \"$BIN_DIR/Sonarr.exe\" -data=\"D:\\Apps\\Sonarr\""
echo "Web UI:     http://localhost:9103"
