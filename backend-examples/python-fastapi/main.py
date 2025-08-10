from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import uvicorn
from dotenv import load_dotenv
import os

# Import routers
from routers import auth, users, ngos, packages, donations, pages

# Load environment variables
load_dotenv()

app = FastAPI(
    title="CareFund API",
    description="Backend API for CareFund donation platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(ngos.router, prefix="/api/ngos", tags=["NGOs"])
app.include_router(packages.router, prefix="/api/packages", tags=["Packages"])
app.include_router(donations.router, prefix="/api/donations", tags=["Donations"])
app.include_router(pages.router, prefix="/api/pages", tags=["Pages"])

@app.get("/")
async def root():
    return {"message": "CareFund API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "OK", "timestamp": "2024-01-01T00:00:00Z"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )