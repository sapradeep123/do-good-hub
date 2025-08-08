const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = require('./dist/database/connection').default;

async function createPackageAssignmentsTable() {
  try {
    console.log('Creating package_assignments table...');

    const sqlFile = path.join(__dirname, 'create_package_assignments_table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    await pool.query(sql);

    console.log('✅ package_assignments table created successfully!');

    // Test the table
    const result = await pool.query('SELECT COUNT(*) FROM package_assignments');
    console.log('✅ Table test successful. Row count:', result.rows[0].count);

  } catch (error) {
    console.error('❌ Error creating table:', error.message);
  } finally {
    await pool.end();
  }
}

createPackageAssignmentsTable(); 