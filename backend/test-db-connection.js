const { Pool } = require('pg');

// Test different password configurations
const testPasswords = [
  'password',
  '',
  'postgres',
  'admin',
  '123456'
];

async function testConnection() {
  for (const password of testPasswords) {
    try {
      console.log(`Testing password: "${password}"`);
      
      const pool = new Pool({
        host: 'localhost',
        port: 5432,
        database: 'do_good_hub',
        user: 'postgres',
        password: password,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      const client = await pool.connect();
      console.log(`✅ SUCCESS with password: "${password}"`);
      
      // Test a simple query
      const result = await client.query('SELECT COUNT(*) FROM profiles');
      console.log(`Database has ${result.rows[0].count} users`);
      
      await client.release();
      await pool.end();
      
      // If we get here, this password works
      console.log(`\n🎉 Working password found: "${password}"`);
      console.log('Update your .env file with this password:');
      console.log(`DB_PASSWORD=${password}`);
      return password;
      
    } catch (error) {
      console.log(`❌ Failed with password: "${password}" - ${error.message}`);
    }
  }
  
  console.log('\n❌ No working password found. You may need to:');
  console.log('1. Check your PostgreSQL installation');
  console.log('2. Reset the postgres user password');
  console.log('3. Create a new user with the password "password"');
}

testConnection(); 