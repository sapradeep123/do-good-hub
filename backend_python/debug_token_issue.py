#!/usr/bin/env python3
"""
Debug JWT token creation and verification issues
"""

import jwt
from datetime import datetime, timedelta
from app.middleware.auth import SECRET_KEY, ALGORITHM, verify_token

# Test user data
test_user = {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "vendor@dogoodhub.com",
    "role": "VENDOR"
}

def create_correct_token(user_data):
    """Create a JWT token with correct format."""
    to_encode = {
        "sub": user_data["user_id"],  # Should be user_id, not email
        "email": user_data["email"],
        "role": user_data["role"],
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_incorrect_token(user_data):
    """Create a JWT token with incorrect format (email as sub)."""
    to_encode = {
        "sub": user_data["email"],  # WRONG: should be user_id
        "user_id": user_data["user_id"],
        "role": user_data["role"],
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def test_token_verification():
    """Test token verification with both correct and incorrect formats."""
    print("=== JWT TOKEN VERIFICATION TEST ===")
    
    # Test correct token
    print("\n1. Testing CORRECT token format:")
    correct_token = create_correct_token(test_user)
    print(f"Token: {correct_token[:50]}...")
    
    try:
        token_data = verify_token(correct_token)
        print(f"✅ SUCCESS: user_id={token_data.user_id}, email={token_data.email}, role={token_data.role}")
    except Exception as e:
        print(f"❌ FAILED: {e}")
    
    # Test incorrect token
    print("\n2. Testing INCORRECT token format (email as sub):")
    incorrect_token = create_incorrect_token(test_user)
    print(f"Token: {incorrect_token[:50]}...")
    
    try:
        token_data = verify_token(incorrect_token)
        print(f"✅ SUCCESS: user_id={token_data.user_id}, email={token_data.email}, role={token_data.role}")
    except Exception as e:
        print(f"❌ FAILED: {e}")
    
    # Show token payloads
    print("\n3. Token payload comparison:")
    
    correct_payload = jwt.decode(correct_token, SECRET_KEY, algorithms=[ALGORITHM])
    incorrect_payload = jwt.decode(incorrect_token, SECRET_KEY, algorithms=[ALGORITHM])
    
    print(f"Correct payload: {correct_payload}")
    print(f"Incorrect payload: {incorrect_payload}")
    
    print("\n=== ANALYSIS ===")
    print("The verify_token function expects:")
    print("- 'sub' field to contain user_id")
    print("- 'email' field to contain email")
    print("- 'role' field to contain role")
    print("\nIf tokens are created with email in 'sub' field, verification will fail!")

if __name__ == "__main__":
    test_token_verification()