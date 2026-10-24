# BagMatch ✈️

**Intelligent Aviation Lost & Found Baggage Reporting, AI-Assisted Matching, and Recovery Platform**

[![Tests](https://img.shields.io/badge/tests-34%2F34%20passed-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)]()
[![React](https://img.shields.io/badge/React-19-blue.svg)]()
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)]()
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.x-38B2AC.svg)]()
[![Gemini](https://img.shields.io/badge/Gemini_API-3.8_Flash-orange.svg)]()

---

## 📖 Overview

**BagMatch** connects passengers who have lost luggage with airport handling operations. The platform replaces informal paper logs and fragmented phone calls with a centralized, secure, multi-role recovery system:

- **Passenger Portal**: Guided 3-step lost bag claims, found luggage intake, real-time case timeline tracking, and private response to ownership verification questions.
- **Airport Operations Dashboard**: Real-time database metrics, searchable lost/found directory, cross-referencing matching matrix, and official custody handover recording.
- **Intelligent 100-Point Matching Engine**: Algorithmic comparison across categories, colors, sizes, brands, airport terminals, and travel dates, enhanced by **Gemini 3.8 Flash** operations assessments.
- **Controlled 8-Stage Chain-of-Custody**: Enforces server-side verification before baggage handover can occur, preventing unauthorized claims.
- **Security & RBAC**: Hashed passwords (bcrypt), JWT session authentication, and complete immutable audit trails.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Lucide Icons, Plus Jakarta Sans typography.
- **Primary Full-Stack Backend**: Node.js & Express running on port 3000 with unified REST API (`/api/v1/...`).
- **AI Integration**: Google Gemini 3.8 Flash (`@google/genai`) for baggage description linguistics and verification recommendations.
- **Standalone Backend Option**: Complete Python FastAPI + SQLAlchemy + PostgreSQL setup in `/backend_fastapi`.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm or bun

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/bagmatch.git
cd bagmatch
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
Add your `GEMINI_API_KEY` (available from [Google AI Studio](https://aistudio.google.com/)).

### 4. Run the fullstack development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run automated test suite
```bash
npm run test
```
Runs the 34-check integration test suite verifying authentication, permissions, matching algorithms, and handover state machines.

---

## 👥 Seeded Demo Accounts

You can test each role immediately using either the one-click demo login buttons in the UI or these credentials:

| Role | Email | Password | Primary Scope |
|---|---|---|---|
| **Passenger** | `emma.watson@example.com` | `Passenger2026!` | File claims, view private timeline, answer questions |
| **Airport Staff** | `officer.jenkins@bagmatch.aero` | `StaffPass2026!` | Review custody reports, evaluate matches, record handover |
| **Administrator** | `admin@bagmatch.aero` | `AeroAdmin2026!` | Manage accounts, assign staff roles, review audit logs |

---

## 📦 Project Structure

```
.
├── backend_fastapi/          # Standalone Python FastAPI & PostgreSQL Backend
│   ├── database.py           # SQLAlchemy database session & engine
│   ├── main.py               # FastAPI application with CORS and routes
│   ├── models.py             # PostgreSQL tables (users, reports, matches, audits)
│   ├── schemas.py            # Pydantic schemas
│   ├── requirements.txt      # Python dependencies
│   └── README.md             # Docker Compose & PostgreSQL instructions
├── server/                   # Full-Stack Node.js/Express Backend (Port 3000)
│   ├── db/
│   │   ├── db.ts             # Persistent database engine with atomic writes
│   │   └── types.ts          # Relational models and TypeScript definitions
│   ├── middleware/           # JWT auth and server-enforced role gates
│   ├── routes/               # Modular REST endpoints (/api/v1/...)
│   └── services/             # Matching engine, Gemini AI, Auth, and Audit services
├── src/                      # React Frontend
│   ├── assets/images/        # High-fidelity aviation visual assets
│   ├── components/           # Passenger, Staff, and Admin modular views
│   ├── context/              # Authentication Context
│   └── services/             # Typed API client
├── test/run_all_tests.ts     # 34-check automated integration test suite
├── .env.example              # Environment variable template
├── package.json              # Dependencies and scripts
└── server.ts                 # Full-stack server entry point
```

---

## 🔒 Security & Compliance

- **Role-Based Access Control**: Server-enforced permissions on every API endpoint. Passengers cannot access other travelers' claims or staff inspection vaults.
- **No Plaintext Passwords**: Passwords hashed with bcrypt (cost factor 10).
- **Privacy by Design**: Finders cannot see passenger contact details; passengers only see authorized case milestones.
- **Audit Logging**: Every report creation, match decision, verification attempt, and luggage handover is immutably timestamped with the acting user's ID and IP address.

---

## 📄 License

Apache-2.0 License.
