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
      'SELECT * FROM public.profiles WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log(`Login failed: User not found for email ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = result.rows[0] as any;
    
    // Debug logging
    console.log(`Login attempt for ${email}:`, {
      hasUserId: !!user.user_id,
      hasEmail: !!user.email,
      hasRole: !!user.role,
      hasPasswordHash: !!user.password_hash,
      passwordHashLength: user.password_hash ? user.password_hash.length : 0
    });
    
    // Ensure we have a valid user object with required properties
    if (!user || !user.user_id || !user.email || !user.role) {
      console.log(`Login failed: Invalid user object for ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.password_hash) {
      console.log(`Login failed: No password hash for ${email}`);
      return res.status(401).json({ success: false, message: 'Password not set. Please ask admin to set/reset password.' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      console.log(`Login failed: Invalid password for ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log(`Login successful for ${email} (role: ${user.role})`);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
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

// Password reset by email (non-admin): request token
router.post('/request-password-reset', [
  body('email').isEmail().normalizeEmail(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email } = req.body;
    const profile = await pool.query('SELECT id FROM public.profiles WHERE email = $1', [email]);
    if (profile.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Ensure columns exist
    await pool.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_reset_token text;`);
    await pool.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_reset_expires timestamptz;`);

    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    await pool.query(
      `UPDATE public.profiles SET password_reset_token = $1, password_reset_expires = NOW() + INTERVAL '1 hour' WHERE email = $2`,
      [resetToken, email]
    );

    // In development, return the token directly
    return res.json({ success: true, message: 'Reset token generated', data: { token: resetToken } });
  } catch (error: any) {
    console.error('Request password reset error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate reset token' });
  }
});

// Confirm password reset (public endpoint)
router.post('/confirm-password-reset', async (req: Request, res: Response) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, token, and new password are required'
      });
    }

    // Verify the reset token and check if it's still valid
    const result = await pool.query(
      `SELECT id, email FROM public.profiles 
       WHERE email = $1 
         AND password_reset_token = $2 
         AND (password_reset_expires IS NULL OR (password_reset_expires::timestamptz) > NOW())`,
      [email, token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash the new password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password and clear the reset token
    const update = await pool.query(
      `UPDATE public.profiles 
       SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL
       WHERE email = $2 RETURNING id`,
      [hashedPassword, email]
    );
    
    if (update.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error confirming password reset:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});

// Debug endpoint to check user password status (remove in production)
router.get('/debug-user/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    
    const result = await pool.query(
      'SELECT id, user_id, email, role, password_hash, password_reset_token, password_reset_expires FROM public.profiles WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = result.rows[0];
    return res.json({
      success: true,
      data: {
        id: user.id,
        userId: user.user_id,
        email: user.email,
        role: user.role,
        hasPasswordHash: !!user.password_hash,
        passwordHashLength: user.password_hash ? user.password_hash.length : 0,
        hasResetToken: !!user.password_reset_token,
        resetTokenExpires: user.password_reset_expires
      }
    });
  } catch (error) {
    console.error('Debug user error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});
