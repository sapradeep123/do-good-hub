# Do Good Hub Backend

A Node.js Express backend with PostgreSQL database for the Do Good Hub application.

## Features

- 🔐 JWT Authentication
- 🗄️ PostgreSQL Database
- 🚀 Express.js API
- 📝 Input Validation
- 🔒 Rate Limiting
- 🛡️ Security Headers
- 📧 Email Support
- 📁 File Uploads
- 🐳 Docker Support

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker (optional)

### Option 1: Local Development

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Set up PostgreSQL database:**
   ```bash
   # Create database
   createdb do_good_hub
   
   # Run migrations
   npm run migrate
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```

### Option 2: Docker (Recommended)

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **Check services:**
   ```bash
   docker-compose ps
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f backend
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Health Check
- `GET /health` - Server health status
- `GET /api` - API documentation

## Database Schema

The application uses the following main tables:

- **profiles** - User profiles and authentication
- **ngos** - NGO organizations
- **vendors** - Vendor companies
- **packages** - Donation packages
- **donations** - User donations
- **transactions** - Supply chain transactions
- **tickets** - Support tickets

## Environment Variables

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=do_good_hub
DB_USER=postgres
DB_PASSWORD=password
DATABASE_URL=postgresql://postgres:password@localhost:5432/do_good_hub

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:8082
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with sample data
- `npm test` - Run tests

### Project Structure

```
backend/
├── src/
│   ├── database/
│   │   ├── connection.ts
│   │   ├── migrate.ts
│   │   └── migrations/
│   ├── middleware/
│   │   ├── errorHandler.ts
│   │   └── notFound.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── ngos.ts
│   │   ├── vendors.ts
│   │   ├── packages.ts
│   │   ├── donations.ts
│   │   ├── transactions.ts
│   │   └── tickets.ts
│   └── server.ts
├── uploads/
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

## Migration from Supabase

This backend replaces the Supabase backend with:

1. **PostgreSQL Database** - Direct database access
2. **JWT Authentication** - Custom JWT implementation
3. **Express.js API** - RESTful API endpoints
4. **File Uploads** - Local file storage
5. **Email Support** - SMTP email integration

### Migration Steps

1. **Export data from Supabase** (if needed)
2. **Run database migrations** to create schema
3. **Update frontend** to use new API endpoints
4. **Test all functionality** with new backend

## Security Features

- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Input validation
- ✅ JWT authentication
- ✅ Password hashing
- ✅ SQL injection prevention

## Performance Features

- ✅ Connection pooling
- ✅ Compression middleware
- ✅ Database indexing
- ✅ Query optimization
- ✅ Caching support (ready for Redis)

## Deployment

### Production Environment Variables

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=your-production-secret-key
DATABASE_URL=postgresql://user:password@host:port/database
```

### Docker Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Support

For issues and questions, please check the main project documentation or create an issue in the repository. 