# why.fi

## Project Overview
why.fi is a modern fullstack web application. The frontend is built with React, TypeScript, and Vite. The backend is powered by Python (FastAPI/ML Engine), providing robust APIs and machine learning capabilities.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Python 3, FastAPI, Pytest
- **Tools**: ESLint, Docker

---

## 🤖 AI Agent Commands (AUTHORITATIVE)

*Note: AI Agents must use these exact commands when operating in this repository.*

### Installation
```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && pip install -r requirements.txt && pip install -r requirements-test.txt
```

### Development
```bash
# Frontend
cd frontend && npm run dev

# Backend
cd backend && fastapi dev main.py
```

### Testing
```bash
# Frontend (if configured)
cd frontend && npm run test

# Backend (All tests)
cd backend && pytest

# Backend (Watch mode)
cd backend && pytest-watch

# Backend (Coverage)
cd backend && pytest --cov=.
```

### Linting & Formatting
```bash
# Frontend (Check)
cd frontend && npm run lint

# Frontend (Fix)
cd frontend && npm run lint -- --fix
```

### Typechecking
```bash
# Frontend
cd frontend && npx tsc --noEmit
```

### Build
```bash
# Frontend
cd frontend && npm run build
```

### Database
```bash
# Migrate (Alembic placeholder - adjust to actual ORM if different)
cd backend && alembic upgrade head

# Seed (Placeholder script)
cd backend && python scripts/seed.py

# Reset (Placeholder script)
cd backend && python scripts/reset_db.py
```

### Docker
```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Rebuild containers
docker compose build
```

### Clean
```bash
# Clean frontend modules
cd frontend && rm -rf node_modules dist

# Clean Python cache
cd backend && find . -type d -name "__pycache__" -exec rm -r {} +
```

---

## AI Agent Setup

### Configuration Files Table
| File | Purpose |
|------|---------|
| `CLAUDE.md` | specific instructions for Claude Code / Claude.ai. |
| `AGENTS.md` | Rules applied to all automated coding agents. |
| `.cursorrules` | enforced IDE rules for the Cursor editor. |
| `.github/copilot-instructions.md` | Rules for GitHub Copilot Workspaces and PRs. |
| `README.md` | Core commands and instructions. |
| `.env.example` | Environment variable template. |

### How to use with:
- **Claude Code**: Runs autonomously according to `CLAUDE.md`. Simply start `claude` in the terminal.
- **Cursor**: The IDE will automatically read and enforce `.cursorrules` during code generation and editing.
- **Copilot Workspace**: GitHub will parse `.github/copilot-instructions.md` to format pull requests and guide code changes.
