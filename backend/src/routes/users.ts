import express, { Request, Response } from 'express';
import pool from '../database/connection';
import { requireRole } from '../middleware/auth';

const router = express.Router();

// Get all users (admin only)
router.get('/', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (LOWER(email))
         id, user_id, email, first_name, last_name, phone, role, created_at
       FROM profiles
       ORDER BY LOWER(email), created_at DESC`
    );

    return res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Update user (admin only)
router.put('/:id', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, phone, role } = req.body;

    const result = await pool.query(
      `UPDATE profiles 
       SET email = $1, first_name = $2, last_name = $3, phone = $4, role = $5
       WHERE id = $6
       RETURNING id, user_id, email, first_name, last_name, phone, role, created_at`,
      [email, firstName, lastName, phone, role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// Reset user password (admin only)
router.post('/:id/reset-password', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Safety: ensure columns exist even if server bootstrap didn't run it
    await pool.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_reset_token text;`);
    await pool.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_reset_expires timestamptz;`);

    // Generate a random reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const result = await pool.query(
      `UPDATE public.profiles 
       SET password_reset_token = $1, password_reset_expires = NOW() + INTERVAL '1 hour'
       WHERE id = $2
       RETURNING id, email`,
      [resetToken, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      message: 'Password reset token generated',
      data: {
        token: resetToken,
        email: result.rows[0].email
      }
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});

// Confirm password reset (admin only)
router.post('/:id/confirm-reset', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    // Verify the reset token and check if it's still valid
    const result = await pool.query(
      `SELECT id, email FROM public.profiles 
       WHERE id = $1 
         AND password_reset_token = $2 
         AND (password_reset_expires IS NULL OR (password_reset_expires::timestamptz) > NOW())`,
      [id, token]
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
       WHERE id = $2 RETURNING id`,
      [hashedPassword, id]
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

export default router; 