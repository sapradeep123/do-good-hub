
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import dotenv from 'dotenv';
import path from 'path';

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

const app = express();
const PORT = process.env.PORT || 3001;
// Force-load Request augmentation so req.user is known everywhere
// import './types/express';

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
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

// Auth middleware - attach user to request
app.use(attachUser);

// API routes
app.use('/api/auth', authRoutes);
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

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api`);
});

export default app; 