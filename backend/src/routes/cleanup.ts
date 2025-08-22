import express, { Request, Response } from 'express';
import pool from '../database/connection';
import { requireRole } from '../middleware/auth';

const router = express.Router();

// Clean up all sample data (admin only)
router.post('/clear-all-data', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    console.log('🧹 Starting complete data cleanup...');
    console.log('Request headers:', req.headers);
    console.log('User role:', (req as any).user?.role);

    // Start transaction
    await pool.query('BEGIN');

    // First, let's check what constraints exist
    console.log('Checking for foreign key constraints...');
    
    // Clear in correct order to respect foreign key constraints
    
    // 1. Clear transactions first (depends on donations and packages)
    console.log('Clearing transactions...');
    try {
      const transactionsResult = await pool.query('DELETE FROM transactions');
      console.log(`Deleted ${transactionsResult.rowCount} transactions`);
    } catch (e) {
      console.log('No transactions table or already empty');
    }
    
    // 2. Clear donations (depends on orders)
    console.log('Clearing donations...');
    try {
      const donationsResult = await pool.query('DELETE FROM donations');
      console.log(`Deleted ${donationsResult.rowCount} donations`);
    } catch (e) {
      console.log('No donations table or already empty');
    }
    
    // 3. Clear orders (depends on users, packages, ngos)
    console.log('Clearing orders...');
    try {
      const ordersResult = await pool.query('DELETE FROM orders');
      console.log(`Deleted ${ordersResult.rowCount} orders`);
    } catch (e) {
      console.log('No orders table or already empty');
    }
    
    // 4. Clear vendor package assignments (depends on vendors and package_assignments)
    console.log('Clearing vendor package assignments...');
    try {
      const vpaResult = await pool.query('DELETE FROM vendor_package_assignments');
      console.log(`Deleted ${vpaResult.rowCount} vendor package assignments`);
    } catch (e) {
      console.log('No vendor_package_assignments table or already empty');
    }
    
    // 5. Clear package assignments (depends on packages, ngos, vendors)
    console.log('Clearing package assignments...');
    try {
      const paResult = await pool.query('DELETE FROM package_assignments');
      console.log(`Deleted ${paResult.rowCount} package assignments`);
    } catch (e) {
      console.log('No package_assignments table or already empty');
    }
    
    // 6. Clear packages (depends on ngos)
    console.log('Clearing packages...');
    try {
      // First, remove any foreign key references
      await pool.query('UPDATE packages SET ngo_id = NULL WHERE ngo_id IS NOT NULL');
      const packagesResult = await pool.query('DELETE FROM packages');
      console.log(`Deleted ${packagesResult.rowCount} packages`);
    } catch (e) {
      console.log('Error clearing packages:', e);
      // Try to clear packages with CASCADE if possible
      try {
        await pool.query('TRUNCATE TABLE packages CASCADE');
        console.log('Cleared packages using CASCADE');
      } catch (e2) {
        console.log('Could not clear packages:', e2);
      }
    }
    
    // 7. Clear vendors (depends on profiles)
    console.log('Clearing vendors...');
    try {
      const vendorsResult = await pool.query('DELETE FROM vendors');
      console.log(`Deleted ${vendorsResult.rowCount} vendors`);
    } catch (e) {
      console.log('No vendors table or already empty');
    }
    
    // 8. Clear NGOs (depends on profiles)
    console.log('Clearing NGOs...');
    try {
      const ngosResult = await pool.query('DELETE FROM ngos');
      console.log(`Deleted ${ngosResult.rowCount} NGOs`);
    } catch (e) {
      console.log('No ngos table or already empty');
    }
    
    // 9. Clear password reset requests
    console.log('Clearing password reset requests...');
    try {
      const prrResult = await pool.query('DELETE FROM password_reset_requests');
      console.log(`Deleted ${prrResult.rowCount} password reset requests`);
    } catch (e) {
      console.log('No password_reset_requests table or already empty');
    }
    
    // 10. Clear admin audit logs
    console.log('Clearing admin audit logs...');
    try {
      const aalResult = await pool.query('DELETE FROM admin_audit_log');
      console.log(`Deleted ${aalResult.rowCount} admin audit logs`);
    } catch (e) {
      console.log('No admin_audit_log table or already empty');
    }
    
    // 11. Clear tickets and page content
    console.log('Clearing other related data...');
    try {
      const ticketsResult = await pool.query('DELETE FROM tickets');
      const pageContentResult = await pool.query('DELETE FROM page_content');
      console.log(`Deleted ${ticketsResult.rowCount} tickets and ${pageContentResult.rowCount} page content items`);
    } catch (e) {
      console.log('Some tables may not exist');
    }
    
    // 12. Clear user profiles (except admin users)
    console.log('Clearing non-admin user profiles...');
    try {
      const profilesResult = await pool.query(`
        DELETE FROM profiles 
        WHERE role != 'admin' 
        AND email NOT IN ('admin@example.com', 'admin@test.com', 'admin@dogoodhub.com')
      `);
      console.log(`Deleted ${profilesResult.rowCount} non-admin user profiles`);
    } catch (e) {
      console.log('Error clearing profiles:', e);
    }
    
    // Commit transaction
    await pool.query('COMMIT');
    
    // Reset sequences if they exist
    try {
      await pool.query('ALTER SEQUENCE IF EXISTS profiles_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE IF EXISTS ngos_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE IF EXISTS vendors_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE IF EXISTS packages_id_seq RESTART WITH 1');
    } catch (e) {
      console.log('Note: Some sequences may not exist (this is normal)');
    }
    
    console.log('✅ Complete data cleanup finished successfully');
    
    const response = {
      success: true,
      message: 'All sample data cleared successfully',
      details: {
        clearedTables: [
          'transactions', 'donations', 'orders', 'vendor_package_assignments',
          'package_assignments', 'packages', 'vendors', 'ngos',
          'password_reset_requests', 'admin_audit_log', 'tickets', 'page_content'
        ],
        preservedData: 'Admin user profiles and system tables'
      }
    };
    
    console.log('Sending response:', JSON.stringify(response, null, 2));
    return res.json(response);

  } catch (error) {
    // Rollback on error
    await pool.query('ROLLBACK');
    console.error('❌ Cleanup failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get current data counts (admin only)
router.get('/data-status', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const tables = [
      'profiles', 'ngos', 'vendors', 'packages', 'package_assignments',
      'vendor_package_assignments', 'orders', 'donations', 'transactions',
      'tickets', 'page_content', 'password_reset_requests', 'admin_audit_log'
    ];
    
    const counts: any = {};
    
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        counts[table] = parseInt(result.rows[0].count);
      } catch (e) {
        counts[table] = 'Table not found';
      }
    }
    
    return res.json({
      success: true,
      data: {
        counts,
        totalRecords: Object.values(counts).reduce((sum: any, count: any) => {
          return sum + (typeof count === 'number' ? count : 0);
        }, 0)
      }
    });

  } catch (error) {
    console.error('Error getting data status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get data status'
    });
  }
});

export default router;
