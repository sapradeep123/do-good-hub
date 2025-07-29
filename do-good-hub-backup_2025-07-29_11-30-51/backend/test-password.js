const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'do_good_hub',
  user: 'postgres',
  password: 'postgres@123'
});

async function testPassword() {
  try {
    console.log('Testing password hashing...');
    
    // Get the stored password hash
    const userResult = await pool.query(
      'SELECT password_hash FROM profiles WHERE email = $1',
      ['testuser2@gmail.com']
    );
    
    if (userResult.rows.length === 0) {
      console.log('User not found');
      return;
    }
    
    const storedHash = userResult.rows[0].password_hash;
    console.log('Stored hash:', storedHash);
    
    // Test password comparison
    const testPassword = 'Password123';
    const isMatch = await bcrypt.compare(testPassword, storedHash);
    console.log('Password match:', isMatch);
    
    // Test with wrong password
    const wrongPassword = 'WrongPassword';
    const isWrongMatch = await bcrypt.compare(wrongPassword, storedHash);
    console.log('Wrong password match:', isWrongMatch);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testPassword(); 