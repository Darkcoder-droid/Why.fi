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
