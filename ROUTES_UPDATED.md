# Routes Updated - Multi-Business Platform

## ✅ Routes Migration Complete

All routes have been updated to use the new role-based authentication system.

---

## 🗺️ Route Structure

### Public Routes (No Authentication)

| Route | Method | Controller | Description |
|-------|--------|------------|-------------|
| `/` | GET | landingPage | Landing page |
| `/login` | GET | auth | Login form |
| `/login` | POST | auth | Process login |
| `/signUp` | GET | auth | Signup form |
| `/logout` | GET | auth | Logout |
| `/forgot-password` | GET/POST | forgotPassword | Password reset |
| `/verifyOtp` | GET/POST | otp | OTP verification |

### Business Owner Routes

| Route | Method | Middleware | Description |
|-------|--------|------------|-------------|
| `/business-owner/register` | GET | redirectIfAuthenticated | Registration form |
| `/business-owner/register` | POST | - | Process registration |
| `/business-owner/upload-documents` | GET | - | Document upload form |
| `/business-owner/upload-documents` | POST | - | Process documents |
| `/business-owner/skip-documents` | POST | - | Skip documents (testing) |
| `/business-owner/verify-email/:token` | GET | - | Email verification |

### Customer Routes

All customer routes require `isCustomer` + `checkAccountStatus` middleware.

| Route | Method | Description |
|-------|--------|-------------|
| `/home` | GET | Customer dashboard |
| `/appointments` | GET | View appointments |
| `/appointments/book/:serviceId` | GET | Booking form |
| `/appointments/book` | POST | Create booking |
| `/appointments/:id/cancel` | POST | Cancel appointment |
| `/appointments/:id/reschedule` | POST | Request reschedule |
| `/profile` | GET | View profile |
| `/profile/change-password` | POST | Change password |
| `/profile/delete` | POST | Delete account |
| `/rewards` | GET | View rewards |
| `/rewards/redeem/:id` | POST | Redeem reward |
| `/history` | GET | Booking history |
| `/history/:id/delete` | POST | Delete history item |
| `/history/clear-all` | POST | Clear all history |
| `/notifications` | GET | View notifications |

### Super Admin Routes

All admin routes require `isSuperAdmin` middleware.

| Route | Method | Description |
|-------|--------|-------------|
| `/admin/login` | GET | Admin login form |
| `/admin/login` | POST | Process admin login |
| `/admin/logout` | GET | Admin logout |
| `/admin/setup` | POST | Create initial super admin |
| `/admin/dashboard` | GET | Admin dashboard |
| `/admin/appointments` | GET | Manage appointments |
| `/admin/appointments/:id/approve` | POST | Approve appointment |
| `/admin/appointments/:id/cancel` | POST | Cancel appointment |
| `/admin/appointments/:id/complete` | POST | Complete appointment |
| `/admin/appointments/:id/delete` | POST | Delete appointment |
| `/admin/appointments/:id/assign-staff` | POST | Assign staff |
| `/admin/appointments/walk-in` | POST | Add walk-in |
| `/admin/services` | GET | Manage services |
| `/admin/services/add` | GET/POST | Add service |
| `/admin/services/:id/edit` | GET/POST | Edit service |
| `/admin/services/:id/deactivate` | POST | Deactivate service |
| `/admin/staff` | GET | Manage staff |
| `/admin/staff/add` | GET/POST | Add staff |
| `/admin/staff/:id/edit` | GET/POST | Edit staff |
| `/admin/staff/:id/deactivate` | POST | Deactivate staff |
| `/admin/staff/:id/delete` | POST | Delete staff |
| `/admin/queue` | GET | View queue |
| `/admin/queue/:id/start` | POST | Start serving |
| `/admin/queue/reorder` | POST | Reorder queue |
| `/admin/reports` | GET | View reports |
| `/admin/reports/export` | GET | Export report |
| `/admin/rewards` | GET | Manage rewards |
| `/admin/rewards/add` | GET/POST | Add reward |
| `/admin/rewards/:id/edit` | GET/POST | Edit reward |
| `/admin/rewards/:id/deactivate` | POST | Deactivate reward |
| `/admin/rewards/redemptions` | GET | View redemptions |
| `/admin/settings` | GET | Admin settings |
| `/admin/settings/profile` | POST | Update profile |
| `/admin/settings/change-password` | POST | Change password |

---

## 🔄 Changes Made

### New Route Files Created

1. **`routes/auth.js`**
   - Handles login/logout for all user types
   - Uses `redirectIfAuthenticated` middleware
   - Role-based redirect after login

2. **`routes/businessOwner.js`**
   - Business owner registration
   - Document upload
   - Email verification

3. **`routes/admin/auth.js`**
   - Super admin authentication
   - Initial setup endpoint

### Updated Route Files

1. **`routes/home.js`**
   - Changed: `checkSession` → `isCustomer, checkAccountStatus, attachUserData`

2. **`routes/appointments.js`**
   - Changed: `checkSession` → `isCustomer, checkAccountStatus, attachUserData`

3. **`routes/profile.js`**
   - Changed: `checkSession` → `isCustomer, checkAccountStatus, attachUserData`

4. **`routes/rewards.js`**
   - Changed: `checkSession` → `isCustomer, checkAccountStatus, attachUserData`

5. **`routes/history.js`**
   - Changed: `checkSession` → `isCustomer, checkAccountStatus, attachUserData`

6. **`routes/notifications.js`**
   - Changed: `checkSession` → `isCustomer, checkAccountStatus, attachUserData`

7. **`routes/admin/index.js`**
   - Changed: `checkAdminSession` → `isSuperAdmin, attachUserData`
   - Updated auth controller to use `superAdminAuth`
   - Added `/admin/setup` endpoint

### Updated Server.js

1. **Added Global Middleware**
   ```javascript
   app.use(attachUserData); // Makes user data available everywhere
   ```

2. **Added New Routes**
   ```javascript
   app.use('/', authRoutes);
   app.use('/business-owner', businessOwnerRoutes);
   ```

3. **Renamed Old Routes** (for backward compatibility)
   ```javascript
   app.use('/login-old', loginRoutes);
   app.use('/logout-old', logoutRoutes);
   ```

---

## 🛡️ Middleware Applied

### Customer Routes
```javascript
isCustomer + checkAccountStatus + attachUserData
```
- Ensures user is logged in as customer
- Checks account is active, not banned, not locked
- Attaches user data to request and views

### Business Owner Routes
```javascript
isBusinessOwner + attachUserData
```
- Ensures user is logged in as business owner
- Attaches user and business data

### Super Admin Routes
```javascript
isSuperAdmin + attachUserData
```
- Ensures user is logged in as super admin
- Attaches user data

### Public Routes
```javascript
redirectIfAuthenticated (on login/signup only)
```
- Redirects logged-in users to their dashboard
- Prevents accessing login when already logged in

---

## 🔑 Session Variables

### Old Session (Deprecated)
```javascript
req.session.customerId
req.session.customerEmail
req.session.customerName
req.session.isAdmin
```

### New Session (Current)
```javascript
req.session.userId
req.session.userEmail
req.session.userName
req.session.userRole // 'customer', 'business_owner', 'super_admin'
req.session.isAdmin // Kept for backward compatibility
```

---

## 🚦 Login Flow by Role

### Customer Login
```
POST /login
  ↓
Check credentials
  ↓
Set session (userId, userRole: 'customer')
  ↓
Redirect to /home
```

### Business Owner Login
```
POST /login
  ↓
Check credentials
  ↓
Check if verified and approved
  ↓
Set session (userId, userRole: 'business_owner')
  ↓
Redirect to /business/dashboard
```

### Super Admin Login
```
POST /admin/login
  ↓
Check credentials (role must be 'super_admin')
  ↓
Set session (userId, userRole: 'super_admin', isAdmin: true)
  ↓
Redirect to /admin/dashboard
```

---

## 📝 Next Steps

### 1. Update Controllers

Controllers still need to be updated to use the new User model:

**Files to Update:**
- `controllers/home.js`
- `controllers/appointments.js`
- `controllers/profile.js`
- `controllers/rewards.js`
- `controllers/history.js`
- `controllers/notifications.js`
- All admin controllers

**Changes Needed:**
```javascript
// OLD
const Customer = require('../models/customer');
const customer = await Customer.findById(req.session.customerId);

// NEW
const User = require('../models/user');
const user = await User.findById(req.session.userId);
```

### 2. Create Views

New views needed:
- `views/businessOwner/register.ejs`
- `views/businessOwner/uploadDocuments.ejs`
- `views/businessOwner/registrationSuccess.ejs`
- `views/businessOwner/verificationResult.ejs`
- `views/businessOwner/dashboard.ejs`

### 3. Update Existing Views

Views need to use new session variables:
- Replace `customerName` with `userName`
- Replace `customerId` with `userId`
- Add role-based navigation

### 4. Run Migration

After controllers and views are updated:
1. Backup database
2. Run migration script
3. Test all routes
4. Verify authentication works

---

## 🧪 Testing Routes

### Test Customer Routes
```bash
# Login as customer
POST /login
{ email: "customer@example.com", password: "password" }

# Should redirect to /home
# Try accessing /admin/dashboard - should redirect to /login
```

### Test Business Owner Routes
```bash
# Register as business owner
POST /business-owner/register
{ ...registration data... }

# Should redirect to /business-owner/upload-documents
# After approval, login should redirect to /business/dashboard
```

### Test Super Admin Routes
```bash
# Create initial super admin
POST /admin/setup

# Login as super admin
POST /admin/login
{ email: "admin@servicehub.com", password: "admin123" }

# Should redirect to /admin/dashboard
```

### Test Redirects
```bash
# When logged in as customer, visit /login
# Should redirect to /home

# When logged in as admin, visit /login
# Should redirect to /admin/dashboard
```

---

## ⚠️ Important Notes

### Backward Compatibility

Old routes are temporarily available:
- `/login-old` - Old customer login
- `/logout-old` - Old logout

These should be removed after migration is complete.

### Session Compatibility

The new system maintains `req.session.isAdmin` for backward compatibility with existing admin views. This can be removed once all views are updated.

### OTP Flow

The signup OTP flow still uses the old routes. After OTP verification, it creates a User with role 'customer'.

---

## 📞 Troubleshooting

### Issue: "Cannot access /home"
**Solution:** Make sure you're logged in as a customer. Check `req.session.userRole === 'customer'`.

### Issue: "Redirected to /login from /admin/dashboard"
**Solution:** Make sure you're logged in as super admin. Check `req.session.userRole === 'super_admin'`.

### Issue: "User data not available in views"
**Solution:** Make sure `attachUserData` middleware is applied. Check `res.locals.user`.

### Issue: "Session not persisting"
**Solution:** Check session configuration in server.js. Ensure session secret is set.

---

**Last Updated:** December 21, 2024  
**Status:** ✅ Routes Updated - Ready for Controller Updates
