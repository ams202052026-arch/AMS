# 👤 Profile & Account Management Feature

## Overview
Complete account ownership control system allowing customers to manage their profile, change password, and delete their account.

## Features Implemented

### 1. Profile Information Management
- **View Profile**: Name, email, phone, reward points
- **Edit Profile**: Update name and phone number
- **Email Protection**: Email cannot be changed (used for login)

### 2. Change Password
- **Current Password Verification**: Must enter current password
- **New Password Requirements**: Minimum 6 characters
- **Confirmation**: Must match new password twice
- **Security**: Passwords are hashed using bcrypt

### 3. Delete Account
- **Two-Factor Confirmation**:
  1. Enter password
  2. Type "DELETE" to confirm
- **Data Cleanup**: Automatically deletes:
  - All appointments
  - All notifications
  - All reward redemptions
  - Customer account
- **Session Destruction**: Logs out immediately after deletion
- **No Recovery**: Permanent deletion with clear warnings

## Routes

### Customer Routes
- `GET /profile` - View profile page
- `POST /profile/update` - Update profile information
- `POST /profile/change-password` - Change password
- `POST /profile/delete` - Delete account

## Security Features

### Password Change
✅ Requires current password verification
✅ Minimum 6 character requirement
✅ Password confirmation matching
✅ Bcrypt hashing (10 rounds)

### Account Deletion
✅ Password verification required
✅ Explicit confirmation text ("DELETE")
✅ Warning about data loss
✅ Complete data cleanup
✅ Session destruction

## User Interface

### Profile Page Sections
1. **Profile Information**
   - Name (editable)
   - Email (read-only)
   - Phone (editable)
   - Reward Points (read-only)

2. **Change Password**
   - Current password field
   - New password field
   - Confirm password field

3. **Danger Zone**
   - Delete account button
   - Warning messages
   - Confirmation modal

### Alerts
- ✅ Success messages (green)
- ❌ Error messages (red)
- Auto-hide after 5 seconds

### Confirmation Modal
- Shows what will be deleted
- Password input
- "DELETE" confirmation text
- Cancel and confirm buttons

## Usage

### For Customers

**Update Profile:**
1. Go to Profile page (navigation menu)
2. Edit name or phone
3. Click "Update Profile"

**Change Password:**
1. Go to Profile page
2. Scroll to "Change Password" section
3. Enter current password
4. Enter new password (min 6 chars)
5. Confirm new password
6. Click "Change Password"

**Delete Account:**
1. Go to Profile page
2. Scroll to "Danger Zone"
3. Click "Delete My Account"
4. Enter your password
5. Type "DELETE" in the confirmation field
6. Click "Yes, Delete My Account"
7. Account and all data will be permanently deleted

## Technical Details

### Controller: `controllers/profile.js`
- `loadProfile()` - Load profile page
- `updateProfile()` - Update name and phone
- `changePassword()` - Change password with verification
- `deleteAccount()` - Delete account and all related data

### Model Dependencies
- Customer
- Appointment
- Notification
- Redemption

### Middleware
- `checkSession` - Ensures user is logged in

### Password Hashing
```javascript
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 10);
const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
```

## Data Cleanup on Account Deletion

When an account is deleted, the following data is removed:
1. All appointments (past and future)
2. All notifications
3. All reward redemptions
4. Customer record

## Error Handling

### Change Password Errors
- "All password fields are required"
- "New passwords do not match"
- "New password must be at least 6 characters"
- "Current password is incorrect"

### Delete Account Errors
- "Please type DELETE to confirm"
- "Incorrect password"

## Future Enhancements

- Email change with verification
- Two-factor authentication
- Account recovery/reactivation (soft delete)
- Export account data before deletion
- Profile picture upload
- Email notifications for security changes
- Password strength indicator
- Login history

---

**Status:** ✅ FULLY IMPLEMENTED

The profile management system is complete with all security features and data cleanup!
