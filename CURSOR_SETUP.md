# Cursor IDE Setup for CareFund Development

## Prerequisites
- **Cursor IDE** installed
- **Node.js 18+** or **Python 3.9+**
- **PostgreSQL 15+** or **SQLite**
- **Git** for version control

## Quick Start Guide

### 1. Export from Lovable to GitHub
1. In Lovable, click the **GitHub** button (top right)
2. Connect your GitHub account
3. Click **"Create Repository"**
4. Choose repository name (e.g., `carefund-app`)
5. Repository will be created with your current code

### 2. Clone in Cursor
```bash
# Clone the repository
git clone https://github.com/yourusername/carefund-app.git
cd carefund-app

# Open in Cursor
cursor .
```

### 3. Project Structure Setup
```bash
# Create backend directory
mkdir backend
mkdir shared
mkdir database

# Move frontend code to frontend directory (optional but recommended)
mkdir frontend
# Move existing files to frontend/ if you want separation
```

### 4. Choose Your Backend Stack

#### Option A: Node.js + Express + PostgreSQL
```bash
cd backend
npm init -y

# Install dependencies
npm install express cors helmet morgan bcryptjs jsonwebtoken dotenv pg multer
npm install -D @types/node @types/express @types/cors @types/morgan @types/bcryptjs @types/jsonwebtoken @types/pg @types/multer typescript ts-node nodemon

# Copy example files
cp ../backend-examples/nodejs-express/package.json ./
cp ../backend-examples/nodejs-express/src/server.ts ./src/
```

#### Option B: Python + FastAPI + PostgreSQL
```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r ../backend-examples/python-fastapi/requirements.txt

# Copy example files
cp ../backend-examples/python-fastapi/main.py ./
```

### 5. Database Setup

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Access database at:
# Host: localhost
# Port: 5432
# Database: carefund
# Username: carefund_user
# Password: carefund_password
```

#### Option B: Local PostgreSQL Installation
```bash
# Install PostgreSQL locally
# Create database
createdb carefund

# Connect and create user
psql carefund
CREATE USER carefund_user WITH ENCRYPTED PASSWORD 'carefund_password';
GRANT ALL PRIVILEGES ON DATABASE carefund TO carefund_user;
```

#### Option C: SQLite (Simplest for development)
```bash
# No setup required - just set DATABASE_URL in .env
DATABASE_URL=sqlite:///./carefund.db
```

### 6. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings
cursor .env
```

### 7. Database Migration
```bash
# Export current Supabase schema (if possible)
# Create migration files in database/ directory

# For Node.js backend:
npm run migrate

# For Python backend:
alembic upgrade head
```

## Cursor IDE Extensions (Recommended)

### Essential Extensions
- **TypeScript and JavaScript Language Features** (built-in)
- **Python** (for Python backend)
- **PostgreSQL** (for database management)
- **REST Client** (for API testing)
- **Auto Rename Tag**
- **Bracket Pair Colorizer**
- **GitLens**

### Install Extensions in Cursor
1. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Type "Extensions: Install Extensions"
3. Search and install the extensions listed above

## Cursor AI Features for Development

### 1. Code Generation
- Use **Ctrl+K** (Cmd+K) to generate code with AI
- Example prompts:
  - "Create an Express route for user authentication"
  - "Generate a PostgreSQL migration for the users table"
  - "Write a React hook for API calls"

### 2. Code Explanation
- Select code and use **Ctrl+L** (Cmd+L) to chat about it
- Ask questions like:
  - "Explain this authentication logic"
  - "How can I optimize this database query?"
  - "What are potential security issues here?"

### 3. Debugging Assistance
- Use AI to help debug errors
- Share error messages and get suggestions
- Ask for help with database connection issues

## Development Workflow

### 1. Frontend Development
```bash
# Navigate to frontend directory (or root if not separated)
cd frontend  # or stay in root
npm install
npm run dev
```

### 2. Backend Development

#### Node.js:
```bash
cd backend
npm install
npm run dev  # Starts with nodemon for auto-reload
```

#### Python:
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Database Management
```bash
# Access PostgreSQL
docker exec -it carefund-postgres-1 psql -U carefund_user -d carefund

# Or use pgAdmin in browser
open http://localhost:5050
```

## API Development Workflow

### 1. Design API Endpoints
- Start with authentication endpoints
- Add CRUD operations for each entity
- Implement proper error handling
- Add input validation

### 2. Test API Endpoints
- Use Cursor's built-in REST Client
- Create `.http` files for testing
- Example:
```http
### Login
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}

### Get NGOs
GET http://localhost:3001/api/ngos
Authorization: Bearer {{authToken}}
```

### 3. Update Frontend
- Replace Supabase calls with API calls
- Update authentication logic
- Handle API responses and errors

## Common Cursor Commands for Development

### Code Generation
- **Ctrl+K** (Cmd+K): Generate code
- **Ctrl+I** (Cmd+I): Edit code in place
- **Ctrl+L** (Cmd+L): Chat with AI about selected code

### File Management
- **Ctrl+P** (Cmd+P): Quick file open
- **Ctrl+Shift+P** (Cmd+Shift+P): Command palette
- **Ctrl+`** (Cmd+`): Toggle terminal

### Debugging
- **F5**: Start debugging
- **F9**: Toggle breakpoint
- **F10**: Step over
- **F11**: Step into

## Troubleshooting Common Issues

### 1. Port Conflicts
```bash
# Check what's running on ports
lsof -i :3001  # Backend port
lsof -i :5173  # Frontend port
lsof -i :5432  # PostgreSQL port
```

### 2. Database Connection Issues
- Verify PostgreSQL is running: `docker ps`
- Check environment variables in `.env`
- Test connection with database client

### 3. CORS Issues
- Ensure backend CORS settings include frontend URL
- Check if cookies/credentials are properly configured

### 4. TypeScript Errors
- Run `npm run build` to check for build errors
- Use Cursor's TypeScript language server
- Check import paths and type definitions

## Next Steps After Setup

1. **Implement Authentication**
   - JWT-based auth system
   - Password hashing and validation
   - Protected routes

2. **Migrate Database Schema**
   - Create all necessary tables
   - Set up relationships and constraints
   - Add indexes for performance

3. **Build API Endpoints**
   - Start with core functionality
   - Add proper error handling
   - Implement rate limiting

4. **Update Frontend**
   - Replace Supabase client calls
   - Update authentication flow
   - Handle API responses

5. **Testing and Deployment**
   - Write unit tests
   - Set up CI/CD pipeline
   - Deploy to cloud platform

## Resources
- **Cursor Documentation**: https://cursor.sh/docs
- **Express.js Guide**: https://expressjs.com/
- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **PostgreSQL Tutorial**: https://www.postgresql.org/docs/