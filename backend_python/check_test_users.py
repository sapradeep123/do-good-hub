#!/usr/bin/env python3
"""
Check if test users exist in the database and have correct roles.
"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.connection import get_db_session
from app.models.models import Profile, NGO, Vendor

async def check_test_users():
    """Check test users in database."""
    print("Checking test users in database...")
    print("=" * 50)
    
    async for db in get_db_session():
        # Check all profiles
        stmt = select(Profile)
        result = await db.execute(stmt)
        profiles = result.scalars().all()
        
        print(f"Total profiles found: {len(profiles)}")
        print()
        
        test_emails = [
            "admin@dogoodhub.com",
            "vendor@example.com", 
            "ngo@example.com",
            "testuser@example.com"
        ]
        
        for email in test_emails:
            # Find profile by email
            profile_stmt = select(Profile).where(Profile.email == email)
            profile_result = await db.execute(profile_stmt)
            profile = profile_result.scalar_one_or_none()
            
            if profile:
                print(f"✅ Found user: {profile.email}")
                print(f"   User ID: {profile.user_id}")
                print(f"   Role: {profile.role}")
                print(f"   Created: {profile.created_at}")
                
                # Check if vendor exists
                if profile.role == 'VENDOR':
                    vendor_stmt = select(Vendor).where(Vendor.user_id == profile.user_id)
                    vendor_result = await db.execute(vendor_stmt)
                    vendor = vendor_result.scalar_one_or_none()
                    if vendor:
                        print(f"   ✅ Vendor record exists: {vendor.company_name}")
                    else:
                        print(f"   ❌ Vendor record missing!")
                
                # Check if NGO exists
                elif profile.role == 'NGO':
                    ngo_stmt = select(NGO).where(NGO.user_id == profile.user_id)
                    ngo_result = await db.execute(ngo_stmt)
                    ngo = ngo_result.scalar_one_or_none()
                    if ngo:
                        print(f"   ✅ NGO record exists: {ngo.name}")
                    else:
                        print(f"   ❌ NGO record missing!")
                        
            else:
                print(f"❌ User not found: {email}")
            print()
        
        # Check all NGOs
        ngo_stmt = select(NGO)
        ngo_result = await db.execute(ngo_stmt)
        ngos = ngo_result.scalars().all()
        print(f"Total NGOs in database: {len(ngos)}")
        for ngo in ngos:
            print(f"  - {ngo.name} (user_id: {ngo.user_id})")
        
        print()
        
        # Check all Vendors
        vendor_stmt = select(Vendor)
        vendor_result = await db.execute(vendor_stmt)
        vendors = vendor_result.scalars().all()
        print(f"Total Vendors in database: {len(vendors)}")
        for vendor in vendors:
            print(f"  - {vendor.company_name} (user_id: {vendor.user_id})")
        
        break  # Exit the async generator loop

if __name__ == "__main__":
    asyncio.run(check_test_users())