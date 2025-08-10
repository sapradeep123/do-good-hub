# Database Setup

This directory contains database artifacts for the Do Good Hub application.

## Files

- `schema.sql` - PostgreSQL database schema (structure only, no data)

## Setup Instructions

### 1. Create Database
```sql
CREATE DATABASE do_good_hub;
```

### 2. Restore Schema
```bash
psql -U postgres -d do_good_hub -f db/schema.sql
```

### 3. Environment Configuration
Copy `backend/.env.example` to `backend/.env` and update the database credentials:
```env
DB_PASSWORD=your-postgres-password
DATABASE_URL=postgresql://postgres:your-postgres-password@localhost:5432/do_good_hub
```

### 4. Seed Data (Optional)
The application will create necessary tables and relationships automatically when started.
You may want to create initial admin users and sample data as needed.

## Key Tables
- `public.profiles` - User authentication and profile data
- `public.ngos` - NGO organization details
- `public.vendors` - Vendor company information  
- `public.packages` - Donation packages
- `public.package_assignments` - Junction table for Package ↔ NGO ↔ Vendor relationships
- `public.donations` - Donation transactions
- `public.orders` - Order management
- `public.transactions` - Payment processing

## Notes
- Schema exported using PostgreSQL 17's pg_dump
- All tables use UUID primary keys
- Foreign key constraints maintain referential integrity
- The `package_assignments` table enforces complete NGO-Vendor-Package relationships
