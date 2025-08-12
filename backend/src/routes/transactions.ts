import express, { Request, Response } from 'express';
import pool from '../database/connection';
import { attachUser, requireRole } from '../middleware/auth';

const router = express.Router();

// Get transactions: role-aware
// - admin: all
// - user: own
// - ngo: for their NGO
// - vendor: assigned to them
router.get('/', attachUser, requireRole(['admin', 'user', 'ngo', 'vendor']), async (req: Request, res: Response) => {
  try {
    const role = (req as any).user.role as 'admin' | 'user' | 'ngo' | 'vendor';
    const userId = (req as any).user.userId as string;

    let query = `
      SELECT t.*, d.package_title, d.total_amount, p.title AS package_name, n.name AS ngo_name, v.company_name AS vendor_name
      FROM transactions t
      LEFT JOIN donations d ON t.donation_id = d.id
      LEFT JOIN packages p ON t.package_id = p.id
      LEFT JOIN ngos n ON t.ngo_id = n.id
      LEFT JOIN vendors v ON t.vendor_id = v.id
    `;
    const params: any[] = [];

    if (role === 'admin') {
      query += ' ORDER BY t.created_at DESC';
    } else if (role === 'user') {
      query += ' WHERE t.donor_user_id = $1 ORDER BY t.created_at DESC';
      params.push(userId);
    } else if (role === 'ngo') {
      // Map user → their NGO id
      const ngoRes = await pool.query('SELECT id FROM ngos WHERE user_id = $1', [userId]);
      if (ngoRes.rows.length === 0) return res.json({ success: true, data: [] });
      query += ' WHERE t.ngo_id = $1 ORDER BY t.created_at DESC';
      params.push(ngoRes.rows[0].id);
    } else if (role === 'vendor') {
      // Map user → vendor id
      const vRes = await pool.query('SELECT id FROM vendors WHERE user_id = $1', [userId]);
      if (vRes.rows.length === 0) return res.json({ success: true, data: [] });
      query += ' WHERE t.vendor_id = $1 ORDER BY t.created_at DESC';
      params.push(vRes.rows[0].id);
    }

    const result = await pool.query(query, params);
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error listing transactions:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
});

// Admin assigns vendor to a transaction (and marks status)
router.post('/:id/assign-vendor', attachUser, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { vendor_id, admin_notes } = req.body as { vendor_id: string; admin_notes?: string };
    if (!vendor_id) return res.status(400).json({ success: false, message: 'vendor_id is required' });

    // Validate vendor
    const v = await pool.query('SELECT id FROM vendors WHERE id = $1', [vendor_id]);
    if (v.rows.length === 0) return res.status(404).json({ success: false, message: 'Vendor not found' });

    const result = await pool.query(
      `UPDATE transactions
       SET vendor_id = $1,
           status = 'assigned_to_vendor',
           assigned_at = NOW(),
           admin_notes = COALESCE($2, admin_notes),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [vendor_id, admin_notes ?? null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Transaction not found' });
    return res.json({ success: true, message: 'Vendor assigned', data: result.rows[0] });
  } catch (error) {
    console.error('Error assigning vendor:', error);
    return res.status(500).json({ success: false, message: 'Failed to assign vendor' });
  }
});

// Vendor updates status to processing/shipped + tracking number
router.post('/:id/ship', attachUser, requireRole(['vendor']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tracking_number, vendor_notes } = req.body as { tracking_number: string; vendor_notes?: string };
    const userId = (req as any).user.userId;

    // Validate ownership
    const vRes = await pool.query('SELECT id FROM vendors WHERE user_id = $1', [userId]);
    if (vRes.rows.length === 0) return res.status(403).json({ success: false, message: 'Access denied' });
    const vendorId = vRes.rows[0].id;

    const result = await pool.query(
      `UPDATE transactions
       SET status = 'shipped',
           tracking_number = $1,
           vendor_notes = COALESCE($2, vendor_notes),
           shipped_at = NOW(),
           updated_at = NOW()
       WHERE id = $3 AND vendor_id = $4
       RETURNING *`,
      [tracking_number, vendor_notes ?? null, id, vendorId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Transaction not found or not assigned to you' });
    return res.json({ success: true, message: 'Marked as shipped', data: result.rows[0] });
  } catch (error) {
    console.error('Error marking shipped:', error);
    return res.status(500).json({ success: false, message: 'Failed to update shipment' });
  }
});

// NGO confirms delivery
router.post('/:id/confirm-delivery', attachUser, requireRole(['ngo']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    // Resolve NGO id
    const ngoRes = await pool.query('SELECT id FROM ngos WHERE user_id = $1', [userId]);
    if (ngoRes.rows.length === 0) return res.status(403).json({ success: false, message: 'Access denied' });
    const ngoId = ngoRes.rows[0].id;

    const result = await pool.query(
      `UPDATE transactions
       SET status = 'delivered', delivered_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND ngo_id = $2
       RETURNING *`,
      [id, ngoId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Transaction not found or access denied' });
    return res.json({ success: true, message: 'Delivery confirmed', data: result.rows[0] });
  } catch (error) {
    console.error('Error confirming delivery:', error);
    return res.status(500).json({ success: false, message: 'Failed to confirm delivery' });
  }
});

// Admin marks completed after reconciliation (optional)
router.post('/:id/complete', attachUser, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body as { admin_notes?: string };
    const result = await pool.query(
      `UPDATE transactions SET status = 'completed', completed_at = NOW(), admin_notes = COALESCE($1, admin_notes), updated_at = NOW() WHERE id = $2 RETURNING *`,
      [admin_notes ?? null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Transaction not found' });
    return res.json({ success: true, message: 'Transaction completed', data: result.rows[0] });
  } catch (error) {
    console.error('Error completing transaction:', error);
    return res.status(500).json({ success: false, message: 'Failed to complete transaction' });
  }
});

// Public tracking by transaction id or tracking number
router.get('/track', async (req: Request, res: Response) => {
  try {
    const { transaction_id, tracking_number } = req.query as { transaction_id?: string; tracking_number?: string };
    if (!transaction_id && !tracking_number) return res.status(400).json({ success: false, message: 'Provide transaction_id or tracking_number' });
    let query = `SELECT t.*, n.name AS ngo_name, v.company_name AS vendor_name, p.title AS package_title FROM transactions t LEFT JOIN ngos n ON t.ngo_id = n.id LEFT JOIN vendors v ON t.vendor_id = v.id LEFT JOIN packages p ON p.id = t.package_id`;
    const params: any[] = [];
    if (transaction_id) { query += ' WHERE t.id = $1'; params.push(transaction_id); }
    else { query += ' WHERE t.tracking_number = $1'; params.push(tracking_number); }
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error tracking:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch status' });
  }
});

export default router;