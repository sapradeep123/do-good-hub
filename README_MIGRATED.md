# 🎉 Do Good Hub - Migrated Version

## ✅ **Complete Migration: Supabase → PostgreSQL + Node.js**

This branch contains the fully migrated Do Good Hub application from Supabase to a self-hosted PostgreSQL database with a custom Node.js Express backend.

---

## 🏗️ **Architecture**

### **Backend (Node.js + Express + TypeScript)**
- **Port:** `3001`
- **Database:** PostgreSQL
- **Authentication:** JWT tokens
- **Security:** bcryptjs, helmet, CORS, rate limiting

### **Frontend (React + Vite + TypeScript)**
- **Port:** `8080`
- **API Client:** Custom fetch-based client
- **State Management:** React Context for auth
- **UI:** Shadcn/ui components

### **Database (PostgreSQL)**
- **Host:** `localhost:5432`
- **Database:** `do_good_hub`
- **User:** `postgres`
- **Password:** `postgres@123`

---

## 🚀 **Quick Start**

### **Prerequisites**
1. Node.js (v18 or higher)
2. PostgreSQL (v12 or higher)
3. Git

### **1. Clone the Repository**
```bash
git clone https://github.com/sapradeep123/do-good-hub.git
cd do-good-hub
git checkout migration-postgres-nodejs
```

### **2. Set Up Database**
```bash
# Create PostgreSQL database
createdb do_good_hub

# Or using psql
psql -U postgres -c "CREATE DATABASE do_good_hub;"
```

### **3. Set Up Backend**
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your database credentials
npm run dev
```

### **4. Set Up Frontend**
```bash
# In a new terminal
npm install
cp .env.example .env
# Edit .env with VITE_API_URL=http://localhost:3001
npm run dev
```

### **5. Access Application**
- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health

---

## 🔐 **User Credentials**

### **👤 Regular User:**
- **Email:** `testuser2@gmail.com`
- **Password:** `Password123`
- **Role:** `user`

### **👨‍💼 Admin User:**
- **Email:** `admin@dogoodhub.com`
- **Password:** `Admin@123`
- **Role:** `admin`

---

## 📁 **Project Structure**

```
do-good-hub/
├── backend/                 # Node.js Express backend
│   ├── src/
│   │   ├── server.ts       # Main server file
│   │   ├── database/       # Database connection & migrations
│   │   ├── routes/         # API endpoints
│   │   └── middleware/     # Express middleware
│   ├── package.json
│   └── .env               # Backend environment variables
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities & API client
│   └── main.tsx           # App entry point
├── package.json           # Frontend dependencies
└── .env                   # Frontend environment variables
```

---

## 🔧 **Environment Variables**

### **Backend (.env)**
```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=do_good_hub
DB_USER=postgres
DB_PASSWORD=postgres@123
DATABASE_URL=postgresql://postgres:postgres@123@localhost:5432/do_good_hub
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:8080
```

### **Frontend (.env)**
```env
VITE_API_URL=http://localhost:3001
```

---

## 📊 **API Endpoints**

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### **Health Check**
- `GET /health` - Server health status

---

## 🛠️ **Development Commands**

### **Backend**
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run migrate      # Run database migrations
```

### **Frontend**
```bash
npm run dev          # Start development server
npm run build        # Build for production
```

---

## 🔒 **Security Features**

- **Password Hashing:** bcryptjs
- **JWT Tokens:** 7-day expiration
- **CORS Protection:** Configured for frontend
- **Rate Limiting:** Express rate limit
- **Security Headers:** Helmet middleware
- **Input Validation:** Express validator

---

## 📈 **Performance Improvements**

- **Database:** Direct PostgreSQL connection (no Supabase overhead)
- **Authentication:** Custom JWT system (faster than Supabase Auth)
- **API:** Optimized Express.js endpoints
- **Caching:** Built-in response compression

---

## 🎯 **Migration Benefits**

1. **✅ Better Performance:** Direct database access
2. **✅ Full Control:** Custom authentication system
3. **✅ Cost Effective:** No Supabase subscription needed
4. **✅ Scalable:** Can deploy anywhere
5. **✅ Customizable:** Full control over features

---

## 🚨 **Important Notes**

1. **Database Backup:** Always backup your PostgreSQL database
2. **Environment Variables:** Keep `.env` files secure and never commit them
3. **JWT Secret:** Change the JWT secret in production
4. **SSL:** Use HTTPS in production
5. **Monitoring:** Set up proper logging and monitoring

---

## 📞 **Support**

If you need help with:
- Database issues
- Authentication problems
- API endpoints
- Frontend integration

The migration is complete and fully functional! 🎉

---

## 🔄 **Branch Information**

- **Branch:** `migration-postgres-nodejs`
- **Base Branch:** `main`
- **Migration Status:** ✅ COMPLETE
- **System Status:** ✅ OPERATIONAL

**Last Updated:** July 29, 2025 