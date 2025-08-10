/// <reference path="../types/express/index.d.ts" />
import express, { Request, Response } from 'express';
import pool from '../database/connection';
import { requireRole, attachUser } from '../middleware/auth';
import { razorpay, RAZORPAY_KEY_ID } from '../config/razorpay';

const router = express.Router();

// Create payment order
router.post('/create-order', attachUser, requireRole(['user']), async (req: Request, res: Response) => {
  try {
    const { packageId, quantity = 1, ngoId } = req.body;
    const userId = (req as any).user.userId;

    // Validate required fields
    if (!packageId || !ngoId) {
      return res.status(400).json({
        success: false,
        message: 'Package ID and NGO ID are required'
      });
    }

    // Get package details
    const packageResult = await pool.query(
      'SELECT * FROM packages WHERE id = $1',
      [packageId]
    );

    if (packageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    const packageData = packageResult.rows[0];
    const amount = packageData.amount * quantity * 100; // Convert to paise

    // Get NGO details
    const ngoResult = await pool.query(
      'SELECT * FROM ngos WHERE id = $1',
      [ngoId]
    );

    if (ngoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'NGO not found'
      });
    }

    const ngoData = ngoResult.rows[0];

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount,
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        packageId: packageId,
        ngoId: ngoId,
        userId: userId,
        quantity: quantity
      }
    });

    // Create orders table if it doesn't exist
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
          order_id TEXT NOT NULL UNIQUE,
          user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
          package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
          ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
          amount DECIMAL(10,2) NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
          razorpay_order_id TEXT NOT NULL UNIQUE,
          payment_id TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
      `);
    } catch (error: any) {
      console.log('Orders table already exists or creation failed:', error.message);
    }

    // Store order details in database
    const orderResult = await pool.query(`
      INSERT INTO orders (
        order_id, user_id, package_id, ngo_id, amount, quantity, 
        status, razorpay_order_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `, [
      order.id,
      userId,
      packageId,
      ngoId,
      amount / 100, // Store in rupees
      quantity,
      'pending',
      order.id
    ]);

    return res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: amount,
        currency: 'INR',
        keyId: RAZORPAY_KEY_ID,
        package: packageData,
        ngo: ngoData
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
});

// Verify payment and process transaction
router.post('/verify-payment', attachUser, requireRole(['user']), async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = (req as any).user.userId;

    // Verify payment signature
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', 'vENWqX0XZE8RNzC4R6R5hxzr')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Get order details
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE razorpay_order_id = $1 AND user_id = $2',
      [razorpay_order_id, userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orderResult.rows[0];

    // Get package details for donation record
    const packageResult = await pool.query(
      'SELECT title FROM packages WHERE id = $1',
      [order.package_id]
    );

    if (packageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    const packageData = packageResult.rows[0];

    // Update order status
    await pool.query(
      'UPDATE orders SET status = $1, payment_id = $2, updated_at = NOW() WHERE id = $3',
      ['completed', razorpay_payment_id, order.id]
    );

    // Create donation record
    const donationResult = await pool.query(`
      INSERT INTO donations (
        user_id, ngo_id, package_id, package_title, package_amount, 
        total_amount, payment_status, transaction_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `, [
      userId,
      order.ngo_id,
      order.package_id,
      packageData.title,
      order.amount,
      order.amount,
      'completed',
      razorpay_payment_id
    ]);

    // Create package assignment for NGO (if table exists)
    try {
      await pool.query(`
        INSERT INTO package_assignments (
          package_id, ngo_id, is_active, created_at
        ) VALUES ($1, $2, true, NOW())
      `, [order.package_id, order.ngo_id]);
    } catch (error: any) {
      console.log('Package assignments table not found or insert failed:', error.message);
    }

    return res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        donationId: donationResult.rows[0].id
      }
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
});

// Get user's payment history
router.get('/history', attachUser, requireRole(['user']), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const result = await pool.query(`
      SELECT 
        o.*,
        p.title as package_title,
        p.description as package_description,
        n.name as ngo_name
      FROM orders o
      JOIN packages p ON o.package_id = p.id
      JOIN ngos n ON o.ngo_id = n.id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `, [userId]);

    return res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
});

// Get all transactions (Admin only)
router.get('/transactions', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        o.*,
        p.title as package_title,
        p.description as package_description,
        n.name as ngo_name,
        u.first_name,
        u.last_name,
        u.email as user_email
      FROM orders o
      JOIN packages p ON o.package_id = p.id
      JOIN ngos n ON o.ngo_id = n.id
      JOIN profiles u ON o.user_id = u.user_id
      ORDER BY o.created_at DESC
    `);

    return res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
});

// Get transaction statistics (Admin only)
router.get('/statistics', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount,
        AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as avg_amount
      FROM orders
    `);

    const recentOrdersResult = await pool.query(`
      SELECT 
        o.*,
        p.title as package_title,
        n.name as ngo_name,
        u.first_name,
        u.last_name
      FROM orders o
      JOIN packages p ON o.package_id = p.id
      JOIN ngos n ON o.ngo_id = n.id
      JOIN profiles u ON o.user_id = u.user_id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    return res.json({
      success: true,
      data: {
        statistics: statsResult.rows[0],
        recentOrders: recentOrdersResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

export default router;
