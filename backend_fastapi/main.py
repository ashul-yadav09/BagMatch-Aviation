import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import engine, get_db
from .models import Base, UserModel, LostReportModel, FoundReportModel, MatchModel
from .schemas import UserCreate, UserResponse, LostReportCreate, FoundReportCreate

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BagMatch Aviation Baggage Recovery API",
    description="FastAPI + PostgreSQL + SQLAlchemy production backend service for BagMatch",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": "BagMatch FastAPI Python Service",
        "database": "PostgreSQL",
        "gemini_ready": bool(os.getenv("GEMINI_API_KEY"))
    }

@app.get("/")
def root():
    return {
        "message": "BagMatch Aviation Lost & Found Recovery API is running. Visit /docs for OpenAPI documentation."
    }
