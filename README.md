# Karuna — AI-Powered Disaster Relief Platform

Karuna is a comprehensive disaster relief coordination platform designed to organize post-disaster logistics, routing volunteers, medical supplies, and donations using AI.

Built with a **Node.js + Express backend** (Supabase & Gemini AI) and a **unified React frontend** with role-based dashboards.

---

## Features

- **Role-Based Authentication** — Doctors, Pharmacies, and Volunteers via Supabase Auth
- **Site Management** — Create & manage relief camps with GPS coordinates, urgency scores, and live personnel stats
- **Patient Intake & Triage** — Nurses register patients with diagnosis, vitals, and auto-generated TAG IDs
- **Order Pipeline** — Doctors prescribe → Pharmacy fulfills → Driver delivers (enforced status transitions)
- **AI Volunteer Routing** — Gemini AI assigns volunteers to NURSE / DRIVER / HELPER tracks based on profile
- **Emergency Chatbot** — Location-aware AI chat with nearest safe zone routing, volunteer contact info, and Indian emergency numbers
- **Donation System** — Monetary & in-kind donations with AI auto-categorization and driver pickup coordination
- **Flags & Suggestions** — Helpers can raise issues or suggest tasks with severity levels

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express, Supabase (Auth + DB), Gemini AI |
| Frontend | React 18, TypeScript, Vite, React Router |
| Database | PostgreSQL via Supabase (with RLS) |
| AI | Google Gemini 2.0 Flash |

---

## Getting Started

### Prerequisites
- Node.js v18+
- A [Supabase](https://supabase.com) project (free tier)
- A [Google Gemini API key](https://aistudio.google.com) (free tier)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

Run the server:
```bash
npm start
# → http://localhost:5000
```

**Database:** Run `backend/database/schema_v2_migration.sql` in your Supabase SQL Editor to create all tables.

---

### 2. Frontend Setup

The frontend uses a **unified app** with `react-router-dom` for navigation between all pages:

```bash
cd frontend/karuna-app
npm install
npm run dev
# → http://localhost:3000
```

### Frontend Routes

| Route | Page | Access |
|-------|------|--------|
| `/` | Home — role selector + emergency link | Public |
| `/doctor/onboarding` | Doctor Registration | Public |
| `/doctor` | Doctor Dashboard — patients, orders | Doctor |
| `/pharmacy/form` | Pharmacy Registration | Public |
| `/pharmacy` | Pharmacy Dashboard — order fulfillment | Pharmacy |
| `/volunteer/join` | Volunteer Join Form — AI role assignment | Volunteer |
| `/nurse` | Nurse — patient intake, triage, todos | NURSE track |
| `/driver` | Driver — pharmacy deliveries, resource transfers, donation pickups | DRIVER track |
| `/help` | Emergency Chatbot — location-aware AI chat | Public |

> The 🆘 **Help Me** button is always visible in the header across all pages.

---

## API Endpoints

| Module | Endpoints |
|--------|-----------|
| **Auth** | `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/verify-otp` · `GET/PUT /api/auth/me` |
| **Sites** | `GET /api/sites` · `GET/PUT /api/sites/:id` · `POST /api/sites/:id/join` · `GET /api/sites/:id/stats` |
| **Patients** | `GET /api/patients/:siteId` · `GET /api/patients/:siteId/next-id` · `POST/PUT/DELETE /api/patients/:id` |
| **Orders** | `GET /api/orders/:siteId` · `GET /api/orders/:siteId/pickup` · `POST /api/orders` · `PUT /api/orders/:id` |
| **Volunteer** | `POST /api/volunteer/assign` · `GET /api/volunteer/me` |
| **Todos** | `GET /api/volunteer-todos/:siteId` · `POST/PUT/DELETE /api/volunteer-todos/:id` |
| **Donations** | `GET /api/donations` · `GET /api/donations/:id` · `POST /api/donations` · `PUT /api/donations/:id` |
| **Flags** | `GET /api/flags/:siteId` · `POST /api/flags` · `PUT /api/flags/:id` |
| **Chatbot** | `POST /api/chatbot/chat` (accepts `{ message, history, location }`) |
| **Health** | `GET /api/health` |

---

## Project Structure

```
Karuna/
├── backend/
│   ├── config/          # Supabase client
│   ├── controllers/     # authController, siteController, orderController, etc.
│   ├── middleware/       # auth (JWT + role-based)
│   ├── routes/           # Express routers
│   ├── database/         # SQL migration scripts
│   ├── server.js         # Entry point
│   └── .env.example
├── frontend/
│   ├── karuna-app/       # ← Unified app (run this)
│   │   ├── src/App.tsx   # React Router with all routes
│   │   └── package.json
│   ├── Doctor Dashboard/ # Page components (imported by karuna-app)
│   ├── Nurse Page/
│   ├── Driver UI/
│   ├── Chatbot UI/
│   ├── Pharmacy Dashboard/
│   ├── Volunteer Join Form/
│   └── shared/api.ts     # Shared API client
└── README.md
```

---

## License

MIT
