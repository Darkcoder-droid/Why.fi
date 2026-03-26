# why.fi

why.fi is a webcam-based emotion-mimic game with a Vite/React frontend in [frontend](/home/sonukumar/Documents/projects/why.fi/frontend) and a FastAPI backend in [backend](/home/sonukumar/Documents/projects/why.fi/backend).

## Deployment split

This repo is now configured for:

- Vercel for the frontend
- Fly.io for the backend

The repo-level Vercel config lives in [vercel.json](/home/sonukumar/Documents/projects/why.fi/vercel.json).
The Fly.io config lives in [fly.toml](/home/sonukumar/Documents/projects/why.fi/fly.toml).

## Frontend on Vercel

1. Sign in to Vercel and click `Add New...` -> `Project`.
2. Import this GitHub repository.
3. Keep the root directory set to the repository root so Vercel can use [vercel.json](/home/sonukumar/Documents/projects/why.fi/vercel.json).
4. In `Settings` -> `Environment Variables`, add `VITE_API_URL` and set it to your Fly backend URL, for example `https://why-fi-api.fly.dev`.
5. Deploy once to verify the frontend loads and can reach the backend.
6. After the project is linked, every push to the connected branch will redeploy the frontend automatically.

## Backend on Fly.io

1. Install the Fly CLI and sign in with `fly auth login`.
2. Update the `app` name in [fly.toml](/home/sonukumar/Documents/projects/why.fi/fly.toml) to a globally unique value before first deploy.
3. From the repo root, launch the backend with `fly launch --config fly.toml --no-deploy` if the app does not exist yet.
4. Set the frontend origin for CORS:
   `fly secrets set FRONTEND_ORIGIN=https://your-frontend-domain.vercel.app`
5. Deploy the backend with `fly deploy`.
6. Check health with `https://<your-fly-app>.fly.dev/health`.

Fly uses [backend/Dockerfile](/home/sonukumar/Documents/projects/why.fi/backend/Dockerfile) to build the Python service and exposes the FastAPI app from [backend/main.py](/home/sonukumar/Documents/projects/why.fi/backend/main.py).

## Local development

Run the frontend and backend separately during development:

1. Start the FastAPI server from [backend](/home/sonukumar/Documents/projects/why.fi/backend).
2. Start Vite from [frontend](/home/sonukumar/Documents/projects/why.fi/frontend).
3. The frontend defaults to `http://127.0.0.1:8001` in dev mode, so no extra env var is required locally.

For production or preview builds on Vercel, `VITE_API_URL` should point to your Fly backend.

## Backend behavior

[backend/main.py](/home/sonukumar/Documents/projects/why.fi/backend/main.py) now:

- exposes a FastAPI `app`
- serves HTTP endpoints like `/health` and `/captures`
- returns capture image URLs from `/images/...`
- allows CORS from localhost and your configured production domain

## Important caveat

Fly.io is a much better fit than Vercel for this backend because it can run the full Python container with OpenCV, MediaPipe, and the realtime WebSocket endpoint. Capture images are still stored on the container filesystem, so they are not durable across machine replacement unless you add a Fly volume or external object storage.
