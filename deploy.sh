#!/usr/bin/env bash
# Deploy Sonarr dev build to local installation
# Usage: bash deploy.sh [--clean]
#   --clean: Remove old binaries before copying (recommended for major upgrades)

set -euo pipefail

INSTALL_DIR="D:/Apps/Sonarr"
BUILD_DIR="d:/Dev/Sonarr/_output"
BACKEND_DIR="$BUILD_DIR/net10.0-windows"
UI_DIR="$BUILD_DIR/UI"

# Preserved paths (never deleted)
PRESERVE=(
  "config.xml"
  "sonarr.db"
  "logs.db"
  "Backups"
  "logs"
)

echo "=== Sonarr Deploy ==="
echo "Source:  $BUILD_DIR"
echo "Target:  $INSTALL_DIR"

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

# Clean mode: remove everything except preserved paths
if [[ "${1:-}" == "--clean" ]]; then
  echo ""
  echo "Cleaning install directory (preserving config/db/backups/logs)..."
  for item in "$INSTALL_DIR"/*; do
    basename=$(basename "$item")
    skip=false
    for p in "${PRESERVE[@]}"; do
      if [[ "$basename" == "$p" ]]; then
        skip=true
        break
      fi
    done
    if [[ "$skip" == false ]]; then
      echo "  Removing: $basename"
      rm -rf "$item"
    else
      echo "  Keeping:  $basename"
    fi
  done
fi

# Copy backend DLLs (net10.0-windows includes tray app + all dependencies)
echo ""
echo "Copying backend ($(ls "$BACKEND_DIR" | wc -l) files)..."
cp -r "$BACKEND_DIR"/* "$INSTALL_DIR/"

# Copy frontend UI
echo "Copying frontend UI..."
mkdir -p "$INSTALL_DIR/UI"
cp -r "$UI_DIR"/* "$INSTALL_DIR/UI/"

echo ""
echo "=== Deploy complete ==="
echo "Start with: \"$INSTALL_DIR/Sonarr.exe\" -data=\"D:\\Apps\\Sonarr\""
echo "Web UI:     http://localhost:9103"
