import asyncio
from sqlalchemy import create_engine
from app.database.connection import DATABASE_URL, Base
from app.models.models import (
    Profile, NGO, Vendor, Package, Donation, Transaction, 
    Ticket, ApplicationSettings, VendorInvoice, DonationPackage
)

def create_missing_tables():
    """Create all missing database tables"""
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        print("Creating missing database tables...")
        
        # Create all tables defined in models
        Base.metadata.create_all(bind=engine)
        
        print("✅ All tables created successfully!")
        
        # Verify tables were created
        from sqlalchemy import text
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_type = 'BASE TABLE'
                ORDER BY table_name
            """))
            
            tables = [row[0] for row in result]
            print(f"\n=== CURRENT TABLES ({len(tables)}) ===")
            for table in tables:
                print(f"✅ {table}")
                
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False
    
    return True

if __name__ == "__main__":
    create_missing_tables()