import os
import asyncpg
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/dogoodhub"
)

# Convert to async URL for SQLAlchemy
ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# Create async engine
engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=True,  # Set to False in production
    future=True
)

# Create async session factory
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Create base class for models
Base = declarative_base()

# Mock data mode flag
USE_MOCK_DATA = os.getenv("USE_MOCK_DATA", "false").lower() == "true"

# Mock data for development
MOCK_PROFILES = [
    {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "first_name": "Admin",
        "last_name": "User",
        "email": "admin@dogoodhub.com",
        "phone": "+1234567890",
        "password_hash": "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",  # password
        "role": "admin",
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-01T00:00:00Z"
    },
    {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "user_id": "550e8400-e29b-41d4-a716-446655440001",
        "first_name": "Test",
        "last_name": "User",
        "email": "testuser2@gmail.com",
        "phone": "+1234567891",
        "password_hash": "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",  # password
        "role": "user",
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-01T00:00:00Z"
    }
]

MOCK_NGOS = [
    {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "user_id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Help Children Foundation",
        "description": "Dedicated to helping underprivileged children",
        "mission": "To provide education and healthcare to children in need",
        "website": "https://helpchildren.org",
        "address": "123 Charity Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "phone": "+91-9876543210",
        "email": "contact@helpchildren.org",
        "registration_number": "NGO12345",
        "verified": True,
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-01T00:00:00Z"
    }
]

class MockDatabase:
    """Mock database for development purposes"""
    
    def __init__(self):
        self.profiles = MOCK_PROFILES.copy()
        self.ngos = MOCK_NGOS.copy()
        self.vendors = []
        self.packages = []
        self.donations = []
        self.transactions = []
        self.tickets = []
    
    async def query(self, sql: str, params: list = None):
        """Mock query method"""
        # Simple mock implementation for common queries
        if "SELECT * FROM profiles WHERE email = $1" in sql:
            email = params[0] if params else None
            rows = [p for p in self.profiles if p["email"] == email]
            return MockResult(rows)
        elif "SELECT * FROM profiles WHERE user_id = $1" in sql:
            user_id = params[0] if params else None
            rows = [p for p in self.profiles if p["user_id"] == user_id]
            return MockResult(rows)
        elif "SELECT n.*, p.first_name, p.last_name, p.email as user_email FROM ngos n JOIN profiles p ON n.user_id = p.user_id" in sql:
            # Join NGOs with profiles
            result_rows = []
            for ngo in self.ngos:
                profile = next((p for p in self.profiles if p["user_id"] == ngo["user_id"]), None)
                if profile:
                    row = {**ngo, "first_name": profile["first_name"], "last_name": profile["last_name"], "user_email": profile["email"]}
                    result_rows.append(row)
            return MockResult(result_rows)
        else:
            return MockResult([])

class MockResult:
    """Mock result class"""
    
    def __init__(self, rows):
        self.rows = rows

# Global mock database instance
mock_db = MockDatabase()

async def get_connection():
    """Get database connection or mock"""
    if USE_MOCK_DATA:
        logging.info("Using mock database for development")
        return mock_db
    else:
        # Return actual database connection
        try:
            conn = await asyncpg.connect(DATABASE_URL)
            return conn
        except Exception as e:
            logging.error(f"Database connection failed: {e}")
            logging.info("Falling back to mock database")
            return mock_db

async def get_db_session():
    """Get database session"""
    if USE_MOCK_DATA:
        yield mock_db
    else:
        async with AsyncSessionLocal() as session:
            try:
                yield session
            finally:
                await session.close()

async def init_db():
    """Initialize database"""
    if USE_MOCK_DATA:
        logging.info("Using mock database - no initialization needed")
        return
    
    try:
        # Test connection
        async with engine.begin() as conn:
            # Create tables if they don't exist
            await conn.run_sync(Base.metadata.create_all)
        logging.info("Database initialized successfully")
    except Exception as e:
        logging.error(f"Database initialization failed: {e}")
        logging.info("Will use mock database as fallback")