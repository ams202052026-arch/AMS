# Authentication System - Multi-Business Platform

## 📋 Overview

The authentication system supports three user roles with role-based access control (RBAC).

---

## 👥 User Roles

### 1. Customer
- **Purpose:** Book services from businesses
- **Login:** `/login`
- **Signup:** `/signUp`
- **Dashboard:** `/home`

### 2. Business Owner
- **Purpose:** Manage business and services
- **Registration:** `/business-owner/register`
- **Login:** `/login`
- **Dashboard:** `/business/dashboard`

### 3. Super Admin
- **Purpose:** Manage platform and verify businesses
- **Login:** `/admin/login`
- **Dashboard:** `/admin/dashboard`

---

## 🔐 Authentication Flow

### Customer Login Flow

```
1. User visits /login
   ↓
2. Enters email and password
   ↓
3. System checks:
   - User exists?
   - Email verified?
   - Account active?
   - Account not banned?
   - Account not locked?
   - Password correct?
   ↓
4. If all checks pass:
   - Set session (userId, userRole, userName, userEmail)
   - Update lastLogin
   - Reset login attempts
   - Redirect to /home
   ↓
5. If checks fail:
   - Show error message
   - Increment login attempts (if password wrong)
   - Lock account after 5 failed attempts
```

### Business Owner Registration Flow

```
1. User visits /business-owner/register
   ↓
2. Fills registration form:
   - Personal info (name, email, password, phone)
   - Business info (name, type, description, contact)
   - Address (street, barangay, city, province)
   ↓
3. System validates:
   - All required fields filled?
   - Email not already registered?
   - Business name not already taken?
   - Password matches confirmation?
   ↓
4. System creates:
   - User account (role: business_owner, isVerified: false)
   - Business record (verificationStatus: pending)
   - Links business to user
   ↓
5. Redirect to /business-owner/upload-documents
   ↓
6. Upload verification documents:
   - DTI Certificate
   - Business Permit
   - Valid ID
   - BIR Registration
   ↓
7. Show success message:
   "Your application is pending admin approval"
   ↓
8. Super admin reviews and approves/rejects
   ↓
9. If approved:
   - Business owner can login
   - Can post services
```

### Super Admin Login Flow

```
1. User visits /admin/login
   ↓
2. Enters email and password
   ↓
3. System checks:
   - User exists with role 'super_admin'?
   - Account not locked?
   - Password correct?
   ↓
4. If all checks pass:
   - Set session (userId, userRole, isAdmin)
   - Update lastLogin
   - Redirect to /admin/dashboard
```

---

## 🛡️ Middleware

### Authentication Middleware (`middleware/auth.js`)

#### 1. `isAuthenticated`
- Checks if user is logged in (any role)
- Redirects to `/login` if not authenticated

```javascript
router.get('/profile', isAuthenticated, profileController.show);
```

#### 2. `isCustomer`
- Checks if user is a customer
- Redirects to `/login` if not

```javascript
router.post('/booking', isCustomer, bookingController.create);
```

#### 3. `isBusinessOwner`
- Checks if user is a business owner
- Redirects to `/login` if not

```javascript
router.get('/business/services', isBusinessOwner, serviceController.list);
```

#### 4. `isSuperAdmin`
- Checks if user is a super admin
- Redirects to `/admin/login` if not

```javascript
router.get('/admin/dashboard', isSuperAdmin, adminController.dashboard);
```

#### 5. `isBusinessOwnerOrAdmin`
- Checks if user is business owner OR super admin
- Useful for shared resources

```javascript
router.get('/business/:id', isBusinessOwnerOrAdmin, businessController.show);
```

#### 6. `ownsBusinessResource`
- Checks if business owner owns the business
- Use after `isBusinessOwner`

```javascript
router.put('/business/:businessId/services', 
    isBusinessOwner, 
    ownsBusinessResource, 
    serviceController.update
);
```

#### 7. `redirectIfAuthenticated`
- Redirects authenticated users away from login/signup
- Use on login and signup routes

```javascript
router.get('/login', redirectIfAuthenticated, authController.loadLoginPage);
```

#### 8. `checkAccountStatus`
- Checks if account is active, not banned, not locked
- Use on protected routes

```javascript
router.get('/home', isCustomer, checkAccountStatus, homeController.show);
```

#### 9. `attachUserData`
- Attaches user object to request and response locals
- Makes user data available in controllers and views

```javascript
router.use(attachUserData); // Apply to all routes
```

---

## 📁 Controllers

### 1. Auth Controller (`controllers/auth.js`)

Handles general authentication for customers and business owners.

**Methods:**
- `loadLoginPage()` - Show login form
- `login()` - Process login
- `loadSignUpPage()` - Show signup form
- `storeCustomerData()` - Create customer account (after OTP)
- `logout()` - Destroy session
- `redirectToHome()` - Redirect based on role

### 2. Business Owner Auth Controller (`controllers/businessOwnerAuth.js`)

Handles business owner registration.

**Methods:**
- `loadRegistrationPage()` - Show registration form
- `register()` - Process registration
- `loadDocumentUploadPage()` - Show document upload form
- `uploadDocuments()` - Process document upload
- `skipDocumentUpload()` - Skip documents (for testing)
- `verifyEmail()` - Verify email from link

### 3. Super Admin Auth Controller (`controllers/superAdminAuth.js`)

Handles super admin authentication.

**Methods:**
- `loadLoginPage()` - Show admin login form
- `login()` - Process admin login
- `logout()` - Destroy admin session
- `createInitialSuperAdmin()` - Create first super admin (setup only)

---

## 🔑 Session Structure

### Customer Session
```javascript
{
  userId: ObjectId,
  userEmail: "customer@example.com",
  userName: "John Doe",
  userRole: "customer"
}
```

### Business Owner Session
```javascript
{
  userId: ObjectId,
  userEmail: "owner@business.com",
  userName: "Jane Smith",
  userRole: "business_owner"
}
```

### Super Admin Session
```javascript
{
  userId: ObjectId,
  userEmail: "admin@servicehub.com",
  userName: "Super Admin",
  userRole: "super_admin",
  isAdmin: true // For backward compatibility
}
```

---

## 🚦 Route Protection Examples

### Customer Routes
```javascript
const { isCustomer, checkAccountStatus, attachUserData } = require('./middleware/auth');

// Home page (customer only)
router.get('/home', isCustomer, checkAccountStatus, attachUserData, homeController.show);

// Booking (customer only)
router.post('/booking', isCustomer, bookingController.create);

// Profile (customer only)
router.get('/profile', isCustomer, profileController.show);
```

### Business Owner Routes
```javascript
const { isBusinessOwner, ownsBusinessResource, attachUserData } = require('./middleware/auth');

// Business dashboard
router.get('/business/dashboard', isBusinessOwner, attachUserData, dashboardController.show);

// Manage services
router.get('/business/services', isBusinessOwner, serviceController.list);
router.post('/business/services', isBusinessOwner, serviceController.create);

// Update specific service (must own the business)
router.put('/business/:businessId/services/:serviceId', 
    isBusinessOwner, 
    ownsBusinessResource, 
    serviceController.update
);
```

### Super Admin Routes
```javascript
const { isSuperAdmin, attachUserData } = require('./middleware/auth');

// Admin dashboard
router.get('/admin/dashboard', isSuperAdmin, attachUserData, adminController.dashboard);

// Business verification
router.get('/admin/businesses/pending', isSuperAdmin, businessController.pending);
router.post('/admin/businesses/:id/approve', isSuperAdmin, businessController.approve);
router.post('/admin/businesses/:id/reject', isSuperAdmin, businessController.reject);
```

### Public Routes
```javascript
const { redirectIfAuthenticated } = require('./middleware/auth');

// Login (redirect if already logged in)
router.get('/login', redirectIfAuthenticated, authController.loadLoginPage);
router.post('/login', authController.login);

// Signup (redirect if already logged in)
router.get('/signUp', redirectIfAuthenticated, authController.loadSignUpPage);

// Landing page (public)
router.get('/', landingPageController.show);
```

---

## 🔒 Security Features

### 1. Account Locking
- After 5 failed login attempts
- Account locked for 2 hours
- Automatic unlock after timeout

### 2. Password Requirements
- Minimum 6 characters (increase in production)
- TODO: Add complexity requirements (uppercase, numbers, symbols)
- TODO: Implement bcrypt hashing

### 3. Email Verification
- Required for customers and business owners
- Not required for super admins
- Verification token expires after 24 hours

### 4. Account Status Checks
- `isActive` - Account can be deactivated by admin
- `isBanned` - Account can be banned with reason
- `isLocked` - Temporary lock after failed attempts

### 5. Session Security
- Session stored server-side
- Session expires after inactivity
- Secure session cookies (in production)

---

## 📝 TODO: Production Security

### High Priority
- [ ] Implement bcrypt password hashing
- [ ] Add CSRF protection
- [ ] Implement rate limiting
- [ ] Add email verification service
- [ ] Secure session cookies (httpOnly, secure, sameSite)
- [ ] Add password strength requirements
- [ ] Implement 2FA for super admin

### Medium Priority
- [ ] Add password reset functionality
- [ ] Implement "Remember Me" feature
- [ ] Add login history tracking
- [ ] Implement IP-based blocking
- [ ] Add device fingerprinting

### Low Priority
- [ ] Add OAuth login (Google, Facebook)
- [ ] Implement SSO for businesses
- [ ] Add biometric authentication
- [ ] Implement session management dashboard

---

## 🧪 Testing

### Create Test Accounts

#### Create Super Admin
```bash
# Visit: http://localhost:3000/admin/setup
# Or use API:
POST /admin/setup
# Creates: admin@servicehub.com / admin123
```

#### Create Customer
```bash
# Visit: http://localhost:3000/signUp
# Fill form and verify OTP
```

#### Create Business Owner
```bash
# Visit: http://localhost:3000/business-owner/register
# Fill form and upload documents
# Wait for admin approval
```

### Test Login Flows

#### Test Customer Login
```
1. Go to /login
2. Enter customer email and password
3. Should redirect to /home
```

#### Test Business Owner Login (Before Approval)
```
1. Go to /login
2. Enter business owner email and password
3. Should show "Please verify your email first"
```

#### Test Business Owner Login (After Approval)
```
1. Super admin approves business
2. Go to /login
3. Enter business owner email and password
4. Should redirect to /business/dashboard
```

#### Test Super Admin Login
```
1. Go to /admin/login
2. Enter admin email and password
3. Should redirect to /admin/dashboard
```

#### Test Account Locking
```
1. Go to /login
2. Enter correct email but wrong password 5 times
3. Should show "Account temporarily locked"
4. Wait 2 hours or manually unlock in database
```

---

## 🔄 Migration Notes

### Updating Existing Controllers

After running the migration script, update controllers to use User model:

**Before:**
```javascript
const Customer = require('../models/customer');
const customer = await Customer.findById(req.session.customerId);
```

**After:**
```javascript
const User = require('../models/user');
const user = await User.findById(req.session.userId);
```

### Updating Session Variables

**Before:**
```javascript
req.session.customerId
req.session.customerEmail
req.session.customerName
```

**After:**
```javascript
req.session.userId
req.session.userEmail
req.session.userName
req.session.userRole // NEW
```

---

## 📞 Support

For authentication issues:
1. Check session is set correctly
2. Verify user role matches route requirements
3. Check account status (active, not banned, not locked)
4. Review middleware order in routes

---

**Last Updated:** December 21, 2024
