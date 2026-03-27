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

| Category | Technologies |
|---|---|
| **Core Languages** | TypeScript, Python 3 |
| **Frontend Frameworks** | React 19, Vite |
| **Backend Frameworks** | FastAPI |
| **Infrastructure** | Docker, PostgreSQL |
| **Dev Tooling** | Pytest, ESLint |

---

## 🤖 AI Agent Commands (AUTHORITATIVE)

*Note: AI Agents must use these exact commands when operating in this repository.*

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/notysozu/why.fi.git
   cd why.fi
   ```

2. **Set up the Frontend:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. **Set up the Backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   pip install -r requirements-test.txt
   cd ..
   ```

4. **Verify Installation:**
   ```bash
   # Verify frontend dependencies
   cd frontend && npm list vite
   
   # Verify backend dependencies
   cd ../backend && python -c "import fastapi; print('FastAPI installed')"
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

## Usage

To start using why.fi locally, launch both the frontend and backend development servers.

1. **Start the Backend API:**
   ```bash
   cd backend
   source venv/bin/activate
   fastapi dev main.py
   ```
   *The API will be available at `http://localhost:8000`.*

2. **Start the Frontend Client:**
   ```bash
   cd frontend
   npm run dev
   ```
   *The web interface will start automatically via Vite on `http://localhost:5173`.*

<!-- TODO: add demo GIF -->

### API Example
You can quickly test the health of the backend directly via `curl`:
```bash
curl -X GET "http://localhost:8000/api/health" \
     -H "Accept: application/json"
```
## Configuration

To customize your environment, copy `.env.example` to `.env` and configure the following variables:

| Variable | Default | Description |
|---|---|---|
| `APPLICATION_ENV` | `development` | Deployment environment (development, production) |
| `APP_PORT` | `3000` | Port for the main application |
| `FRONTEND_URL` | `http://localhost:3000` | URL for the frontend application |
| `BACKEND_URL` | `http://localhost:8000` | Base URL of the backend API |
| `DB_HOST` | `localhost` | Database host address |
| `DB_PORT` | `5432` | Database port number |
| `DB_USER` | `admin` | Database username |
| `DB_PASSWORD` | `secret` | Database password |
| `DB_NAME` | `whyfi_db` | Name of the postgres database |
| `JWT_SECRET` | *none* | Required for JWT token signing (Required) |
| `JWT_EXPIRATION_HOURS` | `24` | Hours until a JWT token expires |
| `SESSION_SECRET` | *none* | Required for secure session management (Required) |
| `STRIPE_PUBLIC_KEY` | *none* | Public key for Stripe integration |
| `STRIPE_SECRET_KEY` | *none* | Secret key for Stripe backend operations |
| `SENDGRID_API_KEY` | *none* | API key for sending transactional emails |
| `OPENAI_API_KEY` | *none* | API key for OpenAI integrations |
| `ANTHROPIC_API_KEY` | *none* | API key for Anthropic Claude integrations |
## Project Structure

```text
why.fi/
├── api/            # Serverless or legacy API functions
├── backend/        # Python FastAPI application and ML engine
├── frontend/       # React/Vite user interface
└── tests/          # Integration and end-to-end tests
```
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
