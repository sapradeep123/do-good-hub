import fs from 'fs';
import path from 'path';
import pool from './connection';

async function runMigrations() {
  try {
    console.log('Starting database migrations...');

    // Try to create the database if it doesn't exist
    try {
      const adminPool = new (require('pg').Pool)({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: 'postgres',
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
        console.log('Could not create database, continuing...');
      }
    }

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const fullPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(fullPath, 'utf8');
      console.log(`Applying migration: ${file}`);
      await pool.query(sql);
    }

    console.log('✅ Database migrations completed successfully!');

    const result = await pool.query('SELECT COUNT(*) FROM profiles');
    console.log(`Database is ready. Profiles table has ${result.rows[0].count} rows.`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations();
}

export default runMigrations; 