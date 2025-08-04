from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import uvicorn
import os
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

app = FastAPI(
    title="Do Good Hub API",
    description="Backend API for Do Good Hub donation platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API responses
class HealthResponse(BaseModel):
    status: str
    timestamp: str
    environment: str

class User(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    created_at: str

class NGO(BaseModel):
    id: str
    name: str
    description: str
    category: str
    verified: bool
    created_at: str

class Donation(BaseModel):
    id: str
    user_id: str
    ngo_id: str
    amount: float
    status: str
    created_at: str

# Mock data for development
mock_users = [
    {
        "id": "1",
        "email": "admin@dogoodhub.com",
        "first_name": "Admin",
        "last_name": "User",
        "role": "admin",
        "created_at": "2024-01-01T00:00:00Z"
    },
    {
        "id": "2", 
        "email": "user@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "role": "user",
        "created_at": "2024-01-01T00:00:00Z"
    }
]

mock_ngos = [
    {
        "id": "1",
        "name": "Save the Children",
        "description": "Helping children in need worldwide",
        "category": "Children",
        "verified": True,
        "created_at": "2024-01-01T00:00:00Z"
    },
    {
        "id": "2",
        "name": "World Food Programme",
        "description": "Fighting hunger worldwide",
        "category": "Food Security",
        "verified": True,
        "created_at": "2024-01-01T00:00:00Z"
    }
]

mock_donations = [
    {
        "id": "1",
        "user_id": "2",
        "ngo_id": "1",
        "amount": 100.0,
        "status": "completed",
        "created_at": "2024-01-01T00:00:00Z"
    }
]

@app.get("/")
async def root():
    return {"message": "Do Good Hub API is running!"}

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return {
        "status": "OK",
        "timestamp": datetime.now().isoformat(),
        "environment": "development"
    }

# User endpoints
@app.get("/api/users", response_model=List[User])
async def get_users():
    return mock_users

@app.get("/api/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = next((u for u in mock_users if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# NGO endpoints
@app.get("/api/ngos", response_model=List[NGO])
async def get_ngos():
    return mock_ngos

@app.get("/api/ngos/{ngo_id}", response_model=NGO)
async def get_ngo(ngo_id: str):
    ngo = next((n for n in mock_ngos if n["id"] == ngo_id), None)
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO not found")
    return ngo

# Donation endpoints
@app.get("/api/donations", response_model=List[Donation])
async def get_donations():
    return mock_donations

@app.get("/api/donations/{donation_id}", response_model=Donation)
async def get_donation(donation_id: str):
    donation = next((d for d in mock_donations if d["id"] == donation_id), None)
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    return donation

# Auth endpoints (simplified for now)
@app.post("/api/auth/login")
async def login():
    return {
        "access_token": "mock_token_123",
        "token_type": "bearer",
        "user": mock_users[0]
    }

@app.post("/api/auth/register")
async def register():
    return {
        "message": "User registered successfully",
        "user": mock_users[1]
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=3001,
        reload=True
    ) 