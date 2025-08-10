import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import pool from '../database/connection';

const router = express.Router();

// Register user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('role').optional().isIn(['user', 'admin', 'ngo', 'vendor']),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password, firstName, lastName, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT 1 FROM public.profiles WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user profile (phone optional, role defaults to 'user')
    const result = await pool.query(
      `INSERT INTO public.profiles (user_id, email, first_name, last_name, phone, password_hash, role)
       VALUES (uuid_generate_v4(), $1, $2, $3, COALESCE($4, ''), $5, COALESCE($6, 'user'))
       RETURNING user_id, email, first_name, last_name, role`,
      [email, firstName, lastName, phone ?? '', hashedPassword, role ?? 'user']
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          userId: user.user_id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        },
        token
      }
    });

  } catch (error: any) {
    console.error('Registration error:', {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      stack: error?.stack
    });
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user
    const result = await pool.query(
      //'SELECT * FROM profiles WHERE email = $1',
      'SELECT * FROM public.profiles WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = result.rows[0] as any; // Type assertion for mock data
    
    // Ensure we have a valid user object with required properties
    if (!user || !user.user_id || !user.email || !user.role || !user.password_hash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user data'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: (user as any).user_id, email: (user as any).email, role: (user as any).role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          userId: user.user_id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        },
        token
      }
    });

  } catch (error: any) {
    console.error('Login error:', {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      stack: error?.stack
    });
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

    const result = await pool.query(
      'SELECT user_id, email, first_name, last_name, role, created_at FROM public.profiles WHERE user_id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = result.rows[0] as any;

    return res.json({
      success: true,
      data: {
        user: {
          userId: user.user_id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          createdAt: user.created_at
        }
      }
    });

  } catch (error: any) {
    console.error('Get user error:', {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      stack: error?.stack
    });
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

export default router; 