async function testBackendError() {
  try {
    console.log('Testing backend error...');
    
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

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response text:', text);
    
    try {
      const data = JSON.parse(text);
      console.log('Response JSON:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('Response is not JSON:', text);
    }

  } catch (error) {
    console.error('Fetch error:', error.message);
  }
}

testBackendError(); 