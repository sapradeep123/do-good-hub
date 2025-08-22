import express, { Request, Response } from 'express';
import pool from '../database/connection';
import { requireRole, attachUser } from '../middleware/auth';

const router = express.Router();

// Get current user's profile
router.get('/me', attachUser, requireRole(['user','admin','ngo','vendor']), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const result = await pool.query(
      `SELECT id, user_id, email, first_name, last_name, phone, role, aadhar_number, pan_number, created_at
       FROM public.profiles WHERE user_id = $1`,
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Error getting current profile:', error);
    return res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
});

// Update current user's profile (name/phone, aadhar, pan). Email is immutable.
router.put('/me', attachUser, requireRole(['user','admin','ngo','vendor']), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { first_name, last_name, phone, aadhar_number, pan_number } = req.body;
    const result = await pool.query(
      `UPDATE public.profiles
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           aadhar_number = COALESCE($4, aadhar_number),
           pan_number = COALESCE($5, pan_number)
       WHERE user_id = $6
       RETURNING id, user_id, email, first_name, last_name, phone, role, aadhar_number, pan_number, created_at`,
      [first_name, last_name, phone, aadhar_number, pan_number, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    return res.json({ success: true, data: result.rows[0], message: 'Profile updated' });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// Change password for current user
router.post('/me/change-password', attachUser, requireRole(['user','admin','ngo','vendor']), async (req: Request, res: Response) => {
  try {
    const bcrypt = require('bcryptjs');
    const userId = req.user?.userId || req.user?.id;
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
    }
    const userRes = await pool.query('SELECT password_hash FROM public.profiles WHERE user_id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const ok = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash || '');
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE public.profiles SET password_hash = $1 WHERE user_id = $2', [hashed, userId]);
    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Error changing password:', error);
    return res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});
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
    await pool.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash text;`);

    // Generate a cryptographically secure reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    const result = await pool.query(
      `UPDATE public.profiles 
       SET password_reset_token = $1, password_reset_expires = NOW() + INTERVAL '1 hour'
       WHERE id = $2
       RETURNING id, email, user_id`,
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
        email: result.rows[0].email,
        userId: result.rows[0].user_id
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
      `SELECT id, email, user_id FROM public.profiles 
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
       WHERE id = $2 RETURNING id, email, user_id`,
      [hashedPassword, id]
    );
    if (update.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log(`Password reset successful for user ${update.rows[0].email} (ID: ${update.rows[0].id})`);

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