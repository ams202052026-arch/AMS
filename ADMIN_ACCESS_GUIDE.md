# 🔐 Admin Access Security Guide

## Overview

The AMS admin panel is now secured and **NOT publicly accessible**. This prevents unauthorized access and ensures that only authorized administrators can access the admin dashboard from trusted devices.

## Security Features

✅ **No Public Admin Links** - Admin login is not exposed on the landing page or any public pages  
✅ **Token-Based Access** - Requires a secure token to access admin area  
✅ **Time-Limited Tokens** - Access tokens expire after 1 hour  
✅ **Session-Based Security** - Admin access is tracked via secure sessions  
✅ **Device Restriction** - Only devices with valid tokens can access admin area  

## How to Access Admin Panel

### Step 1: Generate Secure Access Token

Run one of the following commands on your **local server/device**:

**Option 1: Using npm script (Recommended)**
```bash
npm run admin:access
```

**Option 2: Using Node directly**
```bash
node scripts/generate-admin-access.js
```

**Option 3: Using batch file (Windows)**
```bash
scripts\admin-access.bat
```

**Option 4: Using shell script (Linux/Mac)**
```bash
./scripts/admin-access.sh
```

### Step 2: Copy the Generated URL

The script will output something like:
```
🔐 SECURE ADMIN ACCESS GENERATED
=====================================
Token: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...
URL: http://localhost:3000/admin/secure-access?token=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...

⚠️  SECURITY NOTES:
- This token expires in 1 hour
- Only use this URL on trusted devices
- Do not share this URL with anyone
- Access this URL only from secure networks
=====================================
```

### Step 3: Open the URL

1. Copy the generated URL
2. Open it in your browser on a **trusted device**
3. You will be redirected to the admin login page
4. Login with your super admin credentials

## Important Security Notes

⚠️ **DO NOT:**
- Share admin access URLs with anyone
- Post admin URLs in public channels
- Access admin panel from public/untrusted networks
- Save admin URLs in browser bookmarks (they expire)

✅ **DO:**
- Generate new tokens each time you need admin access
- Use admin panel only from secure, trusted devices
- Keep your admin credentials secure
- Log out after completing admin tasks

## Token Expiration

- **Access tokens expire after 1 hour**
- After expiration, you must generate a new token
- This ensures that even if a URL is compromised, it becomes useless quickly

## For Production Deployment

When deploying to production (e.g., Vercel, Heroku):

1. Set the `BASE_URL` environment variable:
   ```
   BASE_URL=https://your-domain.com
   ```

2. Generate tokens on your production server:
   ```bash
   npm run admin:access
   ```

3. The generated URL will use your production domain

## Troubleshooting

### "Access Denied" Error
- Your token may have expired (1 hour limit)
- Generate a new token and try again

### "Invalid Token" Error
- The token is not valid
- Generate a new token using the scripts

### Can't Access Admin Login
- Make sure you're using the secure access URL with a valid token
- Direct access to `/admin/login` is blocked for security

## Architecture Changes

### Before (Insecure)
```
Landing Page → Admin Login (Public) ❌
```

### After (Secure)
```
Local Device → Generate Token → Secure URL → Admin Login ✅
```

## Customer vs Business Owner vs Admin

| User Type | Access Method | Location |
|-----------|--------------|----------|
| **Customer** | "Customer Login" button | Landing page header |
| **Business Owner** | "Join as Business Partner" link | Footer (like Shopee) |
| **Admin** | Secure token-based URL | Not publicly visible |

## Questions?

If you need to access the admin panel:
1. Make sure you have access to the server/device where AMS is running
2. Run the token generation script
3. Use the generated URL within 1 hour

This security model ensures that admin access is restricted to authorized personnel with physical or SSH access to the server.