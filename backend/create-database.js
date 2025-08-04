const { Pool } = require('pg');
require('dotenv').config();

async function createDatabase() {
  // Connect to default postgres database first
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'postgres', // Connect to default database
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres@123',
  });

  try {
    console.log('🔄 Connecting to PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if database exists
    const checkResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'do_good_hub']
    );

    if (checkResult.rows.length > 0) {
      console.log('✅ Database "do_good_hub" already exists');
    } else {
      console.log('🔄 Creating database "do_good_hub"...');
      await client.query(`CREATE DATABASE ${process.env.DB_NAME || 'do_good_hub'}`);
      console.log('✅ Database "do_good_hub" created successfully');
    }

    client.release();
    await pool.end();
    console.log('✅ Database setup completed!');
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    process.exit(1);
  }
}

createDatabase(); 