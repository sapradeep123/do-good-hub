import asyncio
import asyncpg
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.database.connection import DATABASE_URL, Base
from app.models.models import (
    Profile, NGO, Vendor, Package, Donation, Transaction, 
    Ticket, ApplicationSettings, VendorInvoice, DonationPackage
)

def check_database_tables():
    """Check which tables exist and which are missing"""
    
    # Expected tables from models
    expected_tables = {
        'profiles': Profile,
        'ngos': NGO,
        'vendors': Vendor,
        'packages': Package,
        'donations': Donation,
        'transactions': Transaction,
        'tickets': Ticket,
        'application_settings': ApplicationSettings,
        'vendor_invoices': VendorInvoice,
        'donation_packages': DonationPackage
    }
    
    try:
        # Create engine and session
        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        print("=== DATABASE TABLE AUDIT ===")
        print(f"Expected tables: {len(expected_tables)}")
        
        # Check which tables exist
        existing_tables = set()
        missing_tables = []
        
        for table_name, model_class in expected_tables.items():
            try:
                # Try to query the table
                result = session.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                count = result.scalar()
                existing_tables.add(table_name)
                print(f"✅ {table_name}: {count} records")
            except Exception as e:
                missing_tables.append(table_name)
                print(f"❌ {table_name}: MISSING - {str(e)[:100]}")
        
        print(f"\n=== SUMMARY ===")
        print(f"Existing tables: {len(existing_tables)}")
        print(f"Missing tables: {len(missing_tables)}")
        
        if missing_tables:
            print(f"\n=== MISSING TABLES ===")
            for table in missing_tables:
                print(f"- {table}")
        
        # Check for extra tables not in models
        all_db_tables = session.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        """)).fetchall()
        
        db_table_names = {row[0] for row in all_db_tables}
        extra_tables = db_table_names - set(expected_tables.keys())
        
        if extra_tables:
            print(f"\n=== EXTRA TABLES (not in models) ===")
            for table in extra_tables:
                print(f"- {table}")
        
        session.close()
        return existing_tables, missing_tables, extra_tables
        
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return set(), list(expected_tables.keys()), set()

if __name__ == "__main__":
    check_database_tables()