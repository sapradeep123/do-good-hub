import express, { Request, Response } from 'express';
import pool from '../database/connection';
import { attachUser, requireRole } from '../middleware/auth';

const router = express.Router();

// List my donations (user)
router.get('/me', attachUser, requireRole(['user']), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const result = await pool.query(
      `SELECT d.*, p.title AS package_name, n.name AS ngo_name
       FROM donations d
       LEFT JOIN packages p ON d.package_id = p.id
       LEFT JOIN ngos n ON d.ngo_id = n.id
       WHERE d.user_id = $1
       ORDER BY d.created_at DESC`,
      [userId]
    );
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching my donations:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch donations' });
  }
});

// Admin: list all donations
router.get('/', attachUser, requireRole(['admin']), async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT d.*, p.title AS package_name, n.name AS ngo_name, pr.email AS donor_email
       FROM donations d
       LEFT JOIN packages p ON d.package_id = p.id
       LEFT JOIN ngos n ON d.ngo_id = n.id
       LEFT JOIN profiles pr ON d.user_id = pr.user_id
       ORDER BY d.created_at DESC`
    );
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching donations:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch donations' });
  }
});

export default router;