import express from 'express';
import pool from '../database/connection';

const router = express.Router();

// Get all NGOs
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT n.*, p.first_name, p.last_name, p.email as user_email
      FROM ngos n
      JOIN profiles p ON n.user_id = p.user_id
      ORDER BY n.created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching NGOs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch NGOs',
      error: error.message
    });
  }
});

// Get NGO by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT n.*, p.first_name, p.last_name, p.email as user_email
      FROM ngos n
      JOIN profiles p ON n.user_id = p.user_id
      WHERE n.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'NGO not found'
      });
    }
    
    return res.json({
      success: true,
      data: result.rows[0]
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
router.get('/:id/packages', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT * FROM packages
      WHERE ngo_id = $1
      ORDER BY created_at DESC
    `, [id]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching NGO packages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch NGO packages',
      error: error.message
    });
  }
});

export default router; 