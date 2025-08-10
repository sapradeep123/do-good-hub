const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'do_good_hub',
  user: 'postgres',
  password: 'postgres@123'
});

async function updateUserRole(email, newRole) {
  try {
    console.log(`Updating user role for ${email} to ${newRole}...`);
    
    // First, get the user_id from profiles
    const userResult = await pool.query(
      'SELECT user_id FROM profiles WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Update the role in profiles table
    const result = await pool.query(
      'UPDATE profiles SET role = $1 WHERE email = $2 RETURNING email, role',
      [newRole, email]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ User role updated successfully!');
      console.log('📧 Email:', result.rows[0].email);
      console.log('👤 Role:', result.rows[0].role);
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('Error updating user role:', error);
  } finally {
    await pool.end();
  }
}

// Update the test user to NGO role
updateUserRole('testngo@example.com', 'ngo');
