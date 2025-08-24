import asyncio
from app.database.connection import get_db_session
from sqlalchemy import text

async def migrate_ngo_table():
    """Add missing columns to NGO table to match the model"""
    async for db in get_db_session():
        try:
            print("Starting NGO table migration...")
            
            # Add missing columns to NGO table
            migration_queries = [
                "ALTER TABLE ngos ADD COLUMN IF NOT EXISTS gallery_images TEXT;",
                "ALTER TABLE ngos ADD COLUMN IF NOT EXISTS started_date TIMESTAMP WITH TIME ZONE;",
                "ALTER TABLE ngos ADD COLUMN IF NOT EXISTS license_number TEXT;",
                "ALTER TABLE ngos ADD COLUMN IF NOT EXISTS total_members INTEGER;",
                "ALTER TABLE ngos ADD COLUMN IF NOT EXISTS full_address TEXT;",
                "ALTER TABLE ngos ADD COLUMN IF NOT EXISTS pin_code VARCHAR(10);",
                
                # Remove old columns that don't match the model
                "ALTER TABLE ngos DROP COLUMN IF EXISTS address;",
                
                # Set default values for new required columns where data exists
                "UPDATE ngos SET description = 'No description provided' WHERE description IS NULL;",
                "UPDATE ngos SET started_date = created_at WHERE started_date IS NULL;",
                "UPDATE ngos SET total_members = 1 WHERE total_members IS NULL;",
                "UPDATE ngos SET full_address = COALESCE(city || ', ' || state || ', ' || country, 'Address not provided') WHERE full_address IS NULL;",
                "UPDATE ngos SET pin_code = '000000' WHERE pin_code IS NULL;",
                "UPDATE ngos SET city = 'Unknown' WHERE city IS NULL;",
                "UPDATE ngos SET state = 'Unknown' WHERE state IS NULL;",
                "UPDATE ngos SET phone = 'Not provided' WHERE phone IS NULL;",
                "UPDATE ngos SET email = 'noemail@example.com' WHERE email IS NULL;",
                
                # Update existing columns to match model requirements (after setting defaults)
                "ALTER TABLE ngos ALTER COLUMN description SET NOT NULL;",
                "ALTER TABLE ngos ALTER COLUMN started_date SET NOT NULL;",
                "ALTER TABLE ngos ALTER COLUMN total_members SET NOT NULL;",
                "ALTER TABLE ngos ALTER COLUMN full_address SET NOT NULL;",
                "ALTER TABLE ngos ALTER COLUMN pin_code SET NOT NULL;",
                "ALTER TABLE ngos ALTER COLUMN city SET NOT NULL;",
                "ALTER TABLE ngos ALTER COLUMN state SET NOT NULL;",
                "ALTER TABLE ngos ALTER COLUMN phone SET NOT NULL;",
                "ALTER TABLE ngos ALTER COLUMN email SET NOT NULL;",
            ]
            
            for query in migration_queries:
                print(f"Executing: {query}")
                await db.execute(text(query))
            
            await db.commit()
            print("NGO table migration completed successfully!")
            break
            
        except Exception as e:
            print(f"Migration failed: {e}")
            await db.rollback()
            break

if __name__ == "__main__":
    asyncio.run(migrate_ngo_table())