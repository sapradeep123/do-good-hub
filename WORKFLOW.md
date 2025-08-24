# 🔄 Do Good Hub - Application Workflow

## 📋 Overview

This document outlines the complete workflow for the Do Good Hub application - a transparent donation platform connecting donors with verified NGOs. The application has been successfully migrated from Supabase to a custom Python FastAPI backend with PostgreSQL.

---

## 🏗️ System Architecture

### **Technology Stack**
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Shadcn/ui
- **Backend:** Python + FastAPI + SQLAlchemy + JWT Authentication
- **Database:** PostgreSQL
- **Deployment:** Docker Compose

### **Application Structure**
```
do-good-hub/
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom hooks
│   │   └── lib/               # API client & utilities
│   └── package.json
├── backend_python/             # Python FastAPI
│   ├── app/
│   │   ├── routes/            # API endpoints
│   │   ├── middleware/        # FastAPI middleware
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   └── database/          # DB connection & migrations
│   └── requirements.txt
├── docker-compose.yml          # Container orchestration
└── README.md
```

---

## 🚀 Development Workflow

### **1. Environment Setup**

#### Prerequisites
- Python 3.11+
- PostgreSQL 15+
- Git
- Docker (optional)

#### Initial Setup
```bash
# Clone repository
git clone <repository-url>
cd do-good-hub

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend_python
pip install -r requirements.txt
cd ..
```

#### Environment Configuration

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:8000
```

**Backend (.env)**
```env
PORT=8000
ENVIRONMENT=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=do_good_hub
DB_USER=postgres
DB_PASSWORD=postgres@123
DATABASE_URL=postgresql://postgres:postgres@123@localhost:5432/do_good_hub
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:8080
```

### **2. Development Process**

#### Starting Development Servers

**Option A: Manual Start**
```bash
# Terminal 1: Start Backend
cd backend_python
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Start Frontend
npm run dev
```

**Option B: Docker Compose**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Development URLs
- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:8000
- **Health Check:** http://localhost:8000/health
- **Database:** localhost:5432

### **3. Code Development Workflow**

#### Feature Development
1. **Create Feature Branch**
   ```bash
   git checkout -b feature/feature-name
   ```

2. **Frontend Development**
   - Create/modify components in `src/components/`
   - Add pages in `src/pages/`
   - Update API calls in `src/lib/api.ts`
   - Add types and interfaces

3. **Backend Development**
   - Add routes in `backend_python/app/routes/`
   - Create middleware in `backend_python/app/middleware/`
   - Update SQLAlchemy models in `backend_python/app/models/`
   - Add Pydantic schemas in `backend_python/app/schemas/`
   - Update database schema if needed
   - Add validation and error handling

4. **Testing**
   ```bash
   # Frontend testing
   npm run lint
   npm run build
   
   # Backend testing
   cd backend_python
   python -m pytest
   python -c "from app.main import app; print('App imports successfully')"
   ```

5. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: add feature description"
   git push origin feature/feature-name
   ```

---

## 🔐 Authentication Workflow

### **User Roles**
- **Admin:** Full system access, user management
- **NGO:** Manage profiles, packages, donations
- **Vendor:** Handle purchase orders, invoices
- **User:** Browse NGOs, make donations

### **Authentication Flow**
1. User registers/logs in via `/api/auth/login`
2. Backend validates credentials and returns JWT token
3. Frontend stores token and includes in API requests
4. Backend middleware validates token for protected routes
5. Role-based access control enforced

### **Test Credentials**
```
Admin: admin@dogoodhub.com / Admin@123
User: testuser2@gmail.com / Password123
```

---

## 📊 Database Workflow

### **Database Schema**
- `profiles` - User information
- `user_roles` - Role assignments
- `ngos` - NGO details and verification
- `vendors` - Vendor information
- `packages` - Donation packages
- `donations` - Transaction records
- `transactions` - Order fulfillment
- `purchase_orders` - Vendor orders
- `vendor_invoices` - Invoice management
- `page_content` - CMS content

### **Migration Process**
```bash
# Run database migrations
cd backend_python
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "migration description"
```

---

## 🚀 Deployment Workflow

### **Production Deployment**

#### 1. Environment Preparation
```bash
# Production environment variables
ENVIRONMENT=production
PORT=8000
DB_HOST=your-production-db-host
JWT_SECRET=your-production-jwt-secret
CORS_ORIGINS=https://your-domain.com
```

#### 2. Build Process
```bash
# Build frontend
npm run build

# Install backend dependencies
cd backend_python
pip install -r requirements.txt
```

#### 3. Docker Deployment
```bash
# Production docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

#### 4. Database Setup
```bash
# Run migrations in production
docker exec -it do-good-hub-backend alembic upgrade head
```

### **CI/CD Pipeline**

#### GitHub Actions Workflow
```yaml
name: Deploy Do Good Hub
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          npm install
          cd backend && npm install
      - name: Build application
        run: |
          npm run build
          cd backend && npm run build
      - name: Deploy to server
        run: |
          # Add deployment commands
```

---

## 🔧 Maintenance Workflow

### **Regular Maintenance Tasks**

#### Daily
- Monitor application logs
- Check system health endpoints
- Review error reports

#### Weekly
- Database backup verification
- Performance metrics review
- Security updates check

#### Monthly
- Dependency updates
- Security audit
- Database optimization

### **Monitoring Commands**
```bash
# Check application status
curl http://localhost:3001/health

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Database backup
pg_dump do_good_hub > backup_$(date +%Y%m%d).sql
```

---

## 🐛 Troubleshooting Workflow

### **Common Issues**

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U postgres -d do_good_hub
```

#### Authentication Problems
```bash
# Verify JWT secret
echo $JWT_SECRET

# Check token expiration
# Review browser localStorage
```

#### API Issues
```bash
# Check backend logs
npm run dev

# Test API endpoints
curl http://localhost:3001/health
```

### **Debug Mode**
```bash
# Enable debug logging
NODE_ENV=development DEBUG=* npm run dev
```

---

## 📈 Performance Optimization

### **Frontend Optimization**
- Code splitting with React.lazy()
- Image optimization
- Bundle size monitoring
- Caching strategies

### **Backend Optimization**
- Database query optimization
- Response compression
- Rate limiting
- Connection pooling

### **Database Optimization**
- Index optimization
- Query performance monitoring
- Regular VACUUM operations

---

## 🔒 Security Workflow

### **Security Checklist**
- [ ] JWT secrets rotated regularly
- [ ] HTTPS enabled in production
- [ ] Rate limiting configured
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] CORS properly configured
- [ ] Dependencies updated

### **Security Commands**
```bash
# Audit dependencies
npm audit
npm audit fix

# Check for vulnerabilities
npm run security-check
```

---

## 📞 Support Workflow

### **Issue Resolution Process**
1. **Issue Identification**
   - User reports or monitoring alerts
   - Log analysis
   - Error tracking

2. **Triage**
   - Severity assessment
   - Impact analysis
   - Priority assignment

3. **Resolution**
   - Root cause analysis
   - Fix implementation
   - Testing and validation

4. **Deployment**
   - Staging deployment
   - Production deployment
   - Monitoring

### **Emergency Response**
```bash
# Quick rollback
git revert <commit-hash>
docker-compose restart

# Emergency maintenance mode
# Update nginx config to show maintenance page
```

---

## 📚 Documentation Workflow

### **Documentation Updates**
- API documentation (OpenAPI/Swagger)
- Component documentation (Storybook)
- Database schema documentation
- Deployment guides
- User manuals

### **Documentation Commands**
```bash
# Generate API docs
npm run docs:api

# Update component docs
npm run storybook
```

---

## 🎯 Quality Assurance

### **Testing Strategy**
- Unit tests for components and functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Performance testing
- Security testing

### **Testing Commands**
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

---

## 📋 Checklist Templates

### **Pre-Deployment Checklist**
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Environment variables updated
- [ ] Database migrations ready
- [ ] Backup created
- [ ] Monitoring configured
- [ ] Rollback plan prepared

### **Post-Deployment Checklist**
- [ ] Application accessible
- [ ] Health checks passing
- [ ] Authentication working
- [ ] Database connectivity verified
- [ ] Monitoring alerts configured
- [ ] Performance metrics normal

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Status:** ✅ ACTIVE