const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = require('./dist/database/connection').default;

async function createPasswordResetTable() {
  try {
    console.log('Creating password_reset_requests table...');
    
    const sqlFile = path.join(__dirname, 'create_password_reset_table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ password_reset_requests table created successfully!');
    
    // Test the table
    const result = await pool.query('SELECT COUNT(*) FROM password_reset_requests');
    console.log('✅ Table test successful. Row count:', result.rows[0].count);
    
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
  } finally {
    await pool.end();
  }
}

createPasswordResetTable(); 