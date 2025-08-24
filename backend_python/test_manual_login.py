import asyncio
import aiohttp
import json

async def test_manual_login():
    """Test manual login with existing users"""
    base_url = "http://localhost:8000"
    
    # Test users from the database
    test_users = [
        {"email": "admin@dogoodhub.com", "password": "password"},
        {"email": "vendor@example.com", "password": "password"},
        {"email": "ngo@example.com", "password": "password"},
        {"email": "testuser@example.com", "password": "password"}
    ]
    
    async with aiohttp.ClientSession() as session:
        for user in test_users:
            print(f"\n🔐 Testing login for: {user['email']}")
            
            try:
                async with session.post(
                    f"{base_url}/api/auth/login",
                    json=user,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    status = response.status
                    print(f"   Status: {status}")
                    
                    try:
                        data = await response.json()
                        print(f"   Response: {json.dumps(data, indent=2)}")
                        
                        if status == 200 and "access_token" in data:
                            print(f"   ✅ Login successful!")
                            
                            # Test /me endpoint with token
                            token = data["access_token"]
                            async with session.get(
                                f"{base_url}/api/auth/me",
                                headers={"Authorization": f"Bearer {token}"}
                            ) as me_response:
                                me_status = me_response.status
                                me_data = await me_response.json()
                                print(f"   /me Status: {me_status}")
                                print(f"   /me Response: {json.dumps(me_data, indent=2)}")
                        else:
                            print(f"   ❌ Login failed")
                            
                    except Exception as e:
                        text_response = await response.text()
                        print(f"   Response (text): {text_response}")
                        print(f"   JSON Error: {e}")
                        
            except Exception as e:
                print(f"   ❌ Request error: {e}")

if __name__ == "__main__":
    asyncio.run(test_manual_login())