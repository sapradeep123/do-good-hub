const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'do_good_hub',
  user: 'postgres',
  password: 'password'
});

async function createOrdersTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
        order_id TEXT NOT NULL UNIQUE,
        user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
        package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
        ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
        razorpay_order_id TEXT NOT NULL UNIQUE,
        payment_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
    `);
    
    console.log('✅ Orders table created successfully');
  } catch (error) {
    console.error('❌ Error creating orders table:', error.message);
  } finally {
    await pool.end();
  }
}

createOrdersTable();
