# 🚀 Do Good Hub - Team Setup Guide

## 📋 Prerequisites

Before you start, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download here](https://www.postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/)

## 🎯 Quick Start (Recommended)

### 1. Clone the Repository
```bash
git clone https://github.com/sapradeep123/do-good-hub.git
cd do-good-hub
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Database Setup
```bash
# Create a PostgreSQL database named 'dogoodhub'
# Update backend/.env with your database credentials
```

### 4. Start the Project
```bash
# Windows
restart-project.bat

# Mac/Linux
./restart-project.sh
```

## 🔧 Manual Setup (Alternative)

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
# In a new terminal
npm install
npm run dev
```

## 🌐 Access URLs

- **Frontend Application**: http://localhost:5173
- **Admin Dashboard**: http://localhost:5173/admin
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🔐 Default Admin Account

- **Email**: admin@dogoodhub.com
- **Password**: (set during first run)

## 🧹 Data Management

### Clear Sample Data
- Login as Admin
- Click the "🗑️ Clear Sample Data" button
- All sample data will be cleared for fresh testing

### Create New Data
- Use the Admin Dashboard to create NGOs, vendors, and packages
- Test the complete workflow from scratch

## 🐛 Troubleshooting

### Common Issues

#### 1. "Failed to fetch" Error
- Ensure backend is running on port 3001
- Check CORS configuration
- Verify database connection

#### 2. Database Connection Issues
- Check PostgreSQL is running
- Verify database credentials in backend/.env
- Ensure database 'dogoodhub' exists

#### 3. Port Already in Use
- Run `restart-project.bat` to stop all processes
- Check for other applications using ports 3001 or 5173

#### 4. Password Reset Issues
- Use the debug endpoint: `/api/auth/debug-user/:email`
- Check backend console for detailed logs

### Debug Commands

```bash
# Check if backend is running
curl http://localhost:3001/health

# Check database connection
cd backend
npm run dev
```

## 📁 Project Structure

```
do-good-hub/
├── src/                    # Frontend source code
├── backend/               # Backend source code
├── clear-data.sql         # Database cleanup script
├── restart-project.bat    # Windows startup script
├── restart-project.sh     # Mac/Linux startup script
└── TEAM_SETUP_GUIDE.md   # This file
```

## 🔄 Development Workflow

1. **Pull latest changes**: `git pull origin main`
2. **Install new dependencies**: `npm install` (if package.json changed)
3. **Start development**: `restart-project.bat`
4. **Make changes and test**
5. **Commit and push**: `git add . && git commit -m "message" && git push`

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Look at the browser console for errors
3. Check the backend console for logs
4. Contact the team lead

## ✨ Features Available

- ✅ **User Authentication** (Login/Register)
- ✅ **Admin Dashboard** with data management
- ✅ **NGO Management** (Create, Edit, Delete)
- ✅ **Vendor Management** (Create, Edit, Delete)
- ✅ **Package Management** (Create, Edit, Delete)
- ✅ **Data Cleanup System** (Clear all sample data)
- ✅ **Password Reset** (Admin-initiated)
- ✅ **Transaction Tracking** (Coming soon)
- ✅ **User Purchase Flow** (Coming soon)

---

**Happy Coding! 🎉**
