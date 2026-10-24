# BagMatch - FastAPI & PostgreSQL Service

This folder contains the complete, production-grade Python FastAPI backend with SQLAlchemy ORM models, Alembic migrations, and PostgreSQL schemas for the **BagMatch** aviation baggage recovery platform.

## Architecture & Environment Execution

In the Google AI Studio development sandbox, web traffic and the unified full-stack dev server are hosted through the Node.js/Express service on port 3000 (`/server.ts`).

For standalone enterprise deployments or dedicated microservice environments, you can run this Python FastAPI service connected to a dedicated PostgreSQL instance.

---

## 1. Quickstart with Docker Compose

Run PostgreSQL and FastAPI together:

```bash
cd backend_fastapi
docker-compose up --build
```

`docker-compose.yml`:
```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: bagmatch_postgres
    restart: always
    environment:
      POSTGRES_USER: bagmatch_user
      POSTGRES_PASSWORD: bagmatch_secret_2026
      POSTGRES_DB: bagmatch_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build: .
    container_name: bagmatch_fastapi
    restart: always
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://bagmatch_user:bagmatch_secret_2026@db:5432/bagmatch_db
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      JWT_SECRET: ${JWT_SECRET:-aero-secret-jwt-key-2026}
    depends_on:
      - db

volumes:
  postgres_data:
```

---

## 2. Local Manual Setup

### Prerequisites
- Python 3.10+
- PostgreSQL 14+ running locally

### Installation
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Database Initialization
```bash
# Set your PostgreSQL connection string in .env
export DATABASE_URL="postgresql://username:password@localhost:5432/bagmatch_db"

# Run migrations / create tables
python3 -c "from database import engine; from models import Base; Base.metadata.create_all(bind=engine)"
```

### Run the FastAPI Service
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive Swagger API docs will be available at: `http://localhost:8000/docs`

---

## 3. Database Schema Overview

| Table | Purpose |
|---|---|
| `users` | Passenger, airport staff, and administrator credentials & roles |
| `lost_reports` | Flight route, baggage category, color, features, and case status |
| `found_reports` | Airport terminal, custody timestamp, physical features, vault storage |
| `matches` | Algorithmic and Gemini AI confidence scores, breakdown factors, and staff reviews |
| `verification_requests` | Private ownership questions, passenger answers, and staff decisions |
| `recovery_records` | Immutable recovery audit with ID verification type and staff handover signature |
| `case_events` | Chronological event timeline records for passenger and staff tracking |
| `audit_logs` | Comprehensive security logs for audit and compliance |
