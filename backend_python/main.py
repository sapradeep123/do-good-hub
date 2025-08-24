from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import os
from dotenv import load_dotenv

# Import routers
from app.routers import auth, users, ngos, vendors, packages, donations, transactions, tickets
from app.middleware.error_handler import error_handler
from app.middleware.not_found import not_found_handler
from app.database.connection import init_db

# Load environment variables
load_dotenv()

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI app
app = FastAPI(
    title="Do Good Hub API",
    description="Do Good Hub Backend API with PostgreSQL",
    version="1.0.0",
    docs_url="/api",
    redoc_url="/api/redoc"
)

# Add rate limiting middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware for security
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Configure appropriately for production
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "Do Good Hub API is running",
        "version": "1.0.0"
    }

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(ngos.router, prefix="/api/ngos", tags=["NGOs"])
app.include_router(vendors.router, prefix="/api/vendors", tags=["Vendors"])
app.include_router(packages.router, prefix="/api/packages", tags=["Packages"])
app.include_router(donations.router, prefix="/api/donations", tags=["Donations"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(tickets.router, prefix="/api/tickets", tags=["Tickets"])

# Add error handlers
app.add_exception_handler(404, not_found_handler)
app.add_exception_handler(Exception, error_handler)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    await init_db()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 3001)),
        reload=True
    )