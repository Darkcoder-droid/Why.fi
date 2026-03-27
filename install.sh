#!/usr/bin/env bash
set -euo pipefail

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
echo "→ Cloning repository if needed..."
if [ ! -d "why.fi" ] && [ ! -d "frontend" ]; then
    git clone https://github.com/notysozu/why.fi.git
    cd why.fi
fi
echo "→ Setting up project dependencies..."
if [ -d "frontend" ]; then cd frontend && npm install && cd ..; fi
if [ -d "backend" ]; then
    cd backend
    python3 -m venv venv
    source venv/bin/activate || true
    pip install -r requirements.txt || true
    pip install -r requirements-test.txt || true
    cd ..
fi
echo "→ Configuring environment..."
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
fi
echo "→ Building project..."
if [ -d "frontend" ]; then cd frontend && npm run build && cd ..; fi
echo "✓ Installation complete! To start:"
echo "frontend: cd frontend && npm run dev"
echo "backend: cd backend && source venv/bin/activate && fastapi dev main.py"
