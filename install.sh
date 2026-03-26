#!/usr/bin/env bash
set -Eeuo pipefail

REPO_URL="${REPO_URL:-https://github.com/notysozu/why.fi.git}"
PROJECT_DIR="${PROJECT_DIR:-why.fi}"
START_APP="${START_APP:-0}"
SCRIPT_DIR="$(pwd)"

log() {
  printf '[why.fi] %s\n' "$1"
}

fail() {
  printf '[why.fi] ERROR: %s\n' "$1" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1
}

detect_os() {
  case "$(uname -s)" in
    Linux) OS_FAMILY="linux" ;;
    Darwin) OS_FAMILY="macos" ;;
    *) fail "Unsupported OS: $(uname -s)" ;;
  esac
}

detect_package_manager() {
  if require_cmd apt; then PKG_MANAGER="apt"
  elif require_cmd pacman; then PKG_MANAGER="pacman"
  elif require_cmd dnf; then PKG_MANAGER="dnf"
  elif require_cmd brew; then PKG_MANAGER="brew"
  else PKG_MANAGER=""
  fi
}

install_packages() {
  local missing=("$@")
  [ "${#missing[@]}" -eq 0 ] && return 0

  log "Installing missing system packages: ${missing[*]}"
  case "$PKG_MANAGER" in
    apt)
      sudo apt update
      sudo apt install -y "${missing[@]}"
      ;;
    pacman)
      sudo pacman -Sy --needed --noconfirm "${missing[@]}"
      ;;
    dnf)
      sudo dnf install -y "${missing[@]}"
      ;;
    brew)
      brew install "${missing[@]}"
      ;;
    *)
      fail "No supported package manager found. Install dependencies manually: git, curl, python3, nodejs, npm."
      ;;
  esac
}

ensure_system_dependencies() {
  local packages=()

  if ! require_cmd git; then
    case "$PKG_MANAGER" in
      apt|dnf|brew|pacman) packages+=("git") ;;
    esac
  fi

  if ! require_cmd curl; then
    case "$PKG_MANAGER" in
      apt|dnf|brew|pacman) packages+=("curl") ;;
    esac
  fi

  if ! require_cmd python3; then
    case "$PKG_MANAGER" in
      apt) packages+=("python3" "python3-venv" "python3-pip") ;;
      pacman) packages+=("python" "python-pip") ;;
      dnf) packages+=("python3" "python3-pip") ;;
      brew) packages+=("python") ;;
    esac
  fi

  if ! require_cmd node; then
    case "$PKG_MANAGER" in
      apt|dnf|brew|pacman) packages+=("nodejs") ;;
    esac
  fi

  if ! require_cmd npm; then
    case "$PKG_MANAGER" in
      apt|dnf|brew|pacman) packages+=("npm") ;;
    esac
  fi

  install_packages "${packages[@]}"
}

clone_or_enter_repo() {
  if [ -f "frontend/package.json" ] && [ -f "backend/main.py" ]; then
    REPO_ROOT="$(pwd)"
    log "Using current directory as repo root: $REPO_ROOT"
    return
  fi

  if [ -d "$PROJECT_DIR/.git" ]; then
    REPO_ROOT="$(cd "$PROJECT_DIR" && pwd)"
    log "Using existing checkout: $REPO_ROOT"
    return
  fi

  log "Cloning repository into $PROJECT_DIR"
  git clone "$REPO_URL" "$PROJECT_DIR"
  REPO_ROOT="$(cd "$PROJECT_DIR" && pwd)"
}

write_env_file() {
  if [ ! -f "$REPO_ROOT/.env.example" ]; then
    fail ".env.example is missing from the repository."
  fi

  if [ ! -f "$REPO_ROOT/.env" ]; then
    cp "$REPO_ROOT/.env.example" "$REPO_ROOT/.env"
    log "Created .env from .env.example"
  else
    log ".env already exists, leaving it unchanged"
  fi
}

setup_backend() {
  cd "$REPO_ROOT"

  if [ ! -d ".venv" ]; then
    log "Creating Python virtual environment"
    python3 -m venv .venv
  else
    log "Using existing Python virtual environment"
  fi

  # shellcheck disable=SC1091
  source ".venv/bin/activate"
  python -m pip install --upgrade pip
  python -m pip install -r backend/requirements.txt
}

setup_frontend() {
  cd "$REPO_ROOT/frontend"
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
  npm run build
}

start_app() {
  cd "$REPO_ROOT"
  log "Starting backend on http://127.0.0.1:8001"
  nohup .venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8001 > backend.log 2>&1 &

  log "Starting frontend dev server on http://127.0.0.1:5173"
  cd "$REPO_ROOT/frontend"
  npm run dev -- --host 0.0.0.0
}

print_summary() {
  log "Setup complete"
  printf '\n'
  printf 'Repo: %s\n' "$REPO_ROOT"
  printf 'Backend install: %s\n' "$REPO_ROOT/.venv"
  printf 'Frontend install: %s\n' "$REPO_ROOT/frontend/node_modules"
  printf '\n'
  printf 'Manual start commands:\n'
  printf '  cd %s\n' "$REPO_ROOT"
  printf '  .venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8001\n'
  printf '  cd %s/frontend && npm run dev\n' "$REPO_ROOT"
  printf '\n'
  printf 'Deployment:\n'
  printf '  Frontend: Vercel with VITE_API_URL=https://your-fly-app.fly.dev\n'
  printf '  Backend: Fly.io using fly.toml\n'
}

main() {
  detect_os
  detect_package_manager
  log "Detected OS: $OS_FAMILY"
  log "Detected package manager: ${PKG_MANAGER:-none}"

  ensure_system_dependencies
  clone_or_enter_repo
  write_env_file
  setup_backend
  setup_frontend
  print_summary

  if [ "$START_APP" = "1" ]; then
    start_app
  else
    log "Set START_APP=1 to launch the backend and frontend automatically after install"
  fi
}

main "$@"
