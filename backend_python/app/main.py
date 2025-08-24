from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routes
from app.routes import auth, users, ngos, vendors, packages, donations, transactions, tickets, admin, vendor_dashboard, ngo_dashboard
from app.middleware.error_handler import (
    http_exception_handler,
    validation_exception_handler,
    general_exception_handler,
    not_found_handler
)
from app.database.connection import get_db_session

# Create FastAPI app
app = FastAPI(
    title=os.getenv("APP_NAME", "DoGoodHub API"),
    version=os.getenv("APP_VERSION", "1.0.0"),
    description="A platform connecting NGOs, vendors, and donors for social good",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8080").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add error handlers
from fastapi import HTTPException
from fastapi.exceptions import RequestValidationError

app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)
app.add_exception_handler(404, not_found_handler)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(ngos.router, prefix="/api/ngos", tags=["NGOs"])
app.include_router(vendors.router, prefix="/api/vendors", tags=["Vendors"])
app.include_router(packages.router, prefix="/api/packages", tags=["Packages"])
app.include_router(donations.router, prefix="/api/donations", tags=["Donations"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(tickets.router, prefix="/api/tickets", tags=["Tickets"])
app.include_router(admin.router, prefix="/api", tags=["Admin"])
app.include_router(vendor_dashboard.router, prefix="/api", tags=["Vendor Dashboard"])
app.include_router(ngo_dashboard.router, prefix="/api", tags=["NGO Dashboard"])

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to DoGoodHub API",
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "docs": "/docs",
        "redoc": "/redoc"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    try:
        # Test database connection
        async with get_db_session() as db:
            return {
                "status": "healthy",
                "database": "connected"
            }
    except Exception as e:
        return {
            "status": "healthy",
            "database": "disconnected",
            "error": str(e)
        }

# Startup event
@app.on_event("startup")
async def startup_event():
    print(f"Starting {os.getenv('APP_NAME', 'DoGoodHub API')} v{os.getenv('APP_VERSION', '1.0.0')}")
    print(f"Mock database mode: {os.getenv('USE_MOCK_DATA', 'false')}")
    
    # Initialize database connection
    try:
        db_gen = get_db_session()
        db = await db_gen.__anext__()
        print("Database connection established")
        await db_gen.aclose()
    except Exception as e:
        print(f"Database connection failed: {e}")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    print("Shutting down DoGoodHub API")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )