import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'do_good_hub',
  user: 'postgres',
  password: 'postgres@123'
});

async function updateAdminRole() {
  try {
    console.log('Updating admin role...');
    
    const result = await pool.query(
      'UPDATE profiles SET role = $1 WHERE email = $2 RETURNING email, role',
      ['admin', 'admin@dogoodhub.com']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Admin role updated successfully!');
      console.log('📧 Email:', result.rows[0].email);
      console.log('👤 Role:', result.rows[0].role);
    } else {
      console.log('❌ Admin user not found');
    }
    
  } catch (error) {
    console.error('Error updating admin role:', error);
  } finally {
    await pool.end();
  }
}

updateAdminRole(); 