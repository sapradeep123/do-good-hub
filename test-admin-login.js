async function testAdminLogin() {
  try {
    console.log('Testing admin login...');
    
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@dogoodhub.com',
        password: 'Admin@123'
      })
    });

    const data = await response.json();
    console.log('Admin Login Response:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ Admin login successful!');
      console.log('📧 Email:', data.data.user.email);
      console.log('👤 Role:', data.data.user.role);
      console.log('👤 Name:', data.data.user.firstName, data.data.user.lastName);
    } else {
      console.log('\n❌ Admin login failed:', data.message);
    }

  } catch (error) {
    console.error('Error testing admin login:', error.message);
  }
}

testAdminLogin(); 