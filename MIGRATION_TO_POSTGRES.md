# Migration Guide: Supabase to PostgreSQL + Node.js Backend

This guide will help you migrate from Supabase to a custom PostgreSQL database with Node.js backend for better performance and maintainability.

## 🎯 Migration Overview

### What We're Migrating From
- **Supabase** (PostgreSQL-as-a-Service)
- **Supabase Auth** (Built-in authentication)
- **Supabase Storage** (File storage)
- **Supabase Edge Functions** (Serverless functions)

### What We're Migrating To
- **PostgreSQL** (Direct database access)
- **Node.js Express** (Custom backend API)
- **JWT Authentication** (Custom auth system)
- **Local File Storage** (File uploads)
- **Docker Compose** (Easy development setup)

## 🚀 Quick Start

### 1. Start the New Backend

```bash
# Start PostgreSQL and Node.js backend
docker-compose up -d postgres backend

# Check if services are running
docker-compose ps

# View backend logs
docker-compose logs -f backend
```

### 2. Test the Backend

```bash
# Health check
curl http://localhost:3001/health

# API documentation
curl http://localhost:3001/api
```

### 3. Update Frontend Environment

Create `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3001
```

## 📊 Database Schema Migration

### Current Supabase Tables → New PostgreSQL Tables

| Supabase Table | PostgreSQL Table | Status |
|----------------|------------------|--------|
| `auth.users` | `profiles` | ✅ Migrated |
| `public.profiles` | `profiles` | ✅ Merged |
| `public.ngos` | `ngos` | ✅ Migrated |
| `public.vendors` | `vendors` | ✅ Migrated |
| `public.packages` | `packages` | ✅ Migrated |
| `public.donations` | `donations` | ✅ Migrated |
| `public.transactions` | `transactions` | ✅ Migrated |
| `public.tickets` | `tickets` | ✅ Migrated |

### Key Changes

1. **Authentication**: Supabase Auth → Custom JWT
2. **User Management**: `auth.users` + `profiles` → Single `profiles` table
3. **Row Level Security**: Supabase RLS → Custom middleware
4. **File Storage**: Supabase Storage → Local file system

## 🔄 Frontend Migration Steps

### 1. Replace Supabase Client

**Before (Supabase):**
```typescript
import { supabase } from '@/integrations/supabase/client';

// Auth
const { data, error } = await supabase.auth.signUp({ email, password });
const { data, error } = await supabase.auth.signInWithPassword({ email, password });

// Database
const { data, error } = await supabase.from('ngos').select('*');
```

**After (Custom API):**
```typescript
import { apiClient } from '@/lib/api';

// Auth
const authData = await apiClient.register({ email, password, firstName, lastName });
const authData = await apiClient.login({ email, password });

// Database
const ngos = await apiClient.get('/api/ngos');
```

### 2. Update Authentication Hook

**Before:**
```typescript
// src/hooks/useAuth.tsx
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
  }, []);
  
  return { user };
};
```

**After:**
```typescript
// src/hooks/useAuth.tsx
import { apiClient } from '@/lib/api';
import type { User } from '@/lib/api';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (apiClient.isAuthenticated()) {
          const userData = await apiClient.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        apiClient.logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const authData = await apiClient.login({ email, password });
    setUser(authData.user);
    return authData;
  };

  const register = async (userData: any) => {
    const authData = await apiClient.register(userData);
    setUser(authData.user);
    return authData;
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
  };

  return { user, loading, login, register, logout };
};
```

### 3. Update API Calls

**Before (Supabase):**
```typescript
// Get NGOs
const { data: ngos, error } = await supabase
  .from('ngos')
  .select('*')
  .eq('verified', true);

// Create donation
const { data, error } = await supabase
  .from('donations')
  .insert([donationData])
  .select();
```

**After (Custom API):**
```typescript
// Get NGOs
const ngos = await apiClient.get('/api/ngos?verified=true');

// Create donation
const donation = await apiClient.post('/api/donations', donationData);
```

### 4. Update File Uploads

**Before (Supabase Storage):**
```typescript
const { data, error } = await supabase.storage
  .from('ngo-logos')
  .upload(fileName, file);
```

**After (Local Storage):**
```typescript
const formData = new FormData();
formData.append('file', file);

const response = await fetch(`${apiClient.baseURL}/api/upload`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiClient.getToken()}`
  },
  body: formData
});
```

## 🔧 Backend Development

### Running Locally

```bash
cd backend

# Install dependencies
npm install

# Set up environment
cp env.example .env
# Edit .env with your settings

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login user |
| `GET` | `/api/auth/me` | Get current user |
| `GET` | `/api/ngos` | Get all NGOs |
| `POST` | `/api/ngos` | Create NGO |
| `GET` | `/api/packages` | Get all packages |
| `POST` | `/api/donations` | Create donation |
| `GET` | `/health` | Health check |

### Database Management

```bash
# Run migrations
npm run migrate

# Seed database (when available)
npm run seed

# Connect to database
psql -h localhost -U postgres -d do_good_hub
```

## 🐳 Docker Setup

### Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production
```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 Security Considerations

### JWT Configuration
- Use strong JWT secrets in production
- Set appropriate token expiration
- Implement token refresh mechanism

### Database Security
- Use connection pooling
- Implement proper input validation
- Set up database backups

### API Security
- Rate limiting enabled
- CORS properly configured
- Input validation on all endpoints
- Helmet.js security headers

## 📈 Performance Improvements

### Database Optimizations
- ✅ Indexes on frequently queried columns
- ✅ Connection pooling
- ✅ Query optimization

### API Optimizations
- ✅ Compression middleware
- ✅ Response caching (ready for Redis)
- ✅ Efficient error handling

### Frontend Optimizations
- ✅ API request batching
- ✅ Error boundary implementation
- ✅ Loading states

## 🧪 Testing the Migration

### 1. Test Authentication
```bash
# Register a new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. Test Frontend
1. Start the frontend: `npm run dev`
2. Navigate to `http://localhost:8082`
3. Test registration and login
4. Verify all features work correctly

### 3. Test Database
```bash
# Connect to database
docker exec -it do-good-hub-postgres psql -U postgres -d do_good_hub

# Check tables
\dt

# Check data
SELECT * FROM profiles;
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps
   
   # Check logs
   docker-compose logs postgres
   ```

2. **Backend Won't Start**
   ```bash
   # Check environment variables
   cat backend/.env
   
   # Check logs
   docker-compose logs backend
   ```

3. **Frontend Can't Connect to Backend**
   - Verify `VITE_API_URL` in `.env`
   - Check CORS configuration
   - Ensure backend is running on port 3001

4. **Authentication Issues**
   - Check JWT secret configuration
   - Verify token storage in localStorage
   - Check API client implementation

## 📋 Migration Checklist

- [ ] Set up PostgreSQL database
- [ ] Run database migrations
- [ ] Start Node.js backend
- [ ] Update frontend environment variables
- [ ] Replace Supabase client with API client
- [ ] Update authentication hooks
- [ ] Update all API calls
- [ ] Test authentication flow
- [ ] Test all features
- [ ] Update file upload functionality
- [ ] Test in production environment
- [ ] Set up monitoring and logging

## 🎉 Benefits of Migration

### Performance
- ✅ Direct database access (no API overhead)
- ✅ Custom query optimization
- ✅ Better connection management
- ✅ Reduced latency

### Maintainability
- ✅ Full control over database schema
- ✅ Custom business logic
- ✅ Better debugging capabilities
- ✅ Easier testing

### Scalability
- ✅ Horizontal scaling capability
- ✅ Custom caching strategies
- ✅ Load balancing support
- ✅ Microservices architecture ready

### Cost
- ✅ No per-user pricing
- ✅ Predictable costs
- ✅ Better resource utilization
- ✅ Self-hosted option available

## 📞 Support

If you encounter issues during migration:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables
3. Test individual components
4. Review the troubleshooting section above

For additional help, refer to the backend README or create an issue in the repository. 