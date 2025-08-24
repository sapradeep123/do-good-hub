import asyncio
import os
from app.database.connection import engine
from sqlalchemy import text

# Suppress all logging
os.environ['SQLALCHEMY_WARN_20'] = 'false'

async def validate_schema():
    """Validate database schema against model definitions"""
    
    # Expected columns for each table based on models
    expected_schema = {
        'profiles': [
            'id', 'user_id', 'first_name', 'last_name', 'email', 
            'phone', 'password_hash', 'role', 'created_at', 'updated_at'
        ],
        'ngos': [
            'id', 'user_id', 'name', 'description', 'website', 'logo_url',
            'address', 'city', 'state', 'country', 'phone', 'email',
            'registration_number', 'verified', 'created_at', 'updated_at'
        ],
        'vendors': [
            'id', 'user_id', 'company_name', 'description', 'website', 'logo_url',
            'address', 'city', 'state', 'country', 'phone', 'email',
            'business_type', 'verified', 'created_at', 'updated_at'
        ],
        'packages': [
            'id', 'ngo_id', 'title', 'description', 'amount', 'image_url',
            'category', 'target_quantity', 'current_quantity', 'status',
            'created_at', 'updated_at'
        ],
        'donations': [
            'id', 'user_id', 'package_id', 'amount', 'status', 'payment_method',
            'transaction_id', 'created_at', 'updated_at'
        ]
    }
    
    async with engine.begin() as conn:
        print("SCHEMA VALIDATION REPORT")
        print("=" * 60)
        
        for table_name, expected_columns in expected_schema.items():
            print(f"\n📋 {table_name.upper()}")
            print("-" * 40)
            
            # Get actual columns from database
            result = await conn.execute(text(
                """SELECT column_name FROM information_schema.columns 
                   WHERE table_name = :table_name 
                   ORDER BY ordinal_position"""
            ), {"table_name": table_name})
            
            actual_columns = [row[0] for row in result.fetchall()]
            
            if not actual_columns:
                print(f"❌ Table '{table_name}' does not exist!")
                continue
            
            # Check for missing columns
            missing_columns = set(expected_columns) - set(actual_columns)
            extra_columns = set(actual_columns) - set(expected_columns)
            
            if missing_columns:
                print(f"❌ Missing columns: {', '.join(missing_columns)}")
            
            if extra_columns:
                print(f"⚠️  Extra columns: {', '.join(extra_columns)}")
            
            if not missing_columns and not extra_columns:
                print("✅ Schema matches model definition")
            
            print(f"   Expected: {len(expected_columns)} columns")
            print(f"   Actual: {len(actual_columns)} columns")
        
        # Check critical foreign key relationships
        print("\n🔗 FOREIGN KEY VALIDATION")
        print("=" * 60)
        
        critical_fks = [
            ('ngos', 'user_id', 'profiles', 'user_id'),
            ('vendors', 'user_id', 'profiles', 'user_id'),
            ('packages', 'ngo_id', 'ngos', 'id'),
            ('donations', 'user_id', 'profiles', 'user_id'),
            ('donations', 'package_id', 'packages', 'id')
        ]
        
        for table, column, ref_table, ref_column in critical_fks:
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
        
        print("\n" + "=" * 60)
        print("VALIDATION SUMMARY")
        print("=" * 60)
        print("Check the report above for any schema mismatches.")
        print("❌ = Issues found that need attention")
        print("⚠️  = Minor differences (may be acceptable)")
        print("✅ = All good")

if __name__ == "__main__":
    asyncio.run(validate_schema())