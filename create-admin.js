async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@dogoodhub.com',
        password: 'Admin@123',
        firstName: 'Admin',
        lastName: 'User'
      })
    });

    const data = await response.json();
    console.log('Admin Registration Response:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ Admin user created successfully!');
      console.log('📧 Email: admin@dogoodhub.com');
      console.log('🔑 Password: Admin@123');
      console.log('👤 Role: admin');
    } else {
      console.log('\n❌ Admin creation failed:', data.message);
    }

  } catch (error) {
    console.error('Error creating admin:', error.message);
  }
}

createAdminUser(); 