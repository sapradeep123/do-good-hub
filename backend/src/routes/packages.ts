/// <reference path="../types/express/index.d.ts" />
import express from 'express';
import pool from '../database/connection';
import { requireRole } from '../middleware/auth';

const router = express.Router();

// Get all packages with assignments
router.get('/', requireRole(['admin', 'ngo', 'vendor']), async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let query = `
      SELECT 
        p.*,
        array_agg(DISTINCT pa.ngo_id) FILTER (WHERE pa.ngo_id IS NOT NULL) as assigned_ngos,
        array_agg(DISTINCT pa.vendor_id) FILTER (WHERE pa.vendor_id IS NOT NULL) as assigned_vendors,
        array_agg(DISTINCT n.name) FILTER (WHERE n.name IS NOT NULL) as ngo_names,
        array_agg(DISTINCT v.company_name) FILTER (WHERE v.company_name IS NOT NULL) as vendor_names
      FROM packages p
      LEFT JOIN package_assignments pa ON p.id = pa.package_id AND pa.is_active = true
      LEFT JOIN ngos n ON pa.ngo_id = n.id
      LEFT JOIN vendors v ON pa.vendor_id = v.id
    `;

    // Role-based filtering
    if (userRole === 'ngo') {
      query += ` WHERE EXISTS (
        SELECT 1 FROM ngos n2 WHERE n2.user_id = $1 AND n2.id = p.ngo_id
      )`;
    } else if (userRole === 'vendor') {
      query += ` WHERE EXISTS (
        SELECT 1 FROM vendors v2 WHERE v2.user_id = $1 AND v2.id = pa.vendor_id
      )`;
    }

    query += ` GROUP BY p.id ORDER BY p.created_at DESC`;

    const params = userRole === 'admin' ? [] : [userId];
    const result = await pool.query(query, params);
    
    return res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Error fetching packages:', error);
    return res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// Create new package
router.post('/', requireRole(['admin']), async (req, res) => {
  try {
    const { title, description, amount, category, is_active, ngo_id } = req.body;

    // Validate required fields
    if (!title || !amount || !category || !ngo_id) {
      return res.status(400).json({
        success: false,
        message: 'Title, amount, category, and NGO ID are required'
      });
    }

    // Check if NGO exists
    const ngoCheck = await pool.query('SELECT id FROM ngos WHERE id = $1', [ngo_id]);
    if (ngoCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'NGO not found'
      });
    }

    // Create package
    const result = await pool.query(`
      INSERT INTO packages (title, description, amount, category, status, ngo_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [title, description, amount, category, is_active ? 'active' : 'inactive', ngo_id]);

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Package created successfully'
    });
  } catch (error: any) {
    console.error('Error creating package:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create package',
      error: error.message
    });
  }
});

// Update package
router.put('/:id', requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, amount, category, is_active, ngo_id } = req.body;

    // Validate required fields
    if (!title || !amount || !category || !ngo_id) {
      return res.status(400).json({
        success: false,
        message: 'Title, amount, category, and NGO ID are required'
      });
    }

    // Check if package exists
    const packageCheck = await pool.query('SELECT id FROM packages WHERE id = $1', [id]);
    if (packageCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    // Check if NGO exists
    const ngoCheck = await pool.query('SELECT id FROM ngos WHERE id = $1', [ngo_id]);
    if (ngoCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'NGO not found'
      });
    }

    // Update package
    const result = await pool.query(`
      UPDATE packages 
      SET title = $1, description = $2, amount = $3, category = $4, status = $5, ngo_id = $6
      WHERE id = $7
      RETURNING *
    `, [title, description, amount, category, is_active ? 'active' : 'inactive', ngo_id, id]);

    return res.json({
      success: true,
      data: result.rows[0],
      message: 'Package updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating package:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update package',
      error: error.message
    });
  }
});

// Get package by ID with detailed assignments
router.get('/:id', requireRole(['admin', 'ngo', 'vendor']), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Get package with basic info
    let packageQuery = `
      SELECT p.*, n.name as ngo_name 
      FROM packages p 
      LEFT JOIN ngos n ON p.ngo_id = n.id 
      WHERE p.id = $1
    `;
    
    const packageResult = await pool.query(packageQuery, [id]);
    if (packageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const pkg = packageResult.rows[0];

    // Role-based access check
    if (userRole === 'ngo') {
      const ngoCheck = await pool.query(
        'SELECT 1 FROM ngos WHERE user_id = $1 AND id = $2',
        [userId, pkg.ngo_id]
      );
      if (ngoCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Get package assignments with vendor mappings
    const assignmentsQuery = `
      SELECT 
        pa.id as assignment_id,
        pa.ngo_id,
        pa.vendor_id,
        n.name as ngo_name,
        v.company_name as vendor_name,
        array_agg(vpa.vendor_id) FILTER (WHERE vpa.vendor_id IS NOT NULL) as vendor_package_vendors
      FROM package_assignments pa
      LEFT JOIN ngos n ON pa.ngo_id = n.id
      LEFT JOIN vendors v ON pa.vendor_id = v.id
      LEFT JOIN vendor_package_assignments vpa ON pa.id = vpa.package_assignment_id
      WHERE pa.package_id = $1 AND pa.is_active = true
      GROUP BY pa.id, pa.ngo_id, pa.vendor_id, n.name, v.company_name
    `;

    const assignmentsResult = await pool.query(assignmentsQuery, [id]);

    // Filter assignments based on role
    let filteredAssignments = assignmentsResult.rows;
    if (userRole === 'vendor') {
      filteredAssignments = assignmentsResult.rows.filter(assignment => 
        assignment.vendor_package_vendors?.includes(userId)
      );
    }

    const response = {
      ...pkg,
      assignments: filteredAssignments
    };

    return res.json({ success: true, data: response });
  } catch (error: any) {
    console.error('Error fetching package:', error);
    return res.status(500).json({ error: 'Failed to fetch package' });
  }
});

// Assign NGO to package
router.post('/:id/assign-ngo', requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { ngoId } = req.body;

    // Check if assignment already exists
    const existingCheck = await pool.query(
      'SELECT 1 FROM package_assignments WHERE package_id = $1 AND ngo_id = $2 AND is_active = true',
      [id, ngoId]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ error: 'NGO already assigned to this package' });
    }

    // Create new assignment
    const result = await pool.query(
      'INSERT INTO package_assignments (package_id, ngo_id, is_active) VALUES ($1, $2, true) RETURNING *',
      [id, ngoId]
    );

    return res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Error assigning NGO:', error);
    return res.status(500).json({ error: 'Failed to assign NGO' });
  }
});

// Unassign NGO from package
router.delete('/:id/unassign-ngo/:ngoId', requireRole(['admin']), async (req, res) => {
  try {
    const { id, ngoId } = req.params;

    // Get assignment IDs to cascade delete vendor assignments
    const assignments = await pool.query(
      'SELECT id FROM package_assignments WHERE package_id = $1 AND ngo_id = $2 AND is_active = true',
      [id, ngoId]
    );

    // Delete vendor assignments first
    for (const assignment of assignments.rows) {
      await pool.query(
        'DELETE FROM vendor_package_assignments WHERE package_assignment_id = $1',
        [assignment.id]
      );
    }

    // Delete NGO assignment
    await pool.query(
      'DELETE FROM package_assignments WHERE package_id = $1 AND ngo_id = $2',
      [id, ngoId]
    );

    return res.json({ success: true, message: 'NGO unassigned successfully' });
  } catch (error: any) {
    console.error('Error unassigning NGO:', error);
    return res.status(500).json({ error: 'Failed to unassign NGO' });
  }
});

// Assign vendor to specific (NGO,Package) combination
router.post('/:id/assign-vendor', requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { ngoId, vendorId } = req.body;

    // Get the package assignment for this NGO
    const assignmentResult = await pool.query(
      'SELECT id FROM package_assignments WHERE package_id = $1 AND ngo_id = $2 AND is_active = true',
      [id, ngoId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'NGO not assigned to this package' });
    }

    const packageAssignmentId = assignmentResult.rows[0].id;

    // Check if vendor assignment already exists
    const existingCheck = await pool.query(
      'SELECT 1 FROM vendor_package_assignments WHERE vendor_id = $1 AND package_assignment_id = $2',
      [vendorId, packageAssignmentId]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Vendor already assigned to this NGO-Package combination' });
    }

    // Create vendor assignment
    const result = await pool.query(
      'INSERT INTO vendor_package_assignments (vendor_id, package_assignment_id) VALUES ($1, $2) RETURNING *',
      [vendorId, packageAssignmentId]
    );

    return res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Error assigning vendor:', error);
    return res.status(500).json({ error: 'Failed to assign vendor' });
  }
});

// Unassign vendor from specific (NGO,Package) combination
router.delete('/:id/unassign-vendor', requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { ngoId, vendorId } = req.body;

    // Get the package assignment for this NGO
    const assignmentResult = await pool.query(
      'SELECT id FROM package_assignments WHERE package_id = $1 AND ngo_id = $2 AND is_active = true',
      [id, ngoId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'NGO not assigned to this package' });
    }

    const packageAssignmentId = assignmentResult.rows[0].id;

    // Delete vendor assignment
    await pool.query(
      'DELETE FROM vendor_package_assignments WHERE vendor_id = $1 AND package_assignment_id = $2',
      [vendorId, packageAssignmentId]
    );

    return res.json({ success: true, message: 'Vendor unassigned successfully' });
  } catch (error: any) {
    console.error('Error unassigning vendor:', error);
    return res.status(500).json({ error: 'Failed to unassign vendor' });
  }
});

// Copy package with optional vendor assignments
router.post('/:id/copy', requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { includeVendors = false } = req.body;

    // Get original package
    const packageResult = await pool.query('SELECT * FROM packages WHERE id = $1', [id]);
    if (packageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const originalPkg = packageResult.rows[0];

    // Create new package
    const newPackageResult = await pool.query(
      `INSERT INTO packages (title, description, amount, category, status, ngo_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        `${originalPkg.title} (Copy)`,
        originalPkg.description,
        originalPkg.amount,
        originalPkg.category,
        originalPkg.is_active,
        originalPkg.ngo_id
      ]
    );

    const newPkg = newPackageResult.rows[0];

    // Copy NGO assignments
    const assignmentsResult = await pool.query(
      'SELECT * FROM package_assignments WHERE package_id = $1 AND is_active = true',
      [id]
    );

    for (const assignment of assignmentsResult.rows) {
      // Create new NGO assignment
      const newAssignmentResult = await pool.query(
        'INSERT INTO package_assignments (package_id, ngo_id, is_active) VALUES ($1, $2, true) RETURNING *',
        [newPkg.id, assignment.ngo_id]
      );

      // Copy vendor assignments if requested
      if (includeVendors) {
        const vendorAssignmentsResult = await pool.query(
          'SELECT * FROM vendor_package_assignments WHERE package_assignment_id = $1',
          [assignment.id]
        );

        for (const vendorAssignment of vendorAssignmentsResult.rows) {
          await pool.query(
            'INSERT INTO vendor_package_assignments (vendor_id, package_assignment_id) VALUES ($1, $2)',
            [vendorAssignment.vendor_id, newAssignmentResult.rows[0].id]
          );
        }
      }
    }

    // Return the new package with assignments
    const newPackageWithAssignments = await pool.query(
      `SELECT 
        p.*,
        array_agg(DISTINCT pa.ngo_id) FILTER (WHERE pa.ngo_id IS NOT NULL) as assigned_ngos,
        array_agg(DISTINCT pa.vendor_id) FILTER (WHERE pa.vendor_id IS NOT NULL) as assigned_vendors,
        array_agg(DISTINCT n.name) FILTER (WHERE n.name IS NOT NULL) as ngo_names,
        array_agg(DISTINCT v.company_name) FILTER (WHERE v.company_name IS NOT NULL) as vendor_names
      FROM packages p
      LEFT JOIN package_assignments pa ON p.id = pa.package_id AND pa.is_active = true
      LEFT JOIN ngos n ON pa.ngo_id = n.id
      LEFT JOIN vendors v ON pa.vendor_id = v.id
      WHERE p.id = $1
      GROUP BY p.id`,
      [newPkg.id]
    );

    return res.json({ success: true, data: newPackageWithAssignments.rows[0] });
  } catch (error: any) {
    console.error('Error copying package:', error);
    return res.status(500).json({ error: 'Failed to copy package' });
  }
});

export default router; 