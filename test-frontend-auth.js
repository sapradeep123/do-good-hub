// Simulate frontend authentication flow
async function testFrontendAuth() {
  try {
    console.log('=== Testing Frontend Auth Flow ===');
    
    // Step 1: Login
    console.log('\n1. Logging in...');
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

    // Step 2: Store token (simulate localStorage)
    const token = loginData.data.token;
    console.log('\n2. Token stored:', token.substring(0, 50) + '...');

    // Step 3: Check if authenticated (simulate useAuth.isAuthenticated())
    const isAuthenticated = !!token;
    console.log('\n3. Is authenticated:', isAuthenticated);

    // Step 4: Get current user (simulate useAuth.getCurrentUser())
    console.log('\n4. Getting current user...');
    const meResponse = await fetch('http://localhost:3001/api/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const meData = await meResponse.json();
    console.log('Me Response:', JSON.stringify(meData, null, 2));

    // Step 5: Test with wrong token
    console.log('\n5. Testing with wrong token...');
    const wrongTokenResponse = await fetch('http://localhost:3001/api/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer wrong-token'
      }
    });

    const wrongTokenData = await wrongTokenResponse.json();
    console.log('Wrong Token Response:', JSON.stringify(wrongTokenData, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testFrontendAuth(); 