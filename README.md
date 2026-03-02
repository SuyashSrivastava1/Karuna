# Karuna - AI-Powered Disaster Relief Platform

Karuna is a comprehensive disaster relief coordination platform designed to organize post-disaster logistics, routing volunteers, medical supplies, and donations using AI.

This repository holds the **Node.js + Express backend** (powered by Supabase & Gemini AI) and **8 distinct frontend Vite/React applications** tailored for specific roles on the ground during a crisis.

## Features
- **Role-Based Authentication**: Secure login for Doctors, Pharmacies, and Volunteers via Supabase Auth (Email OTP).
- **Core Operations**:
  - `Sites`: Management of disaster relief sites and camps.
  - `Patients`: Triage tag generation, diagnosis, and vitals tracking.
  - `Orders`: Direct line from Doctors prescribing medicines/equipment to Pharmacies packing them.
- **AI-Powered Features** (Powered by Gemini API):
  - **Volunteer Auto-Routing**: AI evaluates a volunteer's profession, vehicle access, and medical fitness to assign them the optimal role (Nurse, Driver, or General Helper).
  - **Emergency Chatbot**: Immediate, critical response intelligence providing context-aware survival steps, nearest safe zones via GPS, and offline emergency contacts.

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- A Supabase Project (free tier)
- A Google Gemini API key (free tier)

### 1. Backend Setup
Navigate to the `backend` folder, install dependencies, and setup the environment:
```bash
cd backend
npm install
cp .env.example .env
```
Open `.env` and fill in:
- `SUPABASE_URL`: Your Supabase Project URL.
- `SUPABASE_ANON_KEY`: Your Supabase Project `anon / public` API key.
- `GEMINI_API_KEY`: Your Google AI Studio API key.
- `PORT`: 5000

Run the backend server:
```bash
npm start
# Server runs on http://localhost:5000
```
> **Database:** Ensure your Supabase project contains the necessary schema (`users`, `sites`, `patient_tags`, `orders`, `volunteer_tracks`, `volunteer_todos`).

---

### 2. Frontend Applications
To keep the bundle sizes lightweight for users on slow network connections in disaster zones, the frontend is split into 8 specific micro-apps. They all communicate with the central backend on port 5000.

To run any app, navigate to its specific folder inside `frontend/`, install dependencies, and start the Vite dev server:
```bash
cd "frontend/Sign Up page"
npm install
npm run dev
```

#### Application Portfolio

| Application | Port | Description / Features |
|---|---|---|
| **Sign Up page** | `5173` | Main entrypoint for auth. Uses Email OTP and issues JWTs. |
| **Volunteer Join Form** | `5174` | AI auto-routes volunteers to roles based on their skills/assets. |
| **Nurse Page** | `5175` | Patient intake, triage generation, and shared Todo management. |
| **Chatbot UI** | `5176` | Public emergency AI chat with real-time GPS routing to safety. |
| **Pharmacy Form** | `5177` | Registration flow for field pharmacies. |
| **Doctor Onboarding** | `5178` | Registration and profile setup for doctors. |
| **Driver UI** | `5179` | Dispatch queue for picking up and delivering relief supplies. |
| **Pharmacy Dashboard** | `5180` | Order fulfillment queue for medical and equipment supplies. |
| **Doctor Dashboard** | `5181` | Patient overview and digital prescription issuance. |

### Note on Authentication
Log in via the **Sign Up page (`localhost:5173`)** first. The authentication JWT is shared across all apps via `localStorage` (key: `karuna_token`), so you do not need to repeatedly log in when switching between the different dashboards. All apps have graceful fallback UI if the auth token is missing or the backend is offline.
