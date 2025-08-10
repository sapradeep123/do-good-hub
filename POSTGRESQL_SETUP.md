# PostgreSQL Setup Guide for Do Good Hub

## 🔍 **Current Status**

The project is currently using **mock data** but is **designed to work with PostgreSQL**. Here's how to connect it:

## 🚀 **Option 1: Docker (Recommended)**

### **Step 1: Start PostgreSQL with Docker**
```bash
# Start only PostgreSQL
docker-compose up -d postgres

# Or start everything (PostgreSQL + Backend + Frontend)
docker-compose up -d
```

### **Step 2: Set Environment Variables**
Create `backend/.env` file:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=do_good_hub
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:8080
```

### **Step 3: Run Database Migrations**
```bash
cd backend
npm run migrate
npm run seed
```

### **Step 4: Start Backend with PostgreSQL**
```bash
cd backend
node server.js
```

## 🛠️ **Option 2: Local PostgreSQL Installation**

### **Step 1: Install PostgreSQL**
- **Windows:** Download from https://www.postgresql.org/download/windows/
- **macOS:** `brew install postgresql`
- **Linux:** `sudo apt-get install postgresql postgresql-contrib`

### **Step 2: Create Database**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE do_good_hub;

# Create user (optional)
CREATE USER dogoodhub WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE do_good_hub TO dogoodhub;

# Exit
\q
```

### **Step 3: Set Environment Variables**
Create `backend/.env` file:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=do_good_hub
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:8080
```

### **Step 4: Run Migrations and Start**
```bash
cd backend
npm run migrate
npm run seed
node server.js
```

## 🔧 **Option 3: Use Mock Data (Current)**

If you want to continue using mock data (for development/demo):

### **Set Environment Variable**
```bash
# Add to backend/.env
USE_MOCK_DATA=true
```

### **Start Backend**
```bash
cd backend
node server.js
```

## 📊 **Database Schema**

The project includes these tables:

### **profiles** (Users)
- `id` (UUID)
- `user_id` (UUID)
- `email` (VARCHAR)
- `first_name` (VARCHAR)
- `last_name` (VARCHAR)
- `password_hash` (VARCHAR)
- `role` (VARCHAR)
- `created_at` (TIMESTAMP)

### **ngos**
- `id` (UUID)
- `user_id` (UUID)
- `name` (VARCHAR)
- `description` (TEXT)
- `mission` (TEXT)
- `website` (VARCHAR)
- `address` (VARCHAR)
- `city` (VARCHAR)
- `state` (VARCHAR)
- `verified` (BOOLEAN)

### **packages**
- `id` (UUID)
- `ngo_id` (UUID)
- `title` (VARCHAR)
- `description` (TEXT)
- `amount` (DECIMAL)
- `category` (VARCHAR)
- `target_quantity` (INTEGER)
- `current_quantity` (INTEGER)
- `status` (VARCHAR)

## 🔄 **Switching Between Mock and PostgreSQL**

### **To Use PostgreSQL:**
```bash
# Remove or comment out this line in backend/.env
# USE_MOCK_DATA=true

# Add PostgreSQL connection details
DB_HOST=localhost
DB_PORT=5432
DB_NAME=do_good_hub
DB_USER=postgres
DB_PASSWORD=password
```

### **To Use Mock Data:**
```bash
# Add this line to backend/.env
USE_MOCK_DATA=true

# Or remove DB_HOST to force mock data
# DB_HOST=
```

## 🎯 **Quick Test**

### **Test PostgreSQL Connection:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Or check local PostgreSQL
psql -U postgres -d do_good_hub -c "SELECT version();"
```

### **Test Backend with PostgreSQL:**
```bash
cd backend
node server.js
# Should show: "✅ Using PostgreSQL database connection"
# And: "✅ Connected to PostgreSQL database"
```

## 🚨 **Troubleshooting**

### **Connection Issues:**
1. **Check if PostgreSQL is running:**
   ```bash
   docker ps | grep postgres
   ```

2. **Check environment variables:**
   ```bash
   cat backend/.env
   ```

3. **Test connection manually:**
   ```bash
   psql -h localhost -U postgres -d do_good_hub
   ```

### **Migration Issues:**
1. **Run migrations manually:**
   ```bash
   cd backend
   npm run migrate
   ```

2. **Check migration files:**
   ```bash
   ls backend/src/database/migrations/
   ```

## ✅ **Success Indicators**

When PostgreSQL is properly connected:
- ✅ Backend shows: "✅ Using PostgreSQL database connection"
- ✅ Backend shows: "✅ Connected to PostgreSQL database"
- ✅ All CRUD operations work with real data
- ✅ Data persists between server restarts

## 🎉 **Ready to Use!**

Once PostgreSQL is connected:
- **All Admin Dashboard features work with real data**
- **Data persists in the database**
- **Full CRUD operations available**
- **Ready for production deployment**

**Choose the option that works best for your setup!** 