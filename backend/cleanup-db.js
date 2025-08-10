const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'do_good_hub',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres@123',
});

async function cleanupDatabase() {
  try {
    console.log('🧹 Starting database cleanup...\n');

    // 1. Show current incomplete assignments
    console.log('❌ Current incomplete assignments (missing vendor):');
    const incomplete = await pool.query(`
      SELECT 
        pa.id as assignment_id,
        n.name as ngo_name,
        p.title as package_name,
        pa.created_at
      FROM package_assignments pa
      JOIN ngos n ON pa.ngo_id = n.id
      JOIN packages p ON pa.package_id = p.id
      WHERE pa.vendor_id IS NULL;
    `);
    
    if (incomplete.rows.length === 0) {
      console.log('✅ No incomplete assignments found!');
      return;
    }
    
    console.table(incomplete.rows);
    console.log(`\nFound ${incomplete.rows.length} incomplete assignments to clean up.`);

    // 2. Clean up incomplete assignments
    console.log('\n🧹 Cleaning up incomplete assignments...');
    
    for (const row of incomplete.rows) {
      console.log(`Deleting: ${row.ngo_name} - ${row.package_name}`);
      await pool.query('DELETE FROM package_assignments WHERE id = $1', [row.assignment_id]);
    }
    
    console.log(`✅ Deleted ${incomplete.rows.length} incomplete assignments`);

    // 3. Show final state
    console.log('\n📊 Final database state:');
    const finalState = await pool.query(`
      SELECT 
        n.name as ngo_name,
        p.title as package_name,
        v.company_name as vendor_name,
        pa.is_active
      FROM package_assignments pa
      JOIN ngos n ON pa.ngo_id = n.id
      JOIN packages p ON pa.package_id = p.id
      JOIN vendors v ON pa.vendor_id = v.id
      ORDER BY n.name, p.title;
    `);
    
    if (finalState.rows.length === 0) {
      console.log('ℹ️ No complete assignments found. All assignments were incomplete.');
    } else {
      console.table(finalState.rows);
      console.log(`\n✅ ${finalState.rows.length} complete assignments remaining`);
    }

    console.log('\n🎯 Cleanup completed! Now only complete NGO-vendor-package relationships exist.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  } finally {
    await pool.end();
  }
}

cleanupDatabase();
