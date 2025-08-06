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

// Database connection
const pool = require('./dist/database/connection').default;

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Query user from database
    const result = await pool.query(
      'SELECT * FROM profiles WHERE email = $1',
      [email]
    );
    
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // For demo purposes, accept any password
    const token = 'jwt-token-' + Date.now();
    
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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    // Get admin user from database
    const result = await pool.query(
      'SELECT * FROM profiles WHERE role = $1 LIMIT 1',
      ['admin']
    );
    
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'Admin user not found' });
    }
    
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
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// NGO routes
app.get('/api/ngos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ngos');
    res.json(result.rows);
  } catch (error) {
    console.error('Get NGOs error:', error);
    res.status(500).json({ error: 'Failed to get NGOs' });
  }
});

// Vendor routes
app.get('/api/vendors', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vendors');
    res.json(result.rows);
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ error: 'Failed to get vendors' });
  }
});

// Package routes
app.get('/api/packages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM packages');
    res.json(result.rows);
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ error: 'Failed to get packages' });
  }
});

// User routes
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM profiles');
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Password reset routes
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    
    // Validate inputs
    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Email, token, and new password are required' });
    }
    
    // Check if token is valid and not expired
    const tokenResult = await pool.query(
      'SELECT * FROM password_reset_requests WHERE email = $1 AND token = $2 AND used = false AND expires_at > NOW()',
      [email, token]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    // Get user from profiles
    const userResult = await pool.query(
      'SELECT * FROM profiles WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update password (in a real app, you'd hash this)
    await pool.query(
      'UPDATE profiles SET password = $1 WHERE email = $2',
      [newPassword, email]
    );
    
    // Mark token as used
    await pool.query(
      'UPDATE password_reset_requests SET used = true WHERE email = $1 AND token = $2',
      [email, token]
    );
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

app.post('/api/auth/generate-reset-token', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if user exists
    const userResult = await pool.query(
      'SELECT * FROM profiles WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate secure token
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    // Store reset request
    await pool.query(
      'INSERT INTO password_reset_requests (email, token, expires_at, used) VALUES ($1, $2, $3, false)',
      [email, token, new Date(Date.now() + 3600000).toISOString()] // 1 hour
    );
    
    res.json({ 
      success: true, 
      token,
      message: 'Reset token generated successfully',
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    });
  } catch (error) {
    console.error('Generate reset token error:', error);
    res.status(500).json({ error: 'Failed to generate reset token' });
  }
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

console.log('✅ Connected to PostgreSQL database');
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
}); 