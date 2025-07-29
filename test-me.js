async function testMeEndpoint() {
  try {
    // First login to get a token
    console.log('Logging in to get token...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testuser2@gmail.com',
        password: 'Password123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login Response:', JSON.stringify(loginData, null, 2));

    if (!loginData.success) {
      console.error('Login failed');
      return;
    }

    const token = loginData.data.token;
    console.log('\nTesting /me endpoint with token...');

    // Test /me endpoint
    const meResponse = await fetch('http://localhost:3001/api/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const meData = await meResponse.json();
    console.log('Me Response:', JSON.stringify(meData, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testMeEndpoint(); 