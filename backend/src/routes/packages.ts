/// <reference path="../types/express/index.d.ts" />
import express, { Request, Response } from 'express';
import pool from '../database/connection';
import { requireRole, attachUser } from '../middleware/auth';

const router = express.Router();

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

// Get all packages
router.get('/', requireRole(['admin', 'ngo', 'vendor']), async (req: Request, res: Response) => {
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

// Assign package to NGO (admin only)
router.post('/:id/assign-ngo', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ngo_id } = req.body;
    if (!ngo_id) {
      return res.status(400).json({ success: false, message: 'NGO ID is required' });
    }
    // Ensure package and NGO exist
    const pkg = await pool.query('SELECT id FROM packages WHERE id = $1', [id]);
    if (pkg.rows.length === 0) return res.status(404).json({ success: false, message: 'Package not found' });
    const ngo = await pool.query('SELECT id FROM ngos WHERE id = $1', [ngo_id]);
    if (ngo.rows.length === 0) return res.status(404).json({ success: false, message: 'NGO not found' });
    // Ensure extension and table exist (defensive)
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS package_assignments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
        ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
        is_active BOOLEAN NOT NULL DEFAULT true,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','delivered','cancelled','completed')),
        delivery_date DATE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        UNIQUE(package_id, ngo_id)
      );
    `);

    // Create or re-activate assignment
    await pool.query(`
      INSERT INTO package_assignments (package_id, ngo_id, is_active, created_at)
      VALUES ($1, $2, true, NOW())
      ON CONFLICT (package_id, ngo_id) DO UPDATE SET is_active = true, updated_at = NOW()
    `, [id, ngo_id]);
    return res.json({ success: true, message: 'Package assigned to NGO' });
  } catch (error) {
    console.error('Error assigning package to NGO:', error);
    return res.status(500).json({ success: false, message: 'Failed to assign package to NGO' });
  }
});

// Assign vendor to a specific (package, NGO) combination (admin only)
router.post('/:id/assign-vendor', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // package_id
    const { ngo_id, vendor_id } = req.body;
    if (!ngo_id || !vendor_id) {
      return res.status(400).json({ success: false, message: 'NGO ID and Vendor ID are required' });
    }
    // Verify entities
    const pkg = await pool.query('SELECT id FROM packages WHERE id = $1', [id]);
    if (pkg.rows.length === 0) return res.status(404).json({ success: false, message: 'Package not found' });
    const ngo = await pool.query('SELECT id FROM ngos WHERE id = $1', [ngo_id]);
    if (ngo.rows.length === 0) return res.status(404).json({ success: false, message: 'NGO not found' });
    const vendor = await pool.query('SELECT id FROM vendors WHERE id = $1', [vendor_id]);
    if (vendor.rows.length === 0) return res.status(404).json({ success: false, message: 'Vendor not found' });
    // Ensure extension and tables exist (defensive)
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS package_assignments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
        ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
        is_active BOOLEAN NOT NULL DEFAULT true,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','delivered','cancelled','completed')),
        delivery_date DATE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        UNIQUE(package_id, ngo_id)
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vendor_package_assignments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
        package_assignment_id UUID NOT NULL REFERENCES package_assignments(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        UNIQUE(vendor_id, package_assignment_id)
      );
    `);

    // Ensure assignment exists
    const pa = await pool.query('SELECT id FROM package_assignments WHERE package_id = $1 AND ngo_id = $2', [id, ngo_id]);
    let packageAssignmentId = pa.rows[0]?.id;
    if (!packageAssignmentId) {
      const created = await pool.query(`
        INSERT INTO package_assignments (package_id, ngo_id, is_active, created_at)
        VALUES ($1, $2, true, NOW()) RETURNING id
      `, [id, ngo_id]);
      packageAssignmentId = created.rows[0].id;
    }
    // Link vendor to package_assignment
    await pool.query(`
      INSERT INTO vendor_package_assignments (vendor_id, package_assignment_id, created_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (vendor_id, package_assignment_id) DO UPDATE SET updated_at = NOW()
    `, [vendor_id, packageAssignmentId]);
    return res.json({ success: true, message: 'Vendor assigned for NGO-package' });
  } catch (error) {
    console.error('Error assigning vendor to NGO-package:', error);
    return res.status(500).json({ success: false, message: 'Failed to assign vendor' });
  }
});

// Unified assign endpoint: assign NGO (required) and optionally Vendor in one step
router.post('/:id/assign', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // package_id
    const { ngo_id, vendor_id } = req.body as { ngo_id?: string; vendor_id?: string };
    if (!ngo_id) return res.status(400).json({ success: false, message: 'NGO ID is required' });
    if (!vendor_id) return res.status(400).json({ success: false, message: 'Vendor ID is required' });

    // Validate entities
    const pkg = await pool.query('SELECT id FROM packages WHERE id = $1', [id]);
    if (pkg.rows.length === 0) return res.status(404).json({ success: false, message: 'Package not found' });
    const ngo = await pool.query('SELECT id FROM ngos WHERE id = $1', [ngo_id]);
    if (ngo.rows.length === 0) return res.status(404).json({ success: false, message: 'NGO not found' });
    const vendorCheck = await pool.query('SELECT id FROM vendors WHERE id = $1', [vendor_id]);
    if (vendorCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'Vendor not found' });

    // Ensure tables exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS package_assignments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
        ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
        is_active BOOLEAN NOT NULL DEFAULT true,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','delivered','cancelled','completed')),
        delivery_date DATE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        UNIQUE(package_id, ngo_id)
      );
    `);

    let packageAssignmentId: string | undefined;
    const pa = await pool.query('SELECT id FROM package_assignments WHERE package_id = $1 AND ngo_id = $2', [id, ngo_id]);
    if (pa.rows.length > 0) {
      packageAssignmentId = pa.rows[0].id;
    } else {
      const created = await pool.query(`
        INSERT INTO package_assignments (package_id, ngo_id, is_active, created_at)
        VALUES ($1, $2, true, NOW()) RETURNING id
      `, [id, ngo_id]);
      packageAssignmentId = created.rows[0].id;
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS vendor_package_assignments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
        package_assignment_id UUID NOT NULL REFERENCES package_assignments(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        UNIQUE(vendor_id, package_assignment_id)
      );
    `);

    await pool.query(`
      INSERT INTO vendor_package_assignments (vendor_id, package_assignment_id, created_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (vendor_id, package_assignment_id) DO UPDATE SET updated_at = NOW()
    `, [vendor_id, packageAssignmentId]);

    return res.json({ success: true, message: 'Assigned NGO and Vendor', data: { packageAssignmentId, vendorLinked: true } });
  } catch (error: any) {
    console.error('Error in unified assign endpoint:', error?.message || error);
    return res.status(500).json({ success: false, message: 'Failed to assign', error: error?.message });
  }
});
// Options for assign dialogs: distinct NGO and Vendor lists for clean UX
router.get('/options/ngos', requireRole(['admin']), async (_req: Request, res: Response) => {
  try {
    const r = await pool.query(`
      SELECT DISTINCT ON (LOWER(name)) id, name
      FROM ngos
      ORDER BY LOWER(name), created_at DESC
    `);
    return res.json({ success: true, data: r.rows });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to load NGO options' });
  }
});

router.get('/options/vendors', requireRole(['admin']), async (_req: Request, res: Response) => {
  try {
    const r = await pool.query(`
      SELECT DISTINCT ON (LOWER(company_name)) id, company_name
      FROM vendors
      ORDER BY LOWER(company_name), created_at DESC
    `);
    return res.json({ success: true, data: r.rows });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to load Vendor options' });
  }
});

// Filtered lists to avoid already-assigned entries
router.get('/:id/available-ngos', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // package_id
    const r = await pool.query(`
      SELECT DISTINCT ON (LOWER(n.name)) n.id, n.name
      FROM ngos n
      WHERE NOT EXISTS (
        SELECT 1 FROM package_assignments pa
        WHERE pa.package_id = $1 AND pa.ngo_id = n.id AND pa.is_active = true
      )
      ORDER BY LOWER(n.name), n.created_at DESC
    `, [id]);
    return res.json({ success: true, data: r.rows });
  } catch (e) {
    console.error('Error loading available NGOs:', e);
    return res.status(500).json({ success: false, message: 'Failed to load available NGOs' });
  }
});

router.get('/:id/available-vendors', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // package_id
    const { ngo_id } = req.query as { ngo_id?: string };
    if (!ngo_id) return res.status(400).json({ success: false, message: 'ngo_id is required' });
    const r = await pool.query(`
      SELECT DISTINCT ON (LOWER(v.company_name)) v.id, v.company_name
      FROM vendors v
      WHERE NOT EXISTS (
        SELECT 1
        FROM vendor_package_assignments vpa
        JOIN package_assignments pa ON vpa.package_assignment_id = pa.id
        WHERE pa.package_id = $1 AND pa.ngo_id = $2 AND vpa.vendor_id = v.id
      )
      ORDER BY LOWER(v.company_name), v.created_at DESC
    `, [id, ngo_id]);
    return res.json({ success: true, data: r.rows });
  } catch (e) {
    console.error('Error loading available Vendors:', e);
    return res.status(500).json({ success: false, message: 'Failed to load available Vendors' });
  }
});

// Get package by ID
router.get('/:id', requireRole(['admin', 'ngo', 'vendor']), async (req: Request, res: Response) => {
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