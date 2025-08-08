import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

function getConnection() {
  // Check if we should use mock data (for development without database)
  const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';

  if (USE_MOCK_DATA) {
    console.log('🔧 Using mock database connection for demonstration');
    
    // Mock data with correct password hashes
    const mockUsers = [
      {
        id: '1',
        user_id: 'admin-user-id',
        email: 'admin@dogoodhub.com',
        first_name: 'Admin',
        last_name: 'User',
        password_hash: '$2a$10$C3Gi.3J.LslKr0BcfO1oJuvHtTPnDV6dXH52x2Rrl/PGl/dVnu.S2', // password: Admin@123
        role: 'admin',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        user_id: 'test-user-id',
        email: 'testuser2@gmail.com',
        first_name: 'Test',
        last_name: 'User',
        password_hash: '$2a$10$C3Gi.3J.LslKr0BcfO1oJuvHtTPnDV6dXH52x2Rrl/PGl/dVnu.S2', // password: Password123
        role: 'user',
        created_at: new Date().toISOString()
      }
    ];

    const mockNGOs = [
      {
        id: 'ngo-1',
        user_id: 'test-user-id',
        name: 'Hope Foundation',
        description: 'Providing education to underprivileged children',
        mission: 'To ensure every child has access to quality education',
        website: 'https://hopefoundation.org',
        address: '123 Education St',
        city: 'Mumbai',
        state: 'Maharashtra',
        verified: true
      },
      {
        id: 'ngo-2',
        user_id: 'admin-user-id',
        name: 'Green Earth Initiative',
        description: 'Environmental conservation and sustainability',
        mission: 'To protect and preserve our environment for future generations',
        website: 'https://greenearth.org',
        address: '456 Nature Ave',
        city: 'Delhi',
        state: 'Delhi',
        verified: true
      }
    ];

    const mockPackages = [
      {
        id: 'pkg-1',
        ngo_id: 'ngo-1',
        title: 'School Supplies Package',
        description: 'Basic school supplies for 1 child for 1 year',
        amount: 2500.00,
        category: 'Education',
        target_quantity: 100,
        current_quantity: 0,
        status: 'active'
      },
      {
        id: 'pkg-2',
        ngo_id: 'ngo-1',
        title: 'Computer Lab Setup',
        description: 'Complete computer lab setup for 20 students',
        amount: 50000.00,
        category: 'Education',
        target_quantity: 5,
        current_quantity: 0,
        status: 'active'
      },
      {
        id: 'pkg-3',
        ngo_id: 'ngo-2',
        title: 'Tree Plantation Drive',
        description: 'Plant 100 trees in urban areas',
        amount: 15000.00,
        category: 'Environment',
        target_quantity: 10,
        current_quantity: 0,
        status: 'active'
      }
    ];

    // Mock pool object
    const mockPool = {
      query: async (text: string, params?: any[]) => {
        console.log('🔧 Mock database query:', text.substring(0, 50) + '...');
        
        // Handle different query types
        if (text.includes('SELECT * FROM profiles WHERE email')) {
          const email = params?.[0];
          const user = mockUsers.find(u => u.email === email);
          return { rows: user ? [user] : [] };
        }
        
        if (text.includes('SELECT COUNT(*) FROM profiles')) {
          return { rows: [{ count: mockUsers.length }] };
        }
        
        if (text.includes('SELECT n.*, p.first_name, p.last_name, p.email as user_email FROM ngos n')) {
          const ngosWithUsers = mockNGOs.map(ngo => ({
            ...ngo,
            first_name: mockUsers.find(u => u.user_id === ngo.user_id)?.first_name || '',
            last_name: mockUsers.find(u => u.user_id === ngo.user_id)?.last_name || '',
            user_email: mockUsers.find(u => u.user_id === ngo.user_id)?.email || ''
          }));
          return { rows: ngosWithUsers };
        }
        
        if (text.includes('SELECT * FROM packages WHERE ngo_id')) {
          const ngoId = params?.[0];
          const packages = mockPackages.filter(p => p.ngo_id === ngoId);
          return { rows: packages };
        }
        
        if (text.includes('SELECT * FROM packages')) {
          return { rows: mockPackages };
        }
        
        if (text.includes('INSERT INTO profiles')) {
          return { rows: [mockUsers[0]] };
        }
        
        if (text.includes('INSERT INTO ngos')) {
          return { rows: [mockNGOs[0]] };
        }
        
        // Default response
        return { rows: [] };
      },
      
      connect: async () => {
        return {
          query: async (text: string, params?: any[]) => {
            return mockPool.query(text, params);
          },
          release: () => {}
        };
      },
      
      end: async () => {}
    };

    return mockPool;
  } else {
    console.log('✅ Using PostgreSQL database connection');
    
    // PostgreSQL connection configuration
    const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'do_good_hub',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    });

// Test the connection
pool.on('connect', () => {
      console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
      console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('🔄 Shutting down PostgreSQL connection pool...');
      await pool.end();
      process.exit(0);
    });

    return pool;
  }
}

export default getConnection(); 