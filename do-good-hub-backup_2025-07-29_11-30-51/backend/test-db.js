const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'do_good_hub',
  user: 'postgres',
  password: 'postgres@123'
});

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await pool.query('SELECT NOW()');
    console.log('Database connected:', result.rows[0]);
    
    // Check if user exists
    const userResult = await pool.query(
      'SELECT email, first_name, last_name, password_hash FROM profiles WHERE email = $1',
      ['testuser2@gmail.com']
    );
    
    console.log('User found:', userResult.rows);
    
    if (userResult.rows.length > 0) {
      console.log('User exists with password hash:', userResult.rows[0].password_hash ? 'Yes' : 'No');
    } else {
      console.log('User not found');
    }
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await pool.end();
  }
}

testDatabase(); 