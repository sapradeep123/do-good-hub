/// <reference path="../types/express/index.d.ts" />
import express, { Request, Response } from 'express';
import pool from '../database/connection';
import { requireRole, attachUser } from '../middleware/auth';

const router = express.Router();

// Get all vendors (admin only)
router.get('/', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (LOWER(company_name)) id, company_name, email, phone, address, description, business_type, verified, created_at
       FROM vendors
       ORDER BY LOWER(company_name), created_at DESC`
    );

    return res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vendors'
    });
  }
});

// Get vendor assignments (vendor only)
router.get('/assignments', attachUser, requireRole(['vendor']), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    // Get vendor ID from user profile
    const vendorResult = await pool.query(
      'SELECT id FROM vendors WHERE user_id = $1',
      [userId]
    );

    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    const vendorId = vendorResult.rows[0].id;

    // Get assignments for this vendor with package and NGO details via vendor_package_assignments
    const result = await pool.query(
      `SELECT 
        vpa.id,
        vpa.vendor_id,
        pa.package_id,
        pa.ngo_id,
        pa.status,
        pa.delivery_date,
        pa.notes,
        p.title as package_title,
        p.amount as package_amount,
        n.name as ngo_name,
        n.phone as ngo_contact,
        n.address as ngo_address
       FROM vendor_package_assignments vpa
       JOIN package_assignments pa ON vpa.package_assignment_id = pa.id
       JOIN packages p ON pa.package_id = p.id
       JOIN ngos n ON pa.ngo_id = n.id
       WHERE vpa.vendor_id = $1
       ORDER BY pa.created_at DESC`,
      [vendorId]
    );
    
    return res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching vendor assignments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments'
    });
  }
});

// Update vendor assignment (vendor only)
router.put('/assignments/:id', attachUser, requireRole(['vendor']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, delivery_date, notes } = req.body;
    const userId = (req as any).user.userId;

    // Verify this assignment belongs to the vendor
    const vendorResult = await pool.query(
      'SELECT id FROM vendors WHERE user_id = $1',
      [userId]
    );
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    const vendorId = vendorResult.rows[0].id;

    const result = await pool.query(
      `UPDATE vendor_assignments 
       SET status = $1, delivery_date = $2, notes = $3, updated_at = NOW()
       WHERE id = $4 AND vendor_id = $5
       RETURNING *`,
      [status, delivery_date, notes, id, vendorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found or access denied'
      });
    }

    return res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating vendor assignment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update assignment'
    });
  }
});

// Get vendor packages (vendor only)
router.get('/packages', attachUser, requireRole(['vendor']), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    // Get vendor ID from user profile
    const vendorResult = await pool.query(
      'SELECT id FROM vendors WHERE user_id = $1',
      [userId]
    );

    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    const vendorId = vendorResult.rows[0].id;

    // Get packages assigned to this vendor through vendor_package_assignments
    const result = await pool.query(
      `SELECT DISTINCT p.*
       FROM vendor_package_assignments vpa
       JOIN package_assignments pa ON vpa.package_assignment_id = pa.id
       JOIN packages p ON pa.package_id = p.id
       WHERE vpa.vendor_id = $1
       ORDER BY p.created_at DESC`,
      [vendorId]
    );
    
    return res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching vendor packages:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch packages'
    });
  }
});

// Get vendor NGOs (vendor only)
router.get('/ngos', attachUser, requireRole(['vendor']), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    // Get vendor ID from user profile
    const vendorResult = await pool.query(
      'SELECT id FROM vendors WHERE user_id = $1',
      [userId]
    );

    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    const vendorId = vendorResult.rows[0].id;

    // Get NGOs that this vendor delivers to via vendor_package_assignments
    const result = await pool.query(
      `SELECT DISTINCT n.*
       FROM vendor_package_assignments vpa
       JOIN package_assignments pa ON vpa.package_assignment_id = pa.id
       JOIN ngos n ON pa.ngo_id = n.id
       WHERE vpa.vendor_id = $1
       ORDER BY n.name`,
      [vendorId]
    );

    return res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching vendor NGOs:', error);
    return res.status(500).json({
        success: false,
      message: 'Failed to fetch NGOs'
    });
  }
});

// Get vendor by ID (admin only) - this must come after the specific routes
router.get('/:id', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM vendors WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    return res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor'
    });
  }
});

// Create vendor (admin only)
router.post('/', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { company_name, email, phone, address, description, business_type, user_id } = req.body;

    if (!company_name || !email) {
      return res.status(400).json({ success: false, message: 'Company name and email are required' });
    }

    const result = await pool.query(
      `INSERT INTO vendors (company_name, email, phone, address, description, business_type, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [company_name, email, phone, address, description, business_type, user_id]
    );

      return res.status(201).json({
        success: true,
      data: result.rows[0]
      });
    } catch (error) {
    console.error('Error creating vendor:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create vendor'
    });
  }
});

// Update vendor (admin only)
router.put('/:id', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { company_name, email, phone, address, description, business_type } = req.body;

    if (!company_name || !email) {
      return res.status(400).json({ success: false, message: 'Company name and email are required' });
    }

    const result = await pool.query(
      `UPDATE vendors 
       SET company_name = $1, email = $2, phone = $3, address = $4, description = $5, business_type = $6
       WHERE id = $7
       RETURNING *`,
      [company_name, email, phone, address, description, business_type, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    return res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating vendor:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update vendor'
    });
  }
});

// Delete vendor (admin only)
router.delete('/:id', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM vendors WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }
    return res.json({ success: true, message: 'Vendor deleted' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete vendor' });
  }
});

// Assign vendor to (package, NGO) combination (Admin only)
router.post('/assign-package', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { packageId, vendorId, ngoId } = req.body;

    if (!packageId || !vendorId || !ngoId) {
      return res.status(400).json({
        success: false,
        message: 'Package ID, NGO ID and Vendor ID are required'
      });
    }

    // Check entities
    const packageResult = await pool.query('SELECT id FROM packages WHERE id = $1', [packageId]);
    if (packageResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Package not found' });
    const vendorResult = await pool.query('SELECT id FROM vendors WHERE id = $1', [vendorId]);
    if (vendorResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Vendor not found' });
    const ngoResult = await pool.query('SELECT id FROM ngos WHERE id = $1', [ngoId]);
    if (ngoResult.rows.length === 0) return res.status(404).json({ success: false, message: 'NGO not found' });

    // Ensure package assignment exists
    const pa = await pool.query('SELECT id FROM package_assignments WHERE package_id = $1 AND ngo_id = $2', [packageId, ngoId]);
    let packageAssignmentId = pa.rows[0]?.id;
    if (!packageAssignmentId) {
      const created = await pool.query(`
        INSERT INTO package_assignments (package_id, ngo_id, is_active, created_at)
        VALUES ($1, $2, true, NOW()) RETURNING id
      `, [packageId, ngoId]);
      packageAssignmentId = created.rows[0].id;
    }

    // Create vendor-package assignment
    await pool.query(`
      INSERT INTO vendor_package_assignments (vendor_id, package_assignment_id, created_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (vendor_id, package_assignment_id) DO UPDATE SET updated_at = NOW()
    `, [vendorId, packageAssignmentId]);

    return res.json({ success: true, message: 'Vendor assigned successfully' });
  } catch (error) {
    console.error('Error assigning vendor:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign vendor'
    });
  }
});

export default router; 