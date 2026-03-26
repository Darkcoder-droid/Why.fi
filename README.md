# why.fi

why.fi is a webcam-based emotion-mimic game with a Vite/React frontend in [frontend](/home/sonukumar/Documents/projects/why.fi/frontend) and a FastAPI backend in [backend](/home/sonukumar/Documents/projects/why.fi/backend).

## Single Vercel deployment

This repo is now configured to deploy as one Vercel project:

- The Vite frontend is built from [frontend](/home/sonukumar/Documents/projects/why.fi/frontend).
- The built site is served from `frontend/dist`.
- The FastAPI backend in [backend/main.py](/home/sonukumar/Documents/projects/why.fi/backend/main.py) is exposed under `/api/*`.
- The frontend uses same-origin API paths in production, so the browser talks to the backend through the same Vercel domain.

The repo-level Vercel config lives in [vercel.json](/home/sonukumar/Documents/projects/why.fi/vercel.json).

## How to deploy on Vercel

1. Sign in to Vercel and click `Add New...` -> `Project`.
2. Import this GitHub repository.
3. Keep the root directory set to the repository root so Vercel can use [vercel.json](/home/sonukumar/Documents/projects/why.fi/vercel.json).
4. In `Settings` -> `Environment Variables`, add `FRONTEND_ORIGIN` with your production domain, for example `https://why.fi`.
5. Deploy once to verify the frontend loads and `/api/health` responds.
6. After the project is linked, each push to the connected branch will redeploy both the frontend and backend in the same Vercel app.

## Local development

Run the frontend and backend separately during development:

1. Start the FastAPI server from [backend](/home/sonukumar/Documents/projects/why.fi/backend).
2. Start Vite from [frontend](/home/sonukumar/Documents/projects/why.fi/frontend).
3. The frontend defaults to `http://127.0.0.1:8001` in dev mode, so no extra env var is required locally.

`VITE_API_URL` is now optional. It is only useful if you want to point the frontend at a non-default API host for preview or staging builds.

## Backend behavior

[backend/main.py](/home/sonukumar/Documents/projects/why.fi/backend/main.py) now:

- exposes a FastAPI `app` instance that Vercel can import
- serves HTTP endpoints at both local paths like `/captures` and deployed paths like `/api/captures`
- returns capture image URLs from `/api/images/...`
- allows CORS from localhost and your configured production domain

## Important caveat

Vercel's Python serverless runtime is a good fit for normal HTTP endpoints such as `/api/health` and `/api/captures`. It is not a strong fit for persistent WebSocket connections, so the current realtime `/ws` emotion-streaming flow may still need a separate host or a different architecture for production.
