# Golf Charity Platform

Supabase-first golf charity platform with:
- React frontend in [`client`](./client)
- Express API in [`server`](./server)
- Supabase for auth and primary data

MongoDB is now optional legacy fallback only.

## Local Setup

### Prerequisites
- Node.js 18+
- Supabase project

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure the frontend

Create `client/.env` from [`client/.env.example`](./client/.env.example):

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_public_key
```

### 3. Configure the backend

Create `server/.env` from [`server/.env.example`](./server/.env.example):

```env
PORT=5000
CLIENT_URL=http://localhost:3000
NODE_ENV=development
FORCE_HTTPS=false
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
USE_MONGODB=false
```

Optional email settings:

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=notifications@golfcharity.local
```

### 4. Run the app

```bash
npm run dev:server
```

In a second terminal:

```bash
npm run dev:client
```

Frontend runs at `http://localhost:3000`.

## Deployment

## Frontend on Vercel

Import the repo and set:
- Root directory: `golf-charity/client`
- Build command: `npm run build`
- Output directory: `build`

Vercel environment variables:

```env
REACT_APP_API_URL=https://your-api-domain/api
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_public_key
```

[`client/vercel.json`](./client/vercel.json) already includes the SPA rewrite needed for React Router.

## API server

The repo still contains an Express API for orchestration and admin operations. If you host it separately, use:
- Root directory: `golf-charity/server`
- Build command: `npm install`
- Start command: `npm start`

Production server env:

```env
NODE_ENV=production
FORCE_HTTPS=true
CLIENT_URL=https://your-vercel-domain
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
USE_MONGODB=false
```

[`server/render.yaml`](./server/render.yaml) is updated for this Supabase-first mode if you use Render temporarily for the API layer.

## Supabase

Keep these keys separate:
- frontend: anon/public key only
- server: service role key only

Never commit `.env` files or service role keys.

## Current State

Working on Supabase-backed flow:
- auth
- charity listing and selection
- donations
- subscription updates
- score tracking
- draws and user results
- admin users
- admin draws
- admin winners
- admin analytics

Legacy Mongo code still exists in the repository for fallback paths, but server startup no longer requires Mongo when Supabase is configured.
