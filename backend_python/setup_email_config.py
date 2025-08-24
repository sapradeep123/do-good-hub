#!/usr/bin/env python3
"""
Script to set up basic email configuration for testing.
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.connection import AsyncSessionLocal
from app.models.models import ApplicationSettings
import uuid

async def setup_email_configuration():
    """Set up basic email configuration for testing."""
    async with AsyncSessionLocal() as db:
        try:
            # Check if settings already exist
            stmt = select(ApplicationSettings).limit(1)
            result = await db.execute(stmt)
            settings = result.scalar_one_or_none()
            
            if settings:
                print("Application settings already exist:")
                print(f"- App Name: {settings.app_name}")
                print(f"- Admin Email: {settings.admin_email}")
                print(f"- SMTP Server: {settings.smtp_server}")
                print(f"- SMTP Port: {settings.smtp_port}")
                print(f"- SMTP Username: {settings.smtp_username}")
                
                # Update with basic email settings for testing
                settings.smtp_server = "smtp.gmail.com"  # Example SMTP server
                settings.smtp_port = 587
                settings.smtp_username = "test@example.com"  # Placeholder
                settings.smtp_password = "test_password"  # Placeholder
                settings.admin_email = settings.admin_email or "admin@dogoodhub.com"
                settings.app_name = settings.app_name or "Do Good Hub"
                
                await db.commit()
                print("\n✅ Email configuration updated successfully!")
            else:
                # Create new settings
                print("Creating new application settings...")
                new_settings = ApplicationSettings(
                    app_name="Do Good Hub",
                    admin_email="admin@dogoodhub.com",
                    smtp_server="smtp.gmail.com",  # Example SMTP server
                    smtp_port=587,
                    smtp_username="test@example.com",  # Placeholder
                    smtp_password="test_password",  # Placeholder
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(new_settings)
                await db.commit()
                await db.refresh(new_settings)
                print("\n✅ Email configuration created successfully!")
            
            print("\n📧 Email Configuration Summary:")
            print("- SMTP Server: smtp.gmail.com")
            print("- SMTP Port: 587")
            print("- Username: test@example.com (placeholder)")
            print("- Admin Email: admin@dogoodhub.com")
            print("\n⚠️ Note: These are placeholder settings for testing.")
            print("   For production, configure with real SMTP credentials.")
            
        except Exception as e:
            print(f"Error setting up email configuration: {e}")
            await db.rollback()
            return False
        
        return True

if __name__ == "__main__":
    print("Setting up Email Configuration")
    print("=" * 40)
    
    success = asyncio.run(setup_email_configuration())
    
    if success:
        print("\n✅ Email configuration setup completed!")
        print("You can now test the email functionality.")
    else:
        print("\n❌ Email configuration setup failed!")