/// <reference path="../types/express/index.d.ts" />
import express from 'express';
import pool from '../database/connection';
import { requireRole } from '../middleware/auth';

const router = express.Router();

// Get all vendors
router.get('/', requireRole(['admin', 'ngo', 'vendor']), async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let query = `
      SELECT v.*, p.first_name, p.last_name, p.email as user_email
      FROM vendors v
      JOIN profiles p ON v.user_id = p.user_id
    `;

    // Role-based filtering
    if (userRole === 'vendor') {
      query += ` WHERE v.user_id = $1`;
    }
    
    query += ` ORDER BY v.created_at DESC`;

    const params = userRole === 'admin' ? [] : [userId];
    const result = await pool.query(query, params);
    
    return res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching vendors:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vendors',
      error: error.message
    });
  }
});

// Get vendor by ID with (NGO,Package) pairs served
router.get('/:id', requireRole(['admin', 'ngo', 'vendor']), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Get vendor basic info
    const vendorResult = await pool.query(`
      SELECT v.*, p.first_name, p.last_name, p.email as user_email
      FROM vendors v
      JOIN profiles p ON v.user_id = p.user_id
      WHERE v.id = $1
    `, [id]);
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const vendor = vendorResult.rows[0];

    // Role-based access check
    if (userRole === 'vendor' && vendor.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get (NGO,Package) pairs served by this vendor
    const pairsResult = await pool.query(`
      SELECT 
        p.id as package_id,
        p.title as package_title,
        p.amount as package_amount,
        n.id as ngo_id,
        n.name as ngo_name,
        pa.id as assignment_id,
        vpa.created_at as assigned_at
      FROM vendor_package_assignments vpa
      JOIN package_assignments pa ON vpa.package_assignment_id = pa.id
      JOIN packages p ON pa.package_id = p.id
      JOIN ngos n ON pa.ngo_id = n.id
      WHERE vpa.vendor_id = $1 AND pa.is_active = true
      ORDER BY vpa.created_at DESC
    `, [id]);

    const response = {
      ...vendor,
      served_pairs: pairsResult.rows
    };
    
    return res.json({
      success: true,
      data: response
    });
  } catch (error: any) {
    console.error('Error fetching vendor:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor',
      error: error.message
    });
  }
});

// Create new vendor
router.post('/', requireRole(['admin']), async (req, res) => {
  try {
    const { company_name, email, phone, description, address, business_type, is_active = true } = req.body;

    // Validate required fields
    if (!company_name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Company name and email are required'
      });
    }

    // Check if vendor with same email already exists
    const existingVendor = await pool.query(
      'SELECT id FROM vendors WHERE email = $1',
      [email]
    );

    if (existingVendor.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Vendor with this email already exists'
      });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create a user profile for the vendor
      const userProfileResult = await client.query(`
        INSERT INTO profiles (user_id, first_name, last_name, email, role)
        VALUES (uuid_generate_v4(), $1, '', $2, 'vendor')
        RETURNING user_id
      `, [company_name, email]);

      const userId = userProfileResult.rows[0].user_id;

      // Create vendor with the user_id
      const result = await client.query(`
        INSERT INTO vendors (company_name, email, phone, description, address, business_type, verified, user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [company_name, email, phone, description, address, business_type, is_active, userId]);

      await client.query('COMMIT');

      return res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Vendor created successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error creating vendor:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create vendor',
      error: error.message
    });
  }
});

// Update vendor
router.put('/:id', requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { company_name, email, phone, description, address, business_type, is_active } = req.body;

    // Validate required fields
    if (!company_name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Company name and email are required'
      });
    }

    // Check if vendor exists
    const existingVendor = await pool.query(
      'SELECT id FROM vendors WHERE id = $1',
      [id]
    );

    if (existingVendor.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check if email is already used by another vendor
    const emailCheck = await pool.query(
      'SELECT id FROM vendors WHERE email = $1 AND id != $2',
      [email, id]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email is already used by another vendor'
      });
    }

    // Update vendor
    const result = await pool.query(`
      UPDATE vendors 
      SET company_name = $1, email = $2, phone = $3, description = $4, 
          address = $5, business_type = $6, verified = $7
      WHERE id = $8
      RETURNING *
    `, [company_name, email, phone, description, address, business_type, is_active, id]);

    return res.json({
      success: true,
      data: result.rows[0],
      message: 'Vendor updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating vendor:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update vendor',
      error: error.message
    });
  }
});

export default router; 