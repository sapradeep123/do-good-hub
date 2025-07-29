import fs from 'fs';
import path from 'path';
import pool from './connection';

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // First, try to create the database if it doesn't exist
    try {
      const adminPool = new (require('pg').Pool)({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: 'postgres', // Connect to default database
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
      });
      
      await adminPool.query('CREATE DATABASE do_good_hub');
      console.log('✅ Database created successfully!');
      await adminPool.end();
    } catch (error: any) {
      if (error.code === '42P04') {
        console.log('Database already exists, continuing...');
      } else {
        console.log('Could not create database, trying to continue...');
      }
    }
    
    // Read and execute the initial schema migration
    const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing initial schema migration...');
    await pool.query(migrationSQL);
    
    console.log('✅ Database migrations completed successfully!');
    
    // Test the connection by querying a table
    const result = await pool.query('SELECT COUNT(*) FROM profiles');
    console.log(`Database is ready. Profiles table has ${result.rows[0].count} rows.`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

export default runMigrations; 