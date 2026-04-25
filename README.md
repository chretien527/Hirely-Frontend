# Hirely

Hirely is a social hiring platform built with `Next.js`, `Express`, and `MongoDB`.
Applicants and jobgivers share one connected app where they can:

- create profiles and upload profile photos
- post updates, project links, images, and videos
- follow and message each other
- publish jobs and apply inside the platform
- screen applicants directly from the employer inbox
- rank and shortlist applicants per job with explainable AI results

## Stack

- Frontend: `Next.js 14`
- Backend: `Express.js`
- Database: `MongoDB + Mongoose`
- Auth: `JWT`

## Project structure

```text
hirely-platform/
|-- backend/
|   |-- config/
|   |-- controllers/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- server.js
|   `-- package.json
|-- frontend/
|   |-- app/
|   |-- components/
|   |-- context/
|   |-- lib/
|   `-- package.json
`-- README.md
```

## Before you run it

Make sure you have:

- `Node.js 20.x`
- `npm`
- a running MongoDB instance, local or Atlas

## Backend setup

1. Open the backend folder:

```bash
cd backend
```

2. Create your `.env` file from `backend/.env.example`.

Use values like these:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hirely
JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=
```

Notes:

- `GEMINI_API_KEY` is optional.
- If you leave it empty, Hirely uses the built-in fallback screening logic.
- `FRONTEND_URLS` can hold a comma-separated list of additional allowed frontend origins in production.
- `UPLOAD_DIR` is optional and lets you point uploads to a persistent directory.

3. Install dependencies and start the API:

```bash
npm install
npm run dev
```

The backend will run on `http://localhost:5000`.

## Frontend setup

1. Open the frontend folder:

```bash
cd frontend
```

2. Create `.env.local` from `frontend/.env.local.example`:

```env
NEXT_PUBLIC_API=http://localhost:5000/api
```

3. Install dependencies and run the frontend:

```bash
npm install
npm run dev
```

The frontend will run on `http://localhost:3000`.

## Deploy on Render

This repository is ready to deploy to Render as two `Node` web services:

- `hirely-api` from `backend/`
- `hirely-web` from `frontend/`

A starter Blueprint file is included at the repo root as `render.yaml`.

### Recommended path

1. Push this repository to GitHub.
2. In Render, create a new `Blueprint` and point it at this repo.
3. During setup, provide:
   - backend `MONGO_URI`
   - backend `FRONTEND_URL`
   - frontend `NEXT_PUBLIC_API`
4. Use your deployed service URLs for those values:
   - `FRONTEND_URL=https://your-frontend-service.onrender.com`
   - `NEXT_PUBLIC_API=https://your-backend-service.onrender.com/api`
5. After the first deploy, add optional backend variables in the Render dashboard if needed:
   - `GEMINI_API_KEY`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_SECURE`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`

### Manual service settings

If you prefer creating services one by one instead of using the Blueprint:

- Backend:
  - Root directory: `backend`
  - Build command: `npm ci`
  - Start command: `npm start`
  - Health check path: `/api/health`
- Frontend:
  - Root directory: `frontend`
  - Build command: `npm ci && npm run build`
  - Start command: `npm start`
  - Health check path: `/login`

### Important note about uploads

This app currently stores uploaded media on the backend filesystem. On Render, local disk is ephemeral by default, so uploaded files can disappear after a restart or redeploy.

If you want uploads to survive deploys, either:

- attach a persistent disk to the backend service and point it to the uploads directory
- or move media storage to S3, Cloudinary, Supabase Storage, or a similar object store

If you keep local file uploads on Render, the backend can also use `UPLOAD_DIR` to target the mounted storage path.

## How to use the app

### 1. Create accounts

You can register two kinds of users:

- `Organisation / Jobgiver`
- `Applicant`

Both use the same shared platform after login.

### 2. Build profiles

Open `Profile` and fill in:

- headline
- bio
- skills
- links
- profile photo
- resume text for applicants

Applicants should add strong profile details before applying, because screening uses what is already on the profile.

### 3. Post to the feed

From `Feed`, users can:

- post text updates
- attach project/resource links
- upload images
- upload videos
- like, comment, share, and save posts

### 4. Connect with others

From `Network`, users can:

- search members
- follow people
- view public profiles
- start direct messages

### 5. Post jobs

Organisation accounts can open `Jobs` and:

- create job listings
- edit job listings
- pause or activate jobs
- manage applicant flow

### 6. Apply for jobs

Applicant accounts can open `Jobs` and:

- browse active jobs
- apply from inside Hirely
- send an optional cover note

### 7. Screen and rank applicants

Organisation accounts open `Talent Hub`.

There they can:

- see everyone who applied
- filter by job
- click `Screen applicant`
- instantly generate a screening result
- view the explanation, factor scores, strengths, concerns, and AI reasoning

Important:

- rankings are job-specific
- shortlists are job-specific
- applicants for one job are not mixed into another job's shortlist

### 8. Shortlist by job

Inside `Talent Hub`, screened applicants can be moved to:

- `shortlisted`
- `interviewed`
- `offered`
- `rejected`

Each job now keeps its own shortlist section.

## Main routes

### Frontend

- `/login`
- `/feed`
- `/network`
- `/messages`
- `/settings`
- `/jobs`
- `/talent`
- `/applicant/dashboard`
- `/applicant/jobs`

### Backend API

#### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/profile`

#### Jobs

- `GET /api/jobs/public`
- `GET /api/jobs`
- `POST /api/jobs`
- `PUT /api/jobs/:id`
- `DELETE /api/jobs/:id`

#### Applications

- `POST /api/applications/:jobId`
- `GET /api/applications/mine`
- `GET /api/applications/inbox`
- `POST /api/applications/:id/screen`
- `PUT /api/applications/:id/status`

#### Social platform

- `GET /api/platform/home`
- `GET /api/platform/members`
- `GET /api/platform/profile/:id`
- `POST /api/platform/follow/:id`
- `POST /api/platform/posts`
- `POST /api/platform/posts/:id/like`
- `POST /api/platform/posts/:id/bookmark`
- `POST /api/platform/posts/:id/comment`
- `POST /api/platform/posts/:id/share`

#### Messages

- `GET /api/messages`
- `POST /api/messages`

## Notes for development

- Profile images and media posts currently use stored data URLs, which is fine for local development and demos.
- For large-scale production, move file storage to a real object store such as S3, Cloudinary, or Supabase Storage.
- MongoDB indexes and pagination should be expanded before very high traffic usage.

## Production suggestions

For a larger real deployment, add:

- object storage for images/videos
- CDN delivery for media
- background job queues for screening
- websocket or realtime messaging
- pagination for feed, members, and conversations
- audit logs and admin moderation tools

## Troubleshooting

### Frontend cannot reach backend

Check:

- backend is running on port `5000`
- `NEXT_PUBLIC_API` points to `http://localhost:5000/api`
- `FRONTEND_URL` in backend `.env` matches your frontend URL

### Screening is not using AI

Check:

- `GEMINI_API_KEY` is present in `backend/.env`
- backend was restarted after editing `.env`

If the key is missing, Hirely falls back to local scoring logic.
