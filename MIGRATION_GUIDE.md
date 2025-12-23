# Migration Guide: Single to Multi-Business Platform

## 📋 Overview

This guide will help you migrate your existing single-business booking system to a multi-business marketplace platform.

---

## ⚠️ IMPORTANT: Before You Start

### 1. Backup Your Database

**CRITICAL:** Always backup your database before running any migration!

```bash
# MongoDB backup command
mongodump --db=your_database_name --out=./backup_$(date +%Y%m%d)

# Example:
mongodump --db=booking-system --out=./backup_20241221
```

### 2. Test on Development First

- Run migration on a development/staging environment first
- Verify everything works correctly
- Only then run on production

### 3. Maintenance Mode

- Put your application in maintenance mode
- Inform users about the upgrade
- Ensure no active bookings during migration

---

## 🗂️ What Changed

### New Models Created

1. **User Model** (`models/user.js`)
   - Unified model for all users (customers, business owners, super admins)
   - Replaces separate Customer and Admin models

2. **Business Model** (`models/business.js`)
   - Represents service provider businesses
   - Contains verification status, documents, and business info

3. **Review Model** (`models/review.js`)
   - Customer reviews for businesses and services

### Updated Models

1. **Service Model** (`models/service.js`)
   - Added `businessId` field
   - Links services to specific businesses

2. **Appointment Model** (`models/appointment.js`)
   - Added `businessId` field
   - Links appointments to specific businesses

### Old Models (Will be deprecated)

- `models/customer.js` → Migrated to `models/user.js`
- `models/admin.js` → Migrated to `models/user.js`

---

## 🚀 Migration Steps

### Step 1: Install Dependencies (if needed)

```bash
npm install
```

### Step 2: Backup Database

```bash
mongodump --db=your_database_name --out=./backup
```

### Step 3: Run Migration Script

```bash
node scripts/migrate-to-multi-business.js
```

### Step 4: Verify Migration

The script will output a summary. Check that:
- ✅ All customers were migrated
- ✅ All admins were migrated
- ✅ Default business was created
- ✅ All services are linked to business
- ✅ All appointments are linked to business

---

## 📊 What the Migration Does

### 1. Customer Migration

**Before:**
```javascript
// Customer Model
{
  _id: "...",
  name: "Juan Dela Cruz",
  email: "juan@example.com",
  password: "...",
  rewardPoints: 100
}
```

**After:**
```javascript
// User Model (role: customer)
{
  _id: "...", // Same ID preserved
  firstName: "Juan",
  lastName: "Dela Cruz",
  email: "juan@example.com",
  password: "...", // Same password preserved
  role: "customer",
  rewardPoints: 100
}
```

### 2. Admin Migration

**Before:**
```javascript
// Admin Model
{
  _id: "...",
  username: "admin",
  email: "admin@example.com",
  password: "...",
  role: "super_admin"
}
```

**After:**
```javascript
// User Model (role: super_admin)
{
  _id: "...", // Same ID preserved
  firstName: "admin",
  lastName: "Admin",
  email: "admin@example.com",
  password: "...", // Same password preserved
  role: "super_admin"
}
```

### 3. Business Creation

A default "Legacy Services" business is created:

```javascript
{
  businessName: "Legacy Services",
  ownerId: "<first_admin_id>",
  verificationStatus: "approved",
  totalServices: <count_of_existing_services>,
  totalBookings: <count_of_existing_appointments>
}
```

### 4. Service Linking

All existing services are linked to the default business:

```javascript
// Before
{
  _id: "...",
  name: "Haircut",
  price: 150
}

// After
{
  _id: "...",
  name: "Haircut",
  price: 150,
  businessId: "<legacy_business_id>" // NEW
}
```

### 5. Appointment Linking

All existing appointments are linked to the default business:

```javascript
// Before
{
  _id: "...",
  customer: "...",
  service: "...",
  date: "..."
}

// After
{
  _id: "...",
  customer: "...",
  service: "...",
  date: "...",
  businessId: "<legacy_business_id>" // NEW
}
```

---

## 🔍 Post-Migration Verification

### 1. Check User Collection

```javascript
// In MongoDB shell or Compass
db.users.find({}).pretty()

// Should see:
// - All customers with role: "customer"
// - All admins with role: "super_admin"
```

### 2. Check Business Collection

```javascript
db.businesses.find({}).pretty()

// Should see:
// - One "Legacy Services" business
// - Status: "approved"
```

### 3. Check Services

```javascript
db.services.find({}).pretty()

// All services should have businessId field
```

### 4. Check Appointments

```javascript
db.appointments.find({}).pretty()

// All appointments should have businessId field
```

---

## 🔄 Rollback (If Needed)

If something goes wrong, you can restore from backup:

```bash
# Stop your application first
# Then restore from backup
mongorestore --db=your_database_name ./backup/your_database_name

# Example:
mongorestore --db=booking-system ./backup_20241221/booking-system
```

---

## 📝 Next Steps After Migration

### 1. Update Authentication

- [ ] Update login controller to use User model
- [ ] Update signup controller to use User model
- [ ] Update session management for roles

### 2. Create New Controllers

- [ ] Business owner registration controller
- [ ] Business management controller
- [ ] Super admin dashboard controller

### 3. Update Existing Controllers

- [ ] Update service controller to check business ownership
- [ ] Update appointment controller to include business info
- [ ] Update profile controller to handle different roles

### 4. Create New Views

- [ ] Business owner registration page
- [ ] Business owner dashboard
- [ ] Super admin dashboard
- [ ] Business verification page
- [ ] Multi-business service browsing

### 5. Update Existing Views

- [ ] Update home page to show multiple businesses
- [ ] Update service listing to show business info
- [ ] Update booking flow to include business selection

---

## 🐛 Troubleshooting

### Issue: "Duplicate key error"

**Cause:** User with same email already exists

**Solution:**
```javascript
// Check for duplicates
db.users.aggregate([
  { $group: { _id: "$email", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])

// Remove duplicates manually if needed
```

### Issue: "businessId is required"

**Cause:** Some services/appointments weren't updated

**Solution:**
```javascript
// Manually update missing businessId
const defaultBusinessId = db.businesses.findOne({ businessName: "Legacy Services" })._id;

db.services.updateMany(
  { businessId: { $exists: false } },
  { $set: { businessId: defaultBusinessId } }
);

db.appointments.updateMany(
  { businessId: { $exists: false } },
  { $set: { businessId: defaultBusinessId } }
);
```

### Issue: Migration script fails midway

**Cause:** Database connection or validation error

**Solution:**
1. Check error message carefully
2. Restore from backup
3. Fix the issue
4. Run migration again

---

## 📞 Support

If you encounter issues:

1. Check the error logs
2. Verify your database backup exists
3. Review this guide carefully
4. Check the SYSTEM_REDESIGN.md for architecture details

---

## ✅ Migration Checklist

Before migration:
- [ ] Database backed up
- [ ] Tested on development environment
- [ ] Application in maintenance mode
- [ ] Users notified of upgrade

During migration:
- [ ] Migration script completed successfully
- [ ] No errors in console output
- [ ] Summary shows correct counts

After migration:
- [ ] Verified users collection
- [ ] Verified businesses collection
- [ ] Verified services have businessId
- [ ] Verified appointments have businessId
- [ ] Tested login with existing accounts
- [ ] Tested basic functionality

---

**Last Updated:** December 21, 2024
