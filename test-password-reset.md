# Password Reset Debug Guide

## Issue: HTTP 401 after Admin Password Reset

### What I Fixed:

1. **Added missing `/api/auth/confirm-password-reset` endpoint** - The frontend was calling this but it didn't exist
2. **Enhanced password reset token generation** - Now uses cryptographically secure tokens
3. **Added debugging to login route** - To see exactly what's happening during login attempts
4. **Added debug endpoint** - `/api/auth/debug-user/:email` to check user password status

### How to Test:

1. **Start the backend server** (should be running now)
2. **Login as Admin** at http://localhost:5173/admin
3. **Go to Users tab** and find an NGO user
4. **Click the 🔑 icon** to generate a password reset token
5. **Copy the token** from the toast notification
6. **Go to Password Reset page** at http://localhost:5173/password-reset
7. **Enter the email and token**, set a new password
8. **Try to login** with the new password

### Debug Steps if Still Getting 401:

1. **Check user status**: Visit `/api/auth/debug-user/ngo@example.com` (replace with actual email)
2. **Check backend logs** for login attempts and password reset operations
3. **Verify database**: Check if `password_hash` is properly set in the `profiles` table

### Expected Flow:

1. Admin generates token → stored in `password_reset_token`
2. User resets password → `password_hash` is updated, token is cleared
3. User can login with new password → JWT token generated successfully

### Common Issues:

- **Token expiration**: Tokens expire after 1 hour
- **Wrong user ID**: Frontend might be using wrong ID for password reset
- **Database schema**: Missing `password_hash` column
- **JWT secret**: Missing or incorrect JWT_SECRET environment variable

### Next Steps:

If the issue persists, check the backend console logs for the specific error messages I added.
