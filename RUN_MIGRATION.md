# 🚀 Running the Migration

## ⚠️ CRITICAL: Read This First!

This migration will transform your database from a single-business system to a multi-business marketplace. **This is a one-way operation.**

---

## 📋 Pre-Migration Checklist

### 1. Backup Your Database ✅ REQUIRED

**MongoDB Backup:**
```bash
# Create backup with timestamp
mongodump --db=booking-system --out=./backup_$(date +%Y%m%d_%H%M%S)

# Or if you have a custom database name:
mongodump --db=your_database_name --out=./backup_$(date +%Y%m%d_%H%M%S)
```

**Verify Backup:**
```bash
# Check backup folder exists and has data
ls -lh backup_*
```

### 2. Check Database Connection

Make sure your `.env` file has the correct MongoDB connection string:

```env
MONGODB_URI=mongodb://localhost:27017/booking-system
```

### 3. Stop Your Application

```bash
# Stop the server if it's running
# Press Ctrl+C in the terminal where server is running
```

### 4. Review What Will Change

**Collections That Will Be Modified:**
- ✅ `customers` → Data migrated to `users` collection
- ✅ `admins` → Data migrated to `users` collection
- ✅ `services` → `businessId` field added
- ✅ `appointments` → `businessId` field added

**New Collections Created:**
- ✅ `users` - Unified user collection
- ✅ `businesses` - Business information
- ✅ `reviews` - Customer reviews (empty initially)

**Collections Unchanged:**
- ✅ `rewards` - No changes
- ✅ `notifications` - No changes
- ✅ `staff` - No changes
- ✅ `otps` - No changes

---

## 🎯 Migration Steps

### Step 1: Backup Database

```bash
mongodump --db=booking-system --out=./backup_migration
```

**Expected Output:**
```
2024-12-21T10:00:00.000+0800    writing booking-system.customers to backup_migration/booking-system/customers.bson
2024-12-21T10:00:00.000+0800    done dumping booking-system.customers (X documents)
...
```

### Step 2: Run Migration Script

```bash
node scripts/migrate-to-multi-business.js
```

**Expected Output:**
```
✅ Connected to MongoDB

🚀 Starting migration to multi-business platform...

📋 Step 1: Migrating customers to users...
   Found X customers
   ✅ Migrated X customers to users

📋 Step 2: Migrating admins to users...
   Found X admins
   ✅ Migrated X admins to users

📋 Step 3: Creating default business for existing services...
   ✅ Created default business: Legacy Services (ID: ...)

📋 Step 4: Linking services to default business...
   Found X services
   ✅ Updated X services

📋 Step 5: Linking appointments to default business...
   Found X appointments
   ✅ Updated X appointments

📋 Step 6: Updating reward references...
   Found X reward records
   ℹ️  Reward model already uses customerId, no changes needed

============================================================
✅ MIGRATION COMPLETED SUCCESSFULLY!
============================================================

Migration Summary:
  • Customers migrated: X
  • Admins migrated: X
  • Default business created: Legacy Services
  • Services linked: X
  • Appointments linked: X
  • Reward records: X (no changes needed)

⚠️  IMPORTANT NEXT STEPS:
  1. Update authentication controllers to use User model
  2. Update session management for role-based access
  3. Create business owner registration flow
  4. Create super admin dashboard
  5. Update customer views to show multiple businesses

📝 Default Business Info:
  • Business ID: ...
  • Owner ID: ...
  • Status: approved
  • Total Services: X
  • Total Bookings: X

✅ You can now start building the multi-business features!

🔌 Database connection closed
```

### Step 3: Verify Migration

```bash
# Connect to MongoDB shell
mongosh booking-system

# Or if using mongo:
mongo booking-system
```

**Verification Commands:**

```javascript
// 1. Check users collection
db.users.countDocuments()
db.users.find().pretty()

// 2. Check businesses collection
db.businesses.countDocuments()
db.businesses.find().pretty()

// 3. Check services have businessId
db.services.findOne()

// 4. Check appointments have businessId
db.appointments.findOne()

// 5. Verify roles
db.users.distinct("role")
// Should return: ["customer", "super_admin"]
```

### Step 4: Create Initial Super Admin (if needed)

If no super admin was created during migration:

```bash
# Start your server
npm start

# In another terminal or browser:
curl -X POST http://localhost:3000/admin/setup
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Super admin created successfully",
  "email": "admin@servicehub.com",
  "note": "Please change the default password immediately"
}
```

**Default Super Admin Credentials:**
- Email: `admin@servicehub.com`
- Password: `admin123`

⚠️ **IMPORTANT:** Change this password immediately after first login!

### Step 5: Test the System

```bash
# Start your server
npm start
```

**Test Customer Login:**
1. Go to `http://localhost:3000/login`
2. Login with existing customer email and password
3. Should redirect to `/home`
4. Test booking, profile, rewards

**Test Super Admin Login:**
1. Go to `http://localhost:3000/admin/login`
2. Login with super admin credentials
3. Should redirect to `/admin/dashboard`
4. Test admin features

---

## 🔍 Troubleshooting

### Issue: "Cannot connect to MongoDB"

**Solution:**
```bash
# Check if MongoDB is running
mongosh

# Or start MongoDB service
# Windows:
net start MongoDB

# Mac:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod
```

### Issue: "Duplicate key error"

**Cause:** Email already exists in users collection

**Solution:**
```javascript
// Check for duplicates
db.users.aggregate([
  { $group: { _id: "$email", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])

// If found, restore from backup and fix data before re-running
```

### Issue: "Migration script fails midway"

**Solution:**
1. Check error message carefully
2. Restore from backup:
   ```bash
   mongorestore --db=booking-system ./backup_migration/booking-system
   ```
3. Fix the issue
4. Run migration again

### Issue: "Services don't have businessId"

**Solution:**
```javascript
// Manually add businessId to services
const defaultBusiness = db.businesses.findOne({ businessName: "Legacy Services" });
db.services.updateMany(
  { businessId: { $exists: false } },
  { $set: { businessId: defaultBusiness._id } }
);
```

### Issue: "Login not working after migration"

**Cause:** Session variables changed

**Solution:**
1. Clear browser cookies
2. Try logging in again
3. Check that controllers are using `req.session.userId` not `req.session.customerId`

---

## 🔄 Rollback (If Needed)

If something goes wrong and you need to rollback:

```bash
# Stop your application first
# Then restore from backup

mongorestore --drop --db=booking-system ./backup_migration/booking-system
```

**Note:** `--drop` will drop existing collections before restoring.

---

## ✅ Post-Migration Checklist

After successful migration:

- [ ] Verified users collection has all customers and admins
- [ ] Verified businesses collection has default business
- [ ] Verified services have businessId field
- [ ] Verified appointments have businessId field
- [ ] Created super admin account
- [ ] Tested customer login
- [ ] Tested super admin login
- [ ] Tested booking flow
- [ ] Tested profile page
- [ ] Tested rewards system
- [ ] Tested appointment history
- [ ] All features working correctly

---

## 📊 What Changed

### Database Structure

**Before Migration:**
```
Collections:
- customers (X documents)
- admins (X documents)
- services (X documents)
- appointments (X documents)
- rewards
- notifications
- staff
- otps
```

**After Migration:**
```
Collections:
- users (X documents) ← NEW (customers + admins)
- businesses (1 document) ← NEW (default business)
- services (X documents) ← UPDATED (added businessId)
- appointments (X documents) ← UPDATED (added businessId)
- reviews ← NEW (empty)
- rewards (unchanged)
- notifications (unchanged)
- staff (unchanged)
- otps (unchanged)

Deprecated (can be removed after verification):
- customers (old data, can delete)
- admins (old data, can delete)
```

### Session Variables

**Before:**
```javascript
req.session.customerId
req.session.customerEmail
req.session.customerName
req.session.isAdmin
```

**After:**
```javascript
req.session.userId
req.session.userEmail
req.session.userName
req.session.userRole // 'customer', 'business_owner', 'super_admin'
req.session.isAdmin // Kept for backward compatibility
```

---

## 🎯 Next Steps After Migration

1. **Test Everything** - Verify all features work
2. **Create Business Owner Views** - Build registration forms
3. **Build Super Admin Dashboard** - Business verification interface
4. **Update Customer Views** - Multi-business browsing
5. **Deploy to Production** - After thorough testing

---

## 📞 Need Help?

If you encounter issues:
1. Check the error message carefully
2. Review the troubleshooting section
3. Check the migration script logs
4. Restore from backup if needed
5. Review MIGRATION_GUIDE.md for details

---

**Ready to migrate?** Follow the steps above carefully!

**Last Updated:** December 21, 2024
