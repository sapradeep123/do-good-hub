import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

async function testPasswordReset() {
  try {
    console.log('🔍 Testing Password Reset Flow...\n');

    // Step 1: Check current user status
    console.log('1. Checking current user status...');
    const userStatus = await axios.get(`${BASE_URL}/auth/debug-user/ngo@test.com`);
    console.log('User Status:', JSON.stringify(userStatus.data, null, 2));
    console.log('');

    // Step 2: Try to login with current password (should fail)
    console.log('2. Testing login with current password...');
    try {
      const loginResult = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'ngo@test.com',
        password: 'test123'
      });
      console.log('Login successful:', loginResult.data);
    } catch (error) {
      console.log('Login failed as expected:', error.response?.data || error.message);
    }
    console.log('');

    // Step 3: Generate a new reset token (admin only - simulate)
    console.log('3. Simulating admin password reset token generation...');
    console.log('Note: This requires admin authentication. Please generate token manually in admin panel.');
    console.log('');

    // Step 4: Test password reset with a new password
    console.log('4. Testing password reset with new password...');
    try {
      const resetResult = await axios.post(`${BASE_URL}/auth/confirm-password-reset`, {
        email: 'ngo@test.com',
        token: 'YOUR_TOKEN_HERE', // Replace with actual token
        newPassword: 'newpassword123'
      });
      console.log('Password reset successful:', resetResult.data);
    } catch (error) {
      console.log('Password reset failed:', error.response?.data || error.message);
    }
    console.log('');

    // Step 5: Check user status after reset
    console.log('5. Checking user status after reset...');
    const userStatusAfter = await axios.get(`${BASE_URL}/auth/debug-user/ngo@test.com`);
    console.log('User Status After Reset:', JSON.stringify(userStatusAfter.data, null, 2));

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testPasswordReset();
