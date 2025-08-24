import asyncio
import os
from app.database.connection import engine
from sqlalchemy import text

# Suppress all logging
os.environ['SQLALCHEMY_WARN_20'] = 'false'

async def get_db_summary():
    """Get a clean summary of database status"""
    
    tables = [
        'profiles', 'ngos', 'vendors', 'packages', 'donations', 
        'transactions', 'tickets', 'application_settings', 
        'vendor_invoices', 'donation_packages'
    ]
    
    results = []
    
    async with engine.begin() as conn:
        for table in tables:
            try:
                # Check if table exists and get record count
                exists_result = await conn.execute(text(
                    "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = :table_name)"
                ), {"table_name": table})
                
                exists = exists_result.scalar()
                
                if exists:
                    count_result = await conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    record_count = count_result.scalar()
                    results.append((table, "EXISTS", record_count))
                else:
                    results.append((table, "MISSING", 0))
                    
            except Exception as e:
                results.append((table, "ERROR", 0))
    
    # Print clean results
    print("DATABASE TABLE STATUS")
    print("=" * 50)
    print(f"{'Table':<20} {'Status':<10} {'Records':<10}")
    print("-" * 50)
    
    total_tables = 0
    total_records = 0
    missing_count = 0
    
    for table, status, records in results:
        print(f"{table:<20} {status:<10} {records:<10}")
        if status == "EXISTS":
            total_tables += 1
            total_records += records
        elif status == "MISSING":
            missing_count += 1
    
    print("-" * 50)
    print(f"Total Tables: {total_tables}/{len(tables)}")
    print(f"Missing Tables: {missing_count}")
    print(f"Total Records: {total_records}")
    
    if missing_count == 0:
        print("\n✅ ALL REQUIRED TABLES EXIST")
        if total_records > 0:
            print("✅ DATABASE HAS SAMPLE DATA")
        else:
            print("⚠️  DATABASE IS EMPTY (NO SAMPLE DATA)")
    else:
        print(f"\n❌ {missing_count} TABLES ARE MISSING")

if __name__ == "__main__":
    asyncio.run(get_db_summary())