import asyncio
import logging
import sys
from app.database.connection import engine
from sqlalchemy import text

# Completely disable SQLAlchemy logging
logging.getLogger('sqlalchemy').setLevel(logging.CRITICAL)
logging.getLogger('sqlalchemy.engine').setLevel(logging.CRITICAL)
logging.getLogger('sqlalchemy.pool').setLevel(logging.CRITICAL)

async def final_db_audit():
    """Final comprehensive database audit"""
    
    tables = [
        'profiles', 'ngos', 'vendors', 'packages', 'donations', 
        'transactions', 'tickets', 'application_settings', 
        'vendor_invoices', 'donation_packages'
    ]
    
    try:
        async with engine.begin() as conn:
            print("🔍 DATABASE SCHEMA AUDIT REPORT")
            print("=" * 60)
            
            table_status = {}
            
            for table in tables:
                # Check if table exists
                exists_result = await conn.execute(text(
                    "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = :table_name)"
                ), {"table_name": table})
                
                exists = exists_result.scalar()
                
                if not exists:
                    table_status[table] = {"exists": False, "columns": 0, "records": 0}
                    continue
                
                # Get column count
                columns_result = await conn.execute(text(
                    "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = :table_name"
                ), {"table_name": table})
                column_count = columns_result.scalar()
                
                # Get record count
                records_result = await conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                record_count = records_result.scalar()
                
                # Get foreign key count
                fk_result = await conn.execute(text(
                    """SELECT COUNT(*) FROM information_schema.table_constraints 
                       WHERE constraint_type = 'FOREIGN KEY' AND table_name = :table_name"""
                ), {"table_name": table})
                fk_count = fk_result.scalar()
                
                table_status[table] = {
                    "exists": True, 
                    "columns": column_count, 
                    "records": record_count,
                    "foreign_keys": fk_count
                }
            
            # Print summary table
            print(f"{'Table':<20} {'Status':<8} {'Columns':<8} {'Records':<8} {'FKeys':<6}")
            print("-" * 60)
            
            total_tables = 0
            total_records = 0
            missing_tables = []
            
            for table, status in table_status.items():
                if status["exists"]:
                    total_tables += 1
                    total_records += status["records"]
                    status_icon = "✅"
                    columns = status["columns"]
                    records = status["records"]
                    fkeys = status["foreign_keys"]
                else:
                    missing_tables.append(table)
                    status_icon = "❌"
                    columns = records = fkeys = "-"
                
                print(f"{table:<20} {status_icon:<8} {columns:<8} {records:<8} {fkeys:<6}")
            
            print("\n" + "=" * 60)
            print("📊 SUMMARY")
            print("=" * 60)
            print(f"✅ Tables created: {total_tables}/{len(tables)}")
            print(f"📝 Total records: {total_records}")
            
            if missing_tables:
                print(f"❌ Missing tables: {', '.join(missing_tables)}")
            else:
                print("✅ All expected tables exist")
            
            # Check critical relationships
            print("\n🔗 CRITICAL RELATIONSHIPS")
            print("=" * 60)
            
            # Check user_id references
            user_refs = await conn.execute(text(
                """SELECT table_name FROM information_schema.columns 
                   WHERE column_name = 'user_id' AND table_name != 'profiles'"""
            ))
            user_ref_count = len(user_refs.fetchall())
            print(f"✅ Tables with user_id: {user_ref_count}")
            
            # Check for essential columns in key tables
            essential_checks = [
                ("profiles", "email"),
                ("profiles", "password_hash"),
                ("profiles", "role"),
                ("ngos", "name"),
                ("vendors", "name"),
                ("packages", "title")
            ]
            
            print("\n🔍 ESSENTIAL COLUMNS CHECK")
            print("=" * 60)
            
            for table, column in essential_checks:
                check_result = await conn.execute(text(
                    """SELECT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_name = :table_name AND column_name = :column_name)"""
                ), {"table_name": table, "column_name": column})
                
                exists = check_result.scalar()
                status = "✅" if exists else "❌"
                print(f"{status} {table}.{column}")
            
            print("\n" + "=" * 60)
            print("🎯 CONCLUSION")
            print("=" * 60)
            
            if len(missing_tables) == 0 and total_records > 0:
                print("✅ Database is properly set up with all required tables and sample data")
            elif len(missing_tables) == 0:
                print("⚠️  All tables exist but some are empty - consider adding sample data")
            else:
                print(f"❌ Database setup incomplete - {len(missing_tables)} tables missing")
                
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(final_db_audit())