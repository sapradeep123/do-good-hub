# Migration Guide: Lovable to Full-Stack Setup

## Overview
This guide helps you migrate your CareFund application from Lovable (Supabase) to a traditional full-stack setup with your own backend and database.

## Current Architecture
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Database**: Supabase PostgreSQL

## Target Architecture Options

### Option 1: Node.js Backend
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL or SQLite
- **Auth**: JWT with bcrypt

### Option 2: Python Backend
- **Frontend**: React + Vite + TypeScript + Tailwind CSS  
- **Backend**: Python + FastAPI
- **Database**: PostgreSQL or SQLite
- **Auth**: JWT with passlib

## Migration Steps

### Phase 1: Export and Setup
1. **Export from Lovable to GitHub**
   - Go to GitHub button in Lovable
   - Create repository
   - This exports your current React code

2. **Clone locally in Cursor**
   ```bash
   git clone <your-repo-url>
   cd your-project
   ```

### Phase 2: Backend Setup

#### Option A: Node.js + Express Backend
```bash
# Create backend directory
mkdir backend
cd backend

# Initialize Node.js project
npm init -y
npm install express cors helmet morgan bcryptjs jsonwebtoken
npm install -D @types/node @types/express @types/bcryptjs @types/jsonwebtoken typescript ts-node nodemon

# For PostgreSQL
npm install pg @types/pg

# For SQLite
npm install sqlite3 @types/sqlite3
```

#### Option B: Python + FastAPI Backend
```bash
# Create backend directory
mkdir backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn sqlalchemy alembic python-jose[cryptography] passlib[bcrypt] python-multipart

# For PostgreSQL
pip install psycopg2-binary

# For SQLite (included in Python)
# No additional packages needed
```

### Phase 3: Database Migration

#### Current Supabase Tables to Migrate:
- `profiles`
- `user_roles` 
- `ngos`
- `vendors`
- `packages`
- `donations`
- `transactions`
- `purchase_orders`
- `vendor_invoices`
- `tickets`
- `page_content`
- `admin_audit_log`
- `password_reset_requests`

#### Database Schema Migration:
1. Export current Supabase schema
2. Create migration scripts for new database
3. Set up database connection in backend

### Phase 4: API Replacement

#### Current Supabase Integrations to Replace:
1. **Authentication**: Replace `supabase.auth` with custom JWT auth
2. **Database queries**: Replace `supabase.from()` with API calls
3. **File uploads**: Replace Supabase Storage with local/cloud storage
4. **Edge functions**: Move logic to backend routes

#### API Endpoints Needed:
```
# Authentication
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/reset-password

# Users & Profiles
GET /api/users/profile
PUT /api/users/profile
GET /api/admin/users
PUT /api/admin/users/:id/role

# NGOs
GET /api/ngos
GET /api/ngos/:id
POST /api/ngos
PUT /api/ngos/:id
DELETE /api/ngos/:id

# Packages
GET /api/packages
GET /api/packages/:id
POST /api/packages
PUT /api/packages/:id
DELETE /api/packages/:id

# Donations
GET /api/donations
POST /api/donations
GET /api/admin/donations

# Transactions
GET /api/transactions
PUT /api/transactions/:id

# Page Content
GET /api/pages/:slug
PUT /api/pages/:slug

# And more...
```

### Phase 5: Frontend Updates

#### Files to Update:
1. Remove Supabase client: `src/integrations/supabase/`
2. Update authentication hook: `src/hooks/useAuth.tsx`
3. Replace database calls in all components
4. Update API service layer

#### Create API Service Layer:
```typescript
// src/lib/api.ts
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = {
  auth: {
    login: (email: string, password: string) => fetch(`${API_BASE_URL}/auth/login`, ...),
    register: (userData: any) => fetch(`${API_BASE_URL}/auth/register`, ...),
    // ... more auth methods
  },
  ngos: {
    getAll: () => fetch(`${API_BASE_URL}/ngos`),
    getById: (id: string) => fetch(`${API_BASE_URL}/ngos/${id}`),
    // ... more NGO methods
  },
  // ... more API methods
};
```

## Development Setup for Cursor

### Project Structure
```
your-project/
├── frontend/                 # React app (existing Lovable code)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # New backend
│   ├── src/
│   ├── package.json          # For Node.js
│   ├── requirements.txt      # For Python
│   └── database/
├── shared/                   # Shared types/interfaces
├── docker-compose.yml        # Optional: for database
├── .env.example
├── .gitignore
└── README.md
```

### Environment Variables
```bash
# Frontend (.env)
VITE_API_URL=http://localhost:3001/api

# Backend (.env)
DATABASE_URL=postgresql://user:password@localhost:5432/carefund
# or for SQLite:
DATABASE_URL=sqlite:./database.db
JWT_SECRET=your-jwt-secret-key
NODE_ENV=development
```

## Next Steps After Export

1. **Export your Lovable project to GitHub**
2. **Choose your backend technology** (Node.js or Python)
3. **Set up local development environment**
4. **Migrate database schema**
5. **Implement authentication system**
6. **Replace Supabase API calls**
7. **Test thoroughly**

## Benefits of Migration
- **Full control** over your backend and database
- **Local development** with Cursor
- **Custom authentication** and authorization
- **Flexible deployment** options
- **No vendor lock-in**

## Considerations
- **Development time**: Significant effort required
- **Authentication complexity**: Need to implement from scratch  
- **Hosting**: Need to manage backend hosting
- **Maintenance**: More infrastructure to maintain

## Recommended Tools for Cursor Development
- **Database**: PostgreSQL with pgAdmin or SQLite with DB Browser
- **API Testing**: Thunder Client (VS Code extension) or Postman
- **Database Management**: Prisma (Node.js) or SQLAlchemy (Python)
- **Authentication**: Implement JWT with proper security practices