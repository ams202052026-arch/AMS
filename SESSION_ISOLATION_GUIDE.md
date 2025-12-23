# 🔐 Session Isolation Guide

## Problem: Session Conflict Between Different User Types

### What Was Happening
When you login as **Super Admin** in one browser tab, then login as **Customer** in another tab, the customer session overwrites the admin session because they share the same browser session.

### Why This Happens
- Browser sessions are shared across all tabs in the same browser
- When you login with a different account, it overwrites the session data
- This causes the admin window to suddenly show customer data (or vice versa)

---

## ✅ Solution Implemented

### Session Conflict Detection
The system now detects when you try to login with a different user type while already logged in:

**Error Message:**
```
You are already logged in with a different account type. 
Please use a different browser or incognito window, or logout first.
```

### How It Works
1. When you try to login, system checks if there's already an active session
2. If the current session role is different from the new login role, it blocks the login
3. You must either:
   - Logout from the current session first
   - Use a different browser
   - Use incognito/private window

---

## 🎯 Best Practices for Testing Multiple User Types

### Option 1: Different Browsers (Recommended)
Use different browsers for different user types:
- **Chrome** → Super Admin
- **Firefox** → Customer
- **Edge** → Business Owner

### Option 2: Incognito/Private Windows
Open incognito/private windows for each user type:
- **Regular Window** → Super Admin
- **Incognito Window 1** → Customer
- **Incognito Window 2** → Business Owner

### Option 3: Different Browser Profiles
Create separate browser profiles:
- **Profile 1** → Super Admin
- **Profile 2** → Customer
- **Profile 3** → Business Owner

### Option 4: Logout Between Switches
If using same browser:
1. Logout from current account
2. Login with different account
3. Test functionality
4. Logout again
5. Repeat

---

## 🔒 Session Isolation by User Type

### Super Admin Session
```javascript
{
  userId: "...",
  userEmail: "admin@servicehub.com",
  userName: "Super Admin",
  userRole: "super_admin",
  isAdmin: true,
  adminAccessGranted: true,
  isPermanentAccess: true
}
```

### Customer Session
```javascript
{
  userId: "...",
  userEmail: "customer@example.com",
  userName: "Customer Name",
  userRole: "customer",
  currentMode: "customer"
}
```

### Business Owner Session
```javascript
{
  userId: "...",
  userEmail: "owner@business.com",
  userName: "Owner Name",
  userRole: "business_owner",
  currentMode: "business"
}
```

---

## 🚨 What Happens If You Try to Mix Sessions

### Scenario 1: Admin → Customer
1. Login as Super Admin in Tab 1
2. Try to login as Customer in Tab 2
3. **Result:** Error message, login blocked
4. **Solution:** Use different browser or logout first

### Scenario 2: Customer → Admin
1. Login as Customer in Tab 1
2. Try to login as Super Admin in Tab 2
3. **Result:** Error message, login blocked
4. **Solution:** Use different browser or logout first

### Scenario 3: Customer → Business Mode
1. Login as Customer
2. Switch to Business Mode (same user)
3. **Result:** ✅ Works! (Same user, different mode)

---

## 📋 Testing Workflow

### For Development Testing
```bash
# Terminal 1: Start server
npm start

# Browser 1 (Chrome): Super Admin
http://localhost:3000/admin/secure-access?token=sa_7f8e9d2c4b6a1e5f3d8c9b4a7e6f2d1c8b5a4e3f2d1c9b8a7e6f5d4c3b2a1e0f

# Browser 2 (Firefox): Customer
http://localhost:3000/login
Email: alphi.fidelino@lspu.edu.ph
Password: alphi112411123

# Browser 3 (Edge): Business Owner
http://localhost:3000/business-owner/login
Email: owner@business.com
Password: password123
```

### For Production Testing
Same approach, but use production URLs:
- Super Admin: `https://your-app.vercel.app/admin/secure-access?token=...`
- Customer: `https://your-app.vercel.app/login`
- Business Owner: `https://your-app.vercel.app/business-owner/login`

---

## 🛠️ Technical Implementation

### Files Modified
1. **controllers/auth.js** - Added session conflict check for customer login
2. **controllers/superAdminAuth.js** - Added session conflict check for admin login

### Code Added
```javascript
// Check if there's already an active session with different role
if (req.session.userId && req.session.userRole !== user.role) {
    console.log('⚠️ Session conflict detected!');
    return res.render('login', { 
        error: 'You are already logged in with a different account type. Please use a different browser or incognito window, or logout first.', 
        success: null 
    });
}
```

---

## 💡 Why Not Allow Multiple Sessions?

### Security Reasons
- Prevents accidental data leakage between user types
- Ensures clear separation of privileges
- Reduces risk of unauthorized access

### User Experience
- Prevents confusion about which account is active
- Makes it clear when switching between user types
- Encourages proper session management

### Technical Reasons
- Browser sessions are shared by design
- Overwriting sessions can cause data loss
- Prevents race conditions in session updates

---

## 🎉 Summary

**Problem:** Sessions were being overwritten when logging in with different user types in the same browser.

**Solution:** System now detects and blocks login attempts when there's already an active session with a different user type.

**Best Practice:** Use different browsers or incognito windows for testing different user types simultaneously.

**Result:** Clean session isolation, no more unexpected session overwrites! 🔐
