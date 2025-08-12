/// <reference path="../types/express/index.d.ts" />
import express, { Request, Response } from 'express';
import pool from '../database/connection';
import { requireRole, attachUser } from '../middleware/auth';

const router = express.Router();

// Get all packages
// Allow 'user' to read packages so donors can browse available options
router.get('/', requireRole(['admin', 'ngo', 'vendor', 'user']), async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM packages ORDER BY created_at DESC'
    );

    return res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch packages'
    });
  }
});

// Get package by ID
router.get('/:id', requireRole(['admin', 'ngo', 'vendor', 'user']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM packages WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    return res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching package:', error);
    return res.status(500).json({
        success: false,
      message: 'Failed to fetch package'
    });
  }
});

// Get package assignments with NGO and Vendor details (for View option)
router.get('/:id/assignments', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // package_id
    
    const result = await pool.query(`
      SELECT 
        pa.id as assignment_id,
        pa.package_id,
        pa.ngo_id,
        pa.vendor_id,
        pa.is_active,
        pa.status,
        pa.delivery_date,
        pa.notes,
        pa.created_at,
        pa.updated_at,
        n.name as ngo_name,
        v.company_name as vendor_name
      FROM package_assignments pa
      LEFT JOIN ngos n ON pa.ngo_id = n.id
      LEFT JOIN vendors v ON pa.vendor_id = v.id
      WHERE pa.package_id = $1
      ORDER BY pa.created_at DESC
    `, [id]);

    return res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching package assignments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch package assignments'
    });
  }
});

// Unified assign endpoint: assign NGO and Vendor in one step
router.post('/:id/assign', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // package_id
    const { ngo_id, vendor_id } = req.body as { ngo_id?: string; vendor_id?: string };

    if (!ngo_id || !vendor_id) {
      return res.status(400).json({
        success: false,
        message: 'Both NGO ID and Vendor ID are required' 
      });
    }

    // Validate entities exist
    const pkg = await pool.query('SELECT id FROM packages WHERE id = $1', [id]);
    if (pkg.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    
    const ngo = await pool.query('SELECT id FROM ngos WHERE id = $1', [ngo_id]);
    if (ngo.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'NGO not found' });
    }
    
    const vendor = await pool.query('SELECT id FROM vendors WHERE id = $1', [vendor_id]);
    if (vendor.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Check if assignment already exists
    const existing = await pool.query(
      'SELECT id FROM package_assignments WHERE package_id = $1 AND ngo_id = $2',
      [id, ngo_id]
    );

    if (existing.rows.length > 0) {
      // Update existing assignment with vendor
      await pool.query(`
        UPDATE package_assignments 
        SET vendor_id = $1, updated_at = NOW()
        WHERE package_id = $2 AND ngo_id = $3
      `, [vendor_id, id, ngo_id]);
      
      return res.json({ 
        success: true, 
        message: 'Vendor updated for existing NGO assignment',
        data: { assignment_id: existing.rows[0].id }
      });
    } else {
      // Create new assignment
    const result = await pool.query(`
        INSERT INTO package_assignments (package_id, ngo_id, vendor_id, is_active, status, created_at)
        VALUES ($1, $2, $3, true, 'pending', NOW())
        RETURNING id
      `, [id, ngo_id, vendor_id]);

    return res.json({
      success: true,
        message: 'NGO and Vendor assigned successfully',
        data: { assignment_id: result.rows[0].id }
    });
    }
  } catch (error: any) {
    console.error('Error in unified assign endpoint:', error?.message || error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign NGO and Vendor',
      error: error?.message 
    });
  }
});

// Update assignment (Edit functionality)
router.put('/assignments/:assignment_id', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { assignment_id } = req.params;
    const { ngo_id, vendor_id, status, delivery_date, notes } = req.body;
    
    // Validate assignment exists
    const existing = await pool.query(
      'SELECT id FROM package_assignments WHERE id = $1',
      [assignment_id]
    );
    
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Update assignment
    const result = await pool.query(`
      UPDATE package_assignments 
      SET 
        ngo_id = COALESCE($1, ngo_id),
        vendor_id = COALESCE($2, vendor_id),
        status = COALESCE($3, status),
        delivery_date = $4,
        notes = $5,
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [ngo_id, vendor_id, status, delivery_date, notes, assignment_id]);

    return res.json({
      success: true,
      message: 'Assignment updated successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating assignment:', error?.message || error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update assignment',
      error: error?.message
    });
  }
});

// Delete assignment
router.delete('/assignments/:assignment_id', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { assignment_id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM package_assignments WHERE id = $1 RETURNING id',
      [assignment_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    
    return res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting assignment:', error?.message || error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete assignment',
      error: error?.message
    });
  }
});

// Get available NGOs for assignment (excluding already assigned)
router.get('/:id/available-ngos', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // package_id
    
    const result = await pool.query(`
      SELECT DISTINCT ON (n.id) n.id, n.name
      FROM ngos n
      WHERE NOT EXISTS (
        SELECT 1 FROM package_assignments pa
        WHERE pa.package_id = $1 AND pa.ngo_id = n.id
      )
      ORDER BY n.id, n.name
    `, [id]);
    
    return res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error loading available NGOs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load available NGOs'
    });
  }
});

// Get available vendors for assignment (excluding already assigned)
router.get('/:id/available-vendors', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // package_id
    const { ngo_id } = req.query as { ngo_id?: string };

    const params: any[] = ngo_id ? [id, ngo_id] : [id];
    const query = ngo_id
      ? `
        SELECT DISTINCT ON (v.id) v.id, v.company_name
        FROM vendors v
        WHERE NOT EXISTS (
          SELECT 1 FROM package_assignments pa
          WHERE pa.package_id = $1 AND pa.ngo_id = $2 AND pa.vendor_id = v.id
        )
        ORDER BY v.id, v.company_name
      `
      : `
        SELECT DISTINCT ON (v.id) v.id, v.company_name
        FROM vendors v
        WHERE NOT EXISTS (
          SELECT 1 FROM package_assignments pa
          WHERE pa.package_id = $1 AND pa.vendor_id = v.id
        )
        ORDER BY v.id, v.company_name
      `;

    const result = await pool.query(query, params);

    return res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error loading available vendors:', error);
    return res.status(500).json({ success: false, message: 'Failed to load available vendors' });
  }
});

// Update package delivery date (NGO and Admin only)
router.put('/:id/delivery-date', attachUser, requireRole(['ngo', 'admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { delivery_date, reason } = req.body;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Verify the package exists and get its assignment
    const packageResult = await pool.query(
      `SELECT p.*, pa.ngo_id, pa.id as assignment_id
      FROM packages p
       JOIN package_assignments pa ON p.id = pa.package_id
       WHERE p.id = $1`,
      [id]
    );

    if (packageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    const packageData = packageResult.rows[0];

    // If NGO user, verify they own this package
    if (userRole === 'ngo') {
      const ngoCheck = await pool.query(
        'SELECT id FROM ngos WHERE user_id = $1 AND id = $2',
        [userId, packageData.ngo_id]
      );

      if (ngoCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Update the delivery date in package_assignments
    const result = await pool.query(
      `UPDATE package_assignments 
       SET delivery_date = $1, notes = CASE WHEN $2 IS NOT NULL THEN COALESCE(notes, '') || ' ' || $2 ELSE notes END
       WHERE package_id = $3
       RETURNING *`,
      [delivery_date, reason, id]
    );

    return res.json({
      success: true,
      data: result.rows[0],
      message: 'Delivery date updated successfully'
    });
  } catch (error) {
    console.error('Error updating delivery date:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update delivery date'
    });
  }
});

// Create package (admin only)
router.post('/', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { title, description, amount, category, ngo_id } = req.body;

    if (!title || !amount || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, amount, and category are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO packages (title, description, amount, category, ngo_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description, amount, category, ngo_id]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating package:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create package'
    });
  }
});

// Update package (admin only)
router.put('/:id', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, amount, category, ngo_id } = req.body;

    const result = await pool.query(
      `UPDATE packages 
       SET title = $1, description = $2, amount = $3, category = $4, ngo_id = $5
       WHERE id = $6
       RETURNING *`,
      [title, description, amount, category, ngo_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    return res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating package:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update package'
    });
  }
});

// Delete package (admin only)
router.delete('/:id', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM packages WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    return res.json({ success: true, message: 'Package deleted' });
  } catch (error) {
    console.error('Error deleting package:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete package' });
  }
});

export default router; 