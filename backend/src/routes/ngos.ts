/// <reference path="../types/express/index.d.ts" />
import express from 'express';
import pool from '../database/connection';
import { requireRole } from '../middleware/auth';

const router = express.Router();

// Get all NGOs
router.get('/', requireRole(['admin', 'ngo', 'vendor']), async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let query = `
      SELECT n.*, p.first_name, p.last_name, p.email as user_email
      FROM ngos n
      JOIN profiles p ON n.user_id = p.user_id
    `;

    // Role-based filtering
    if (userRole === 'ngo') {
      query += ` WHERE n.user_id = $1`;
    }
    
    query += ` ORDER BY n.created_at DESC`;

    const params = userRole === 'admin' ? [] : [userId];
    const result = await pool.query(query, params);
    
    return res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching NGOs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch NGOs',
      error: error.message
    });
  }
});

// Get NGO by ID with package assignments and vendors
router.get('/:id', requireRole(['admin', 'ngo', 'vendor']), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Get NGO basic info
    const ngoResult = await pool.query(`
      SELECT n.*, p.first_name, p.last_name, p.email as user_email
      FROM ngos n
      JOIN profiles p ON n.user_id = p.user_id
      WHERE n.id = $1
    `, [id]);
    
    if (ngoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'NGO not found'
      });
    }

    const ngo = ngoResult.rows[0];

    // Role-based access check
    if (userRole === 'ngo' && ngo.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get packages assigned to this NGO with vendor mappings
    const packagesResult = await pool.query(`
      SELECT 
        p.*,
        pa.id as assignment_id,
        array_agg(DISTINCT vpa.vendor_id) FILTER (WHERE vpa.vendor_id IS NOT NULL) as vendor_ids,
        array_agg(DISTINCT v.company_name) FILTER (WHERE v.company_name IS NOT NULL) as vendor_names
      FROM packages p
      JOIN package_assignments pa ON p.id = pa.package_id AND pa.is_active = true
      LEFT JOIN vendor_package_assignments vpa ON pa.id = vpa.package_assignment_id
      LEFT JOIN vendors v ON vpa.vendor_id = v.id
      WHERE pa.ngo_id = $1
      GROUP BY p.id, pa.id
      ORDER BY p.created_at DESC
    `, [id]);

    // Filter packages based on role
    let filteredPackages = packagesResult.rows;
    if (userRole === 'vendor') {
      filteredPackages = packagesResult.rows.filter(pkg => 
        pkg.vendor_ids?.includes(userId)
      );
    }

    const response = {
      ...ngo,
      packages: filteredPackages
    };
    
    return res.json({
      success: true,
      data: response
    });
  } catch (error: any) {
    console.error('Error fetching NGO:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch NGO',
      error: error.message
    });
  }
});

// Get packages for an NGO
router.get('/:id/packages', requireRole(['admin', 'ngo', 'vendor']), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Role-based access check
    if (userRole === 'ngo') {
      const ngoCheck = await pool.query(
        'SELECT 1 FROM ngos WHERE user_id = $1 AND id = $2',
        [userId, id]
      );
      if (ngoCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const result = await pool.query(`
      SELECT 
        p.*,
        pa.id as assignment_id,
        array_agg(DISTINCT vpa.vendor_id) FILTER (WHERE vpa.vendor_id IS NOT NULL) as vendor_ids,
        array_agg(DISTINCT v.company_name) FILTER (WHERE v.company_name IS NOT NULL) as vendor_names
      FROM packages p
      JOIN package_assignments pa ON p.id = pa.package_id AND pa.is_active = true
      LEFT JOIN vendor_package_assignments vpa ON pa.id = vpa.package_assignment_id
      LEFT JOIN vendors v ON vpa.vendor_id = v.id
      WHERE pa.ngo_id = $1
      GROUP BY p.id, pa.id
      ORDER BY p.created_at DESC
    `, [id]);
    
    return res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching NGO packages:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch NGO packages',
      error: error.message
    });
  }
});

// Create new NGO
router.post('/', requireRole(['admin']), async (req, res) => {
  try {
    const { name, email, description, mission, location, category, phone, website_url, registration_number, is_active = true } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    // Check if NGO with same email already exists
    const existingNGO = await pool.query(
      'SELECT id FROM ngos WHERE email = $1',
      [email]
    );

    if (existingNGO.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'NGO with this email already exists'
      });
    }

    // Parse location into city and state
    const locationParts = location ? location.split(',').map((part: string) => part.trim()) : ['', ''];
    const city = locationParts[0] || '';
    const state = locationParts[1] || '';

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create a user profile for the NGO
      const userProfileResult = await client.query(`
        INSERT INTO profiles (user_id, first_name, last_name, email, role)
        VALUES (uuid_generate_v4(), $1, '', $2, 'ngo')
        RETURNING user_id
      `, [name, email]);

      const userId = userProfileResult.rows[0].user_id;

      // Create NGO with the user_id
      const result = await client.query(`
        INSERT INTO ngos (name, email, description, mission, website, city, state, phone, registration_number, verified, user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [name, email, description, mission, website_url, city, state, phone, registration_number, is_active, userId]);

      await client.query('COMMIT');

      return res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'NGO created successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error creating NGO:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create NGO',
      error: error.message
    });
  }
});

// Update NGO
router.put('/:id', requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, description, mission, location, category, phone, website_url, registration_number, is_active } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    // Check if NGO exists
    const existingNGO = await pool.query(
      'SELECT id FROM ngos WHERE id = $1',
      [id]
    );

    if (existingNGO.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'NGO not found'
      });
    }

    // Check if email is already used by another NGO
    const emailCheck = await pool.query(
      'SELECT id FROM ngos WHERE email = $1 AND id != $2',
      [email, id]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email is already used by another NGO'
      });
    }

    // Parse location into city and state
    const locationParts = location ? location.split(',').map((part: string) => part.trim()) : ['', ''];
    const city = locationParts[0] || '';
    const state = locationParts[1] || '';

    // Update NGO
    const result = await pool.query(`
      UPDATE ngos 
      SET name = $1, email = $2, description = $3, mission = $4, website = $5, 
          city = $6, state = $7, phone = $8, registration_number = $9, verified = $10
      WHERE id = $11
      RETURNING *
    `, [name, email, description, mission, website_url, city, state, phone, registration_number, is_active, id]);

    return res.json({
      success: true,
      data: result.rows[0],
      message: 'NGO updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating NGO:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update NGO',
      error: error.message
    });
  }
});

export default router; 