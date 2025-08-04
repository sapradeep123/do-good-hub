const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

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
  delayMs: () => 500 // begin adding 500ms of delay per request above 50
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mock data
const mockUsers = [
  {
    id: '1',
    user_id: '1',
    email: 'admin@dogoodhub.com',
    first_name: 'Admin',
    last_name: 'User',
    password_hash: '$2a$10$C3Gi.3J.LslKr0BcfO1oJuvHtTPnDV6dXH52x2Rrl/PGl/dVnu.S2',
    role: 'admin',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    user_id: '2',
    email: 'testuser2@gmail.com',
    first_name: 'Test',
    last_name: 'User',
    password_hash: '$2a$10$C3Gi.3J.LslKr0BcfO1oJuvHtTPnDV6dXH52x2Rrl/PGl/dVnu.S2',
    role: 'user',
    created_at: new Date().toISOString()
  }
];

const mockNGOs = [
  {
    id: '1',
    name: 'Save the Children',
    email: 'contact@savethechildren.org',
    description: 'Working to improve the lives of children worldwide',
    mission: 'To ensure every child has a healthy start in life',
    location: 'New York, USA',
    category: 'Child Welfare',
    phone: '+1-800-728-3843',
    website_url: 'https://www.savethechildren.org',
    registration_number: 'NGO001',
    user_id: '1',
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Doctors Without Borders',
    email: 'info@msf.org',
    description: 'Medical humanitarian organization',
    mission: 'To provide medical assistance to people affected by conflict',
    location: 'Geneva, Switzerland',
    category: 'Healthcare',
    phone: '+41-22-849-8400',
    website_url: 'https://www.msf.org',
    registration_number: 'NGO002',
    user_id: '2',
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString()
  }
];

const mockVendors = [
  {
    id: '1',
    company_name: 'Food Supply Co.',
    contact_person: 'John Smith',
    email: 'john@foodsupply.com',
    phone: '+1-555-0123',
    address: '123 Main St, New York, NY',
    description: 'Food and nutrition supplies',
    user_id: '1',
    ngo_id: '1',
    ngo_name: 'Save the Children',
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    company_name: 'Medical Equipment Ltd.',
    contact_person: 'Sarah Johnson',
    email: 'sarah@medequip.com',
    phone: '+1-555-0456',
    address: '456 Oak Ave, Boston, MA',
    description: 'Medical supplies and equipment',
    user_id: '2',
    ngo_id: '2',
    ngo_name: 'Doctors Without Borders',
    is_active: true,
    created_at: new Date().toISOString()
  }
];

const mockPackages = [
  {
    id: '1',
    title: 'Emergency Food Kit',
    description: 'Basic food supplies for emergency situations',
    amount: 50.00,
    category: 'Food & Nutrition',
    items_included: ['Rice', 'Beans', 'Cooking oil', 'Salt'],
    delivery_timeline: '2-3 days',
    is_active: true,
    ngo_id: '1',
    vendor_id: '1',
    ngo_name: 'Save the Children',
    vendor_name: 'Food Supply Co.',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Medical First Aid Kit',
    description: 'Essential medical supplies for emergency response',
    amount: 75.00,
    category: 'Healthcare',
    items_included: ['Bandages', 'Antiseptic', 'Pain relievers', 'Thermometer'],
    delivery_timeline: '1-2 days',
    is_active: true,
    ngo_id: '2',
    vendor_id: '2',
    ngo_name: 'Doctors Without Borders',
    vendor_name: 'Medical Equipment Ltd.',
    created_at: new Date().toISOString()
  }
];

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = mockUsers.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // For demo purposes, accept any password
  const token = 'mock-jwt-token-' + Date.now();
  
  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      token
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  // Mock authentication - return admin user
  const user = mockUsers.find(u => u.role === 'admin');
  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role
    }
  });
});

// NGO routes
app.get('/api/ngos', (req, res) => {
  res.json(mockNGOs);
});

// Vendor routes
app.get('/api/vendors', (req, res) => {
  res.json(mockVendors);
});

// Package routes
app.get('/api/packages', (req, res) => {
  res.json(mockPackages);
});

// User routes
app.get('/api/users', (req, res) => {
  res.json(mockUsers);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

console.log('🔧 Using mock database connection for demonstration');
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
}); 