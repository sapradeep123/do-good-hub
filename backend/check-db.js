const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'do_good_hub',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres@123',
});

async function checkAndFixDatabase() {
  try {
    console.log('🔍 Checking current database state...\n');

    // 1. First, let's see what tables exist
    console.log('📋 Available tables:');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.table(tables.rows);

    // 2. Check each key table structure
    console.log('\n🔍 Checking key table structures...');
    
    for (const table of ['packages', 'ngos', 'vendors', 'package_assignments']) {
      try {
        const columns = await pool.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position;
        `, [table]);
        console.log(`\n📋 ${table} table structure:`);
        console.table(columns.rows);
      } catch (e) {
        console.log(`❌ ${table} table not found or error:`, e.message);
      }
    }

    // 3. Check current data in key tables
    console.log('\n📊 Current data counts:');
    
    for (const table of ['packages', 'ngos', 'vendors', 'package_assignments']) {
      try {
        const count = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`${table}: ${count.rows[0].count} records`);
      } catch (e) {
        console.log(`${table}: Error - ${e.message}`);
      }
    }

    // 4. Check sample data from key tables
    console.log('\n📋 Sample data from packages:');
    try {
      const packages = await pool.query('SELECT * FROM packages LIMIT 3');
      console.table(packages.rows);
    } catch (e) {
      console.log('❌ Error getting packages:', e.message);
    }

    console.log('\n📋 Sample data from package_assignments:');
    try {
      const assignments = await pool.query('SELECT * FROM package_assignments LIMIT 3');
      console.table(assignments.rows);
    } catch (e) {
      console.log('❌ Error getting assignments:', e.message);
    }

    console.log('\n✅ Database inspection completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAndFixDatabase();
