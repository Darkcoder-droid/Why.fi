#!/usr/bin/env bash

DETECTED_OS="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    DETECTED_OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    DETECTED_OS="macos"
fi
PKG_MGR=""
if command -v apt &> /dev/null; then PKG_MGR="apt-get";
elif command -v brew &> /dev/null; then PKG_MGR="brew";
elif command -v dnf &> /dev/null; then PKG_MGR="dnf";
elif command -v pacman &> /dev/null; then PKG_MGR="pacman";
fi
echo "→ Installing system dependencies..."
if [ "$PKG_MGR" = "apt-get" ]; then sudo apt-get update && sudo apt-get install -y python3-venv python3-pip nodejs npm; fi
