# TalentOS — Executive AI Recruitment Platform
## Next.js 14 + Express.js + MongoDB

A professional, board-ready recruitment platform with AI-powered candidate screening, dual role portals (Employer & Applicant), full dark/light mode, and complete audit trails.

---

## Project Structure

```
talentos-platform/
├── backend/                  ← Express.js API
│   ├── config/db.js          ← MongoDB connection
│   ├── controllers/          ← Business logic
│   ├── middleware/auth.js    ← JWT protection
│   ├── models/               ← Mongoose schemas
│   ├── routes/               ← API routes
│   ├── server.js             ← Entry point
│   ├── .env.example          ← Environment template
│   └── package.json
└── frontend/                 ← Next.js 14
    ├── app/                  ← App Router pages
    │   ├── login/            ← Login & registration
    │   ├── dashboard/        ← Employer dashboard
    │   ├── jobs/             ← Job listings manager
    │   ├── screener/         ← AI evaluation engine
    │   ├── results/          ← Candidate rankings
    │   ├── analytics/        ← Reporting & insights
    │   ├── settings/         ← Platform configuration
    │   └── applicant/        ← Candidate portal
    ├── components/           ← Shared UI components
    ├── context/              ← Auth + Theme providers
    ├── lib/api.js            ← Axios API client
    └── package.json
```

---

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your values:
#   MONGO_URI=mongodb://localhost:27017/talentos
#   JWT_SECRET=your_long_random_secret
#   ANTHROPIC_API_KEY=sk-ant-...

npm install
npm run dev
# API running at http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
# Create .env.local:
echo "NEXT_PUBLIC_API=http://localhost:5000/api" > .env.local

npm install
npm run dev
# App running at http://localhost:3000
```

---

## Demo Accounts

Register new accounts via the UI, or use these demo credentials once seeded:

| Role       | Email                   | Password   |
|------------|-------------------------|------------|
| Employer   | ceo@globalcorp.com      | demo1234   |
| Employer   | hr@globalcorp.com       | demo1234   |
| Applicant  | jordan@email.com        | demo1234   |
| Applicant  | priya@email.com         | demo1234   |

---

## Features

### Employer Portal
| Page | Feature |
|------|---------|
| **Dashboard** | KPI cards, recent evaluation table, pipeline breakdown, clickable AI detail drawer |
| **Job Listings** | Full CRUD, status management, applicant counts, search & filter |
| **AI Screener** | Custom weighted criteria, live weight editing, role selection, CV submission |
| **Candidates** | Ranked table, side drawer with 5 tabs (Scores / AI Reasoning / Strengths & Concerns / Interview Qs / HR Actions), CSV export |
| **Analytics** | Score distribution bar chart, verdict donut chart, criterion averages, insights panel |
| **Settings** | Profile, AI config, notifications, team management, security |

### Applicant Portal
| Page | Feature |
|------|---------|
| **My Applications** | Evaluation results, application stage pipeline tracker, score breakdown, next steps |
| **Browse Positions** | Live job listings from API, one-click apply |
| **My Profile** | Personal info, skills, CV text used in AI screenings |

### Platform-wide
- **Light/Dark mode** with system preference detection, persisted to localStorage
- **JWT authentication** with role-based access control (employer vs applicant)
- **Full AI reasoning chain** — every evaluation documents 8 evaluation steps
- **HR pipeline management** — shortlisted / interviewed / offered / rejected statuses
- **Strengths & concerns** — AI identifies specific candidate strengths and risk areas
- **Interview questions** — AI generates targeted questions per candidate
- **CSV export** — download full candidate list

---

## API Reference

### Auth
```
POST /api/auth/register     { name, email, password, role, company?, jobTitle? }
POST /api/auth/login        { email, password, role? }
GET  /api/auth/me           (protected)
PUT  /api/auth/profile      (protected)
```

### Jobs
```
GET  /api/jobs/public       Public listings (applicant view)
GET  /api/jobs              Employer's own jobs (protected, employer)
POST /api/jobs              Create job (protected, employer)
PUT  /api/jobs/:id          Update job (protected, employer)
DELETE /api/jobs/:id        Delete job (protected, employer)
GET  /api/jobs/dashboard-stats  Dashboard stats (protected, employer)
```

### Screenings
```
POST /api/screenings              Run AI evaluation (protected, employer)
GET  /api/screenings              List all evaluations (protected, employer)
GET  /api/screenings/:id          Single evaluation detail (protected, employer)
PUT  /api/screenings/:id/status   Update HR status & notes (protected, employer)
DELETE /api/screenings/:id        Remove evaluation (protected, employer)
GET  /api/screenings/analytics    Analytics data (protected, employer)
GET  /api/screenings/my-results?email=  Applicant's own results (protected)
```

---

## Environment Variables

### Backend (.env)
| Variable | Description |
|----------|-------------|
| `PORT` | API port (default: 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random secret for token signing |
| `JWT_EXPIRES_IN` | Token expiry (default: 7d) |
| `ANTHROPIC_API_KEY` | Claude API key from console.anthropic.com |
| `FRONTEND_URL` | CORS origin (default: http://localhost:3000) |

### Frontend (.env.local)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API` | Backend API base URL |

---

## Production Deployment

### Backend (e.g. Railway / Render)
```bash
npm run start
```

### Frontend (Vercel)
```bash
# Set NEXT_PUBLIC_API in Vercel environment settings
npm run build
```

### MongoDB Atlas
Replace `MONGO_URI` with your Atlas connection string.
