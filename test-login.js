async function testRegistration() {
  try {
    console.log('Testing registration...');
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testuser2@gmail.com',
        password: 'Password123',
        firstName: 'Test',
        lastName: 'User2'
      })
    });

    const data = await response.json();
    console.log('Registration Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Registration Error:', error.message);
  }
}

async function testLogin() {
  try {
    console.log('\nTesting login...');
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testuser2@gmail.com',
        password: 'Password123'
      })
    });

    const data = await response.json();
    console.log('Login Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Login Error:', error.message);
  }
}

async function runTests() {
  await testRegistration();
  await testLogin();
}

runTests(); 
testLogin(); 