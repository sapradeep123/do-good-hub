// Mock database connection for demonstration purposes
// This allows the application to work even without a real database connection

interface MockUser {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  role: string;
  created_at: string;
}

interface MockNGO {
  id: string;
  user_id: string;
  name: string;
  description: string;
  mission: string;
  website: string;
  address: string;
  city: string;
  state: string;
  verified: boolean;
}

interface MockPackage {
  id: string;
  ngo_id: string;
  title: string;
  description: string;
  amount: number;
  category: string;
  target_quantity: number;
  current_quantity: number;
  status: string;
}

// Mock data
const mockUsers: MockUser[] = [
  {
    id: '1',
    user_id: 'admin-user-id',
    email: 'admin@dogoodhub.com',
    first_name: 'Admin',
    last_name: 'User',
    password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: Admin@123
    role: 'admin',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    user_id: 'test-user-id',
    email: 'testuser2@gmail.com',
    first_name: 'Test',
    last_name: 'User',
    password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: Password123
    role: 'user',
    created_at: new Date().toISOString()
  }
];

const mockNGOs: MockNGO[] = [
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

const mockPackages: MockPackage[] = [
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
      // Return the first mock user for registration
      return { rows: [mockUsers[0]] };
    }
    
    if (text.includes('INSERT INTO ngos')) {
      // Return the first mock NGO for NGO creation
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

export default mockPool; 