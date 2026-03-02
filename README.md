# Karuna Backend

Karuna is a disaster relief coordination platform designed to organize post-disaster logistics, routing volunteers, medical supplies, and donations using AI.

This repository holds the Node.js + Express backend, utilizing Supabase for the database/auth and Google's Gemini API for AI intelligence.

## Features
- **Role-Based Authentication**: Secure login for Doctors, Pharmacies, and Volunteers via Supabase Auth (OTP and password support).
- **Core API Modules**:
  - `Sites`: Management of disaster relief sites and patient tracking.
  - `Orders`: Direct line from Doctors prescribing medicines/equipment to Pharmacies packing them.
  - `Donations`: Tracking system for monetary and in-kind (physical goods) donations.
- **AI-Powered Features** (Powered by Gemini API):
  - **Volunteer Auto-Routing**: AI evaluates a volunteer's profession, vehicle access, and skills to assign them as a Nurse, Driver, or Helper.
  - **Emergency Chatbot**: Immediate, critical response intelligence providing context-aware survival steps and locating safe zones.

## Prerequisites
- Node.js (v18+ recommended)
- A Supabase account (free tier)
- A Google Gemini API key (free tier)

## Getting Started

### 1. Installation
Clone the repository, navigate to the `backend` folder, and install the dependencies:
```bash
cd backend
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root of the `backend` folder:
```bash
cp .env.example .env
```
Fill in the following variables:
- `SUPABASE_URL`: Your Supabase Project URL.
- `SUPABASE_ANON_KEY`: Your Supabase Project `anon / public` API key.
- `GEMINI_API_KEY`: Your Google AI Studio API key.
- `PORT`: (Optional) Port for the server to listen on, defaults to 5000.

### 3. Database Setup
You need to create the required tables in your Supabase project.

Open your Supabase dashboard, navigate to the **SQL Editor**, and execute the schema provided for this project (which covers `users`, `sites`, `patient_tags`, `orders`, and `donations` tables). 

*See the detailed setup guide artifact for the exact SQL statement if you do not have it.*

### 4. Run the Server
In a development environment to auto-restart on changes:
```bash
npm run dev
```
To run the standard server:
```bash
npm start
``` 

The server will be running on `http://localhost:5000`.

## API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /register`: Register a new user
- `POST /login`: Request login OTP
- `POST /verify-otp`: Verify the OTP to log in

### Sites (`/api/sites`)
- `GET /`: Get all sites
- `GET /:id`: Get specific site details
- `POST /`: Create a new disaster site

### Patients (`/api/patients`)
- `GET /:siteId`: List patient tags at a specific site
- `POST /`: Add a patient tag

### Orders (`/api/orders`)
- `GET /:siteId`: Get medical orders for a site
- `POST /`: Issue a new prescription/order
- `PUT /:id`: Update order status (Pharmacy side)

### Volunteer Engine (`/api/volunteer`)
- `POST /assign`: Send volunteer skills to AI and receive optimal role distribution.

### Donations (`/api/donations`)
- `POST /`: Log a new donation
- `GET /`: View donations (Admin tracking)

### Chatbot (`/api/chatbot`)
- `POST /chat`: Interface with the Gemini AI emergency intervention assist.
