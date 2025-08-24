import asyncio
from app.database.connection import engine
from sqlalchemy import text

async def check_all_schemas():
    """Check the schema of all tables in the database"""
    
    # List of all expected tables
    tables = [
        'profiles', 'ngos', 'vendors', 'packages', 'donations', 
        'transactions', 'tickets', 'application_settings', 
        'vendor_invoices', 'donation_packages'
    ]
    
    async with engine.begin() as conn:
        print("=== COMPLETE DATABASE SCHEMA AUDIT ===")
        
        for table in tables:
            print(f"\n📋 Table: {table.upper()}")
            print("-" * 50)
            
            # Check if table exists
            table_exists = await conn.execute(text(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = :table_name)"
            ), {"table_name": table})
            
            exists = table_exists.scalar()
            
            if not exists:
                print(f"❌ Table '{table}' does not exist!")
                continue
                
            # Get table columns
            result = await conn.execute(text(
                """SELECT column_name, data_type, is_nullable, column_default 
                   FROM information_schema.columns 
                   WHERE table_name = :table_name 
                   ORDER BY ordinal_position"""
            ), {"table_name": table})
            
            columns = result.fetchall()
            
            if not columns:
                print(f"⚠️  No columns found for table '{table}'")
                continue
                
            print(f"✅ Columns ({len(columns)} total):")
            for column_name, data_type, is_nullable, column_default in columns:
                nullable = "NULL" if is_nullable == "YES" else "NOT NULL"
                default = f" DEFAULT {column_default}" if column_default else ""
                print(f"   • {column_name}: {data_type} {nullable}{default}")
            
            # Check foreign key constraints
            fk_result = await conn.execute(text(
                """SELECT 
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM 
                    information_schema.table_constraints AS tc 
                    JOIN information_schema.key_column_usage AS kcu
                      ON tc.constraint_name = kcu.constraint_name
                      AND tc.table_schema = kcu.table_schema
                    JOIN information_schema.constraint_column_usage AS ccu
                      ON ccu.constraint_name = tc.constraint_name
                      AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = :table_name"""
            ), {"table_name": table})
            
            foreign_keys = fk_result.fetchall()
            
            if foreign_keys:
                print(f"🔗 Foreign Keys ({len(foreign_keys)} total):")
                for column, ref_table, ref_column in foreign_keys:
                    print(f"   • {column} → {ref_table}.{ref_column}")
            
            # Check indexes
            index_result = await conn.execute(text(
                """SELECT indexname, indexdef 
                   FROM pg_indexes 
                   WHERE tablename = :table_name"""
            ), {"table_name": table})
            
            indexes = index_result.fetchall()
            
            if indexes:
                print(f"📇 Indexes ({len(indexes)} total):")
                for index_name, index_def in indexes:
                    print(f"   • {index_name}")
        
        # Check for any additional tables not in our expected list
        print("\n=== ADDITIONAL TABLES CHECK ===")
        all_tables_result = await conn.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
        ))
        
        all_tables = [row[0] for row in all_tables_result.fetchall()]
        unexpected_tables = [t for t in all_tables if t not in tables]
        
        if unexpected_tables:
            print(f"⚠️  Found {len(unexpected_tables)} additional tables:")
            for table in unexpected_tables:
                print(f"   • {table}")
        else:
            print("✅ No unexpected tables found")
        
        print(f"\n=== SUMMARY ===")
        print(f"Expected tables: {len(tables)}")
        print(f"Total tables in database: {len(all_tables)}")
        print(f"Additional tables: {len(unexpected_tables)}")

if __name__ == "__main__":
    asyncio.run(check_all_schemas())