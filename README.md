# why.fi

> A modern fullstack web application powering robust APIs and machine learning capabilities.

![License](https://img.shields.io/github/license/notysozu/why.fi) ![Frontend](https://img.shields.io/badge/frontend-React%20%7C%20TypeScript-blue) ![Backend](https://img.shields.io/badge/backend-Python%20%7C%20FastAPI-green)

## Overview
why.fi is a fullstack web application that delivers robust APIs and machine learning capabilities through a seamless user interface. Designed for developers and data scientists, it solves the complexity of integrating advanced ML models into production-ready web apps. By coupling a high-performance FastAPI backend with a reactive React frontend, why.fi provides an end-to-end framework that accelerates intelligent application development.

## Features
- **Fluid User Interfaces**: Delivers snappy, interactive frontends using React 19 and Vite
- **Intelligent Backends**: Exposes robust machine learning inference endpoints via FastAPI
- **Reliable Code Quality**: Ensures stability with integrated ESLint and comprehensive Pytest suites
- **Streamlined Deployments**: Simplifies environment setup through pre-configured Docker containerization
## Prerequisites
- [Node.js](https://nodejs.org/) ≥ 20.0
- [Python](https://www.python.org/) ≥ 3.10
- [Docker](https://www.docker.com/) (optional, for containerized deployments)

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Python 3, FastAPI, Pytest
- **Tools**: ESLint, Docker

---

## 🤖 AI Agent Commands (AUTHORITATIVE)

*Note: AI Agents must use these exact commands when operating in this repository.*

<!-- AUDIT: Rewrite installation for end-to-end reproducibility -->
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

<!-- AUDIT: Missing Usage examples -->
<!-- AUDIT: Missing Configuration section (if applicable) -->
<!-- AUDIT: Missing Project Structure tree -->
<!-- AUDIT: Missing Roadmap & Status -->

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

<!-- AUDIT: Missing Contributing guidelines -->
<!-- AUDIT: Missing License section -->
