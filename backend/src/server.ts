
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import dotenv from 'dotenv';
import path from 'path';
import pool from './database/connection';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import ngoRoutes from './routes/ngos';
import vendorRoutes from './routes/vendors';
import packageRoutes from './routes/packages';
import donationRoutes from './routes/donations';
import transactionRoutes from './routes/transactions';
import ticketRoutes from './routes/tickets';
import paymentsRouter from './routes/payments';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { attachUser } from './middleware/auth';

dotenv.config();

async function ensurePackageAssignmentsTable() {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.package_assignments (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
      ngo_id uuid NOT NULL REFERENCES public.ngos(id) ON DELETE CASCADE,
      vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
      is_active boolean NOT NULL DEFAULT true,
      status text DEFAULT 'pending',
      delivery_date date,
      notes text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz,
      UNIQUE (package_id, ngo_id, vendor_id)
    );
  `);
  // Remove legacy constraints from older schema versions that conflict with the new unified model
  await pool.query(`ALTER TABLE public.package_assignments DROP CONSTRAINT IF EXISTS check_assignment_type;`);
  // Proactively drop ANY remaining CHECK constraints on this table (safety for older migrations)
  const checks = await pool.query(`
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.package_assignments'::regclass AND contype = 'c'
  `);
  for (const row of checks.rows) {
    const name = row.conname as string;
    await pool.query(`ALTER TABLE public.package_assignments DROP CONSTRAINT IF EXISTS "${name}";`);
  }
  // Backfill columns if the table already exists without them
  await pool.query(`ALTER TABLE public.package_assignments ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;`);
  await pool.query(`ALTER TABLE public.package_assignments ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';`);
  await pool.query(`ALTER TABLE public.package_assignments ADD COLUMN IF NOT EXISTS delivery_date date;`);
  await pool.query(`ALTER TABLE public.package_assignments ADD COLUMN IF NOT EXISTS notes text;`);
  await pool.query(`ALTER TABLE public.package_assignments ADD COLUMN IF NOT EXISTS updated_at timestamptz;`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_pa_pkg ON public.package_assignments(package_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_pa_ngo ON public.package_assignments(ngo_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_pa_vendor ON public.package_assignments(vendor_id);`);
}

async function ensureProfileResetColumns() {
  // Make sure password reset columns exist on profiles
  await pool.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_reset_token text;`);
  await pool.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_reset_expires timestamptz;`);
  await pool.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash text;`);
}

// Debug endpoint to list package_assignments constraints (admin/dev only; no auth for local debug)
// Note: must be declared after app is initialized; this block is moved below app initialization

const app = express();
const PORT = process.env.PORT || 3001;
// Force-load Request augmentation so req.user is known everywhere
// import './types/express';

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: () => 500  // ← function, not a number
  //delayMs: 500 // begin adding 500ms of delay per request above 50
});

app.use(limiter);
app.use(speedLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});


// API routes that DO NOT need authentication (login/register)
app.use('/api/auth', authRoutes);

// Auth middleware - attach user to request (AFTER auth routes)
app.use(attachUser);
app.use('/api/users', userRoutes);
app.use('/api/ngos', ngoRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/payments', paymentsRouter);

// API documentation
app.get('/api', (req, res) => {
  res.json({
    message: 'Do Good Hub API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      ngos: '/api/ngos',
      vendors: '/api/vendors',
      packages: '/api/packages',
      donations: '/api/donations',
      transactions: '/api/transactions',
      tickets: '/api/tickets',
      payments: '/api/payments'
    }
  });
});

// (Removed debug endpoints before repo reset)

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Ensure database tables exist before starting server
Promise.all([ensurePackageAssignmentsTable(), ensureProfileResetColumns()]).then(() => {
  console.log('✅ package_assignments ready');
  
  // Start server only after database setup is complete
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API docs: http://localhost:${PORT}/api`);
  });
}).catch(err => {
  console.error('❌ ensurePackageAssignmentsTable', err);
  process.exit(1);
});

export default app; 