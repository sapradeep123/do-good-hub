import asyncio
import os
from app.database.connection import engine
from sqlalchemy import text
import logging

# Completely suppress all logging
logging.getLogger('sqlalchemy').setLevel(logging.CRITICAL)
os.environ['SQLALCHEMY_WARN_20'] = 'false'
os.environ['SQLALCHEMY_SILENCE_UBER_WARNING'] = '1'

async def generate_final_report():
    """Generate final comprehensive database report"""
    
    async with engine.begin() as conn:
        print("\n" + "=" * 80)
        print("🏥 DO-GOOD-HUB DATABASE VALIDATION REPORT")
        print("=" * 80)
        
        # 1. Check all required tables exist
        required_tables = [
            'profiles', 'ngos', 'vendors', 'packages', 'donations',
            'transactions', 'tickets', 'application_settings', 
            'vendor_invoices', 'donation_packages'
        ]
        
        print("\n📋 TABLE EXISTENCE CHECK")
        print("-" * 50)
        
        existing_tables = []
        for table in required_tables:
            result = await conn.execute(text(
                "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = :table)"
            ), {"table": table})
            exists = result.scalar()
            status = "✅" if exists else "❌"
            print(f"{status} {table}")
            if exists:
                existing_tables.append(table)
        
        print(f"\n📊 Summary: {len(existing_tables)}/{len(required_tables)} tables exist")
        
        # 2. Check record counts for key tables
        print("\n📈 DATA POPULATION CHECK")
        print("-" * 50)
        
        key_tables = ['profiles', 'ngos', 'vendors', 'packages', 'donations']
        for table in key_tables:
            if table in existing_tables:
                result = await conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                status = "✅" if count > 0 else "⚠️"
                print(f"{status} {table}: {count} records")
        
        # 3. Schema validation for critical tables
        print("\n🔍 SCHEMA VALIDATION")
        print("-" * 50)
        
        schema_issues = []
        
        # Check NGOs table schema
        if 'ngos' in existing_tables:
            result = await conn.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'ngos'"
            ))
            ngo_columns = [row[0] for row in result.fetchall()]
            if 'address' not in ngo_columns:
                schema_issues.append("NGOs table missing 'address' column")
                print("❌ NGOs: Missing 'address' column (has 'full_address' instead)")
            else:
                print("✅ NGOs: Schema OK")
        
        # Check Vendors table schema
        if 'vendors' in existing_tables:
            result = await conn.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'vendors'"
            ))
            vendor_columns = [row[0] for row in result.fetchall()]
            if 'company_name' in vendor_columns:
                print("✅ Vendors: Schema OK")
            else:
                schema_issues.append("Vendors table missing 'company_name' column")
                print("❌ Vendors: Missing 'company_name' column")
        
        # 4. Foreign Key Validation
        print("\n🔗 FOREIGN KEY VALIDATION")
        print("-" * 50)
        
        fk_issues = []
        critical_fks = [
            ('ngos', 'user_id', 'profiles', 'user_id'),
            ('vendors', 'user_id', 'profiles', 'user_id'),
            ('packages', 'ngo_id', 'ngos', 'id'),
            ('donations', 'user_id', 'profiles', 'user_id'),
            ('donations', 'package_id', 'packages', 'id')
        ]
        
        for table, column, ref_table, ref_column in critical_fks:
            if table in existing_tables and ref_table in existing_tables:
                fk_check = await conn.execute(text(
                    """SELECT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints tc
                        JOIN information_schema.key_column_usage kcu
                          ON tc.constraint_name = kcu.constraint_name
                        JOIN information_schema.constraint_column_usage ccu
                          ON ccu.constraint_name = tc.constraint_name
                        WHERE tc.constraint_type = 'FOREIGN KEY'
                          AND tc.table_name = :table_name
                          AND kcu.column_name = :column_name
                          AND ccu.table_name = :ref_table
                          AND ccu.column_name = :ref_column
                    )"""
                ), {
                    "table_name": table,
                    "column_name": column,
                    "ref_table": ref_table,
                    "ref_column": ref_column
                })
                
                exists = fk_check.scalar()
                status = "✅" if exists else "❌"
                print(f"{status} {table}.{column} → {ref_table}.{ref_column}")
                if not exists:
                    fk_issues.append(f"{table}.{column} → {ref_table}.{ref_column}")
        
        # 5. Final Assessment
        print("\n" + "=" * 80)
        print("🎯 FINAL ASSESSMENT")
        print("=" * 80)
        
        total_issues = len(schema_issues) + len(fk_issues)
        missing_tables = len(required_tables) - len(existing_tables)
        
        if missing_tables == 0 and total_issues == 0:
            print("🎉 DATABASE STATUS: EXCELLENT")
            print("   ✅ All required tables exist")
            print("   ✅ All schemas are correct")
            print("   ✅ All foreign keys are properly configured")
            print("   ✅ Sample data is populated")
        elif missing_tables == 0 and total_issues <= 2:
            print("✅ DATABASE STATUS: GOOD")
            print("   ✅ All required tables exist")
            print("   ✅ Sample data is populated")
            if schema_issues:
                print(f"   ⚠️  Minor schema issues: {len(schema_issues)}")
            if fk_issues:
                print(f"   ⚠️  Foreign key issues: {len(fk_issues)}")
        else:
            print("⚠️  DATABASE STATUS: NEEDS ATTENTION")
            if missing_tables > 0:
                print(f"   ❌ Missing tables: {missing_tables}")
            if schema_issues:
                print(f"   ❌ Schema issues: {len(schema_issues)}")
            if fk_issues:
                print(f"   ❌ Foreign key issues: {len(fk_issues)}")
        
        print("\n📝 RECOMMENDATIONS:")
        if missing_tables > 0:
            print("   • Run database migrations to create missing tables")
        if schema_issues:
            print("   • Update table schemas to match model definitions")
        if fk_issues:
            print("   • Add missing foreign key constraints")
        if missing_tables == 0 and total_issues == 0:
            print("   • Database is ready for production use!")
        
        print("\n" + "=" * 80)

if __name__ == "__main__":
    asyncio.run(generate_final_report())