# SYSTEM REDESIGN: Multi-Business Service Booking Platform

## 🎯 System Overview

Ang platform na ito ay isang **marketplace** na nag-connect ng mga businesses sa customers. Hindi ito single-business booking system, kundi isang platform kung saan multiple businesses ay pwedeng mag-offer ng kanilang services.

### Platform Concept
**"ServiceHub"** - A marketplace platform connecting service businesses with customers

---

## 👥 User Types & Roles

### 1. Super Admin (Platform Administrator)
**Purpose:** Manages and maintains the platform integrity

**Responsibilities:**
- Validates and approves business owner applications
- Verifies business authenticity and requirements
- Reviews submitted business documents (DTI, permits, etc.)
- Monitors platform activity
- Manages platform-wide settings
- Handles disputes and issues
- Can suspend/deactivate businesses or users

**Access Level:** Full platform access

---

### 2. Business Owner (Service Provider)
**Purpose:** Offers services to customers through the platform

**Responsibilities:**
- Registers and applies for business verification
- Submits business requirements (DTI, Business Permit, Valid ID, etc.)
- Creates and manages their service listings
- Sets service prices, duration, and availability
- Manages their own bookings/appointments
- Responds to customer bookings
- Views their business analytics
- Manages their staff (optional feature)

**Access Level:** Own business dashboard and data only

**Business Verification Status:**
- `pending` - Application submitted, waiting for super admin review
- `approved` - Verified and can post services
- `rejected` - Application denied (with reason)
- `suspended` - Temporarily disabled by super admin

---

### 3. Customer (Service Consumer)
**Purpose:** Books services from various businesses

**Responsibilities:**
- Browses services from different businesses
- Views business profiles and ratings
- Books appointments with businesses
- Manages their bookings
- Leaves reviews and ratings
- Earns and uses rewards points
- Receives notifications

**Access Level:** Customer dashboard and booking history

---

## 🗄️ Database Schema Design

### New/Updated Models

#### 1. User Model (Updated)
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  role: String, // 'super_admin', 'business_owner', 'customer'
  firstName: String,
  lastName: String,
  phoneNumber: String,
  profilePicture: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. Business Model (NEW)
```javascript
{
  _id: ObjectId,
  ownerId: ObjectId, // Reference to User (business_owner)
  
  // Business Information
  businessName: String (required),
  businessType: String, // 'salon', 'spa', 'clinic', 'gym', etc.
  description: String,
  logo: String, // URL to logo image
  coverPhoto: String,
  
  // Contact Information
  email: String,
  phoneNumber: String,
  website: String,
  
  // Address
  address: {
    street: String,
    barangay: String,
    city: String,
    province: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Business Hours
  businessHours: [{
    day: String, // 'Monday', 'Tuesday', etc.
    isOpen: Boolean,
    openTime: String, // '09:00'
    closeTime: String // '18:00'
  }],
  
  // Verification
  verificationStatus: String, // 'pending', 'approved', 'rejected', 'suspended'
  verificationDocuments: [{
    type: String, // 'dti', 'business_permit', 'valid_id', 'bir'
    fileUrl: String,
    uploadedAt: Date
  }],
  rejectionReason: String,
  verifiedAt: Date,
  verifiedBy: ObjectId, // Reference to User (super_admin)
  
  // Statistics
  totalServices: Number,
  totalBookings: Number,
  averageRating: Number,
  totalReviews: Number,
  
  // Status
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. Service Model (Updated)
```javascript
{
  _id: ObjectId,
  businessId: ObjectId, // Reference to Business (NEW)
  
  serviceName: String,
  description: String,
  category: String, // 'haircut', 'massage', 'facial', etc.
  price: Number,
  duration: Number, // in minutes
  images: [String], // Array of image URLs
  
  // Availability
  isAvailable: Boolean,
  availableDays: [String], // ['Monday', 'Tuesday', ...]
  availableTimeSlots: [{
    startTime: String,
    endTime: String
  }],
  
  // Statistics
  totalBookings: Number,
  averageRating: Number,
  
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. Appointment Model (Updated)
```javascript
{
  _id: ObjectId,
  customerId: ObjectId, // Reference to User (customer)
  businessId: ObjectId, // Reference to Business (NEW)
  serviceId: ObjectId, // Reference to Service
  
  // Appointment Details
  appointmentDate: Date,
  appointmentTime: String,
  duration: Number,
  totalPrice: Number,
  
  // Status
  status: String, // 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'
  
  // Payment
  paymentMethod: String, // 'cash', 'gcash', 'card'
  paymentStatus: String, // 'pending', 'paid', 'refunded'
  
  // Rewards
  rewardsPointsEarned: Number,
  rewardsPointsUsed: Number,
  
  // Notes
  customerNotes: String,
  businessNotes: String,
  cancellationReason: String,
  
  // Timestamps
  confirmedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### 5. Review Model (NEW)
```javascript
{
  _id: ObjectId,
  customerId: ObjectId, // Reference to User
  businessId: ObjectId, // Reference to Business
  serviceId: ObjectId, // Reference to Service
  appointmentId: ObjectId, // Reference to Appointment
  
  rating: Number, // 1-5
  comment: String,
  images: [String], // Optional photos
  
  // Business Response
  businessResponse: String,
  respondedAt: Date,
  
  isVisible: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### 6. Notification Model (Updated)
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Can be customer, business_owner, or super_admin
  userRole: String, // 'customer', 'business_owner', 'super_admin'
  
  type: String, // 'booking', 'verification', 'review', 'system'
  title: String,
  message: String,
  
  // Related Data
  relatedId: ObjectId, // Can be appointmentId, businessId, etc.
  relatedType: String, // 'appointment', 'business', 'review'
  
  isRead: Boolean,
  createdAt: Date
}
```

#### 7. Reward Model (Updated)
```javascript
{
  _id: ObjectId,
  customerId: ObjectId, // Reference to User
  
  totalPoints: Number,
  lifetimePoints: Number,
  
  transactions: [{
    type: String, // 'earned', 'redeemed', 'expired'
    points: Number,
    reason: String,
    relatedId: ObjectId, // appointmentId or rewardId
    createdAt: Date
  }],
  
  updatedAt: Date
}
```

---

## 🔄 User Flows

### Flow 1: Business Owner Registration & Verification

```
1. Business Owner visits platform
   ↓
2. Clicks "Register as Business Owner"
   ↓
3. Fills registration form:
   - Personal info (name, email, password, phone)
   - Business info (name, type, address, hours)
   - Uploads verification documents (DTI, permits, IDs)
   ↓
4. Submits application
   ↓
5. Status: "Pending Verification"
   - Cannot post services yet
   - Can view dashboard with pending status
   ↓
6. Super Admin receives notification
   ↓
7. Super Admin reviews application:
   - Checks documents
   - Verifies business authenticity
   - Decision: Approve or Reject
   ↓
8a. If APPROVED:
    - Business status → "Approved"
    - Business Owner receives approval notification
    - Can now post services
    ↓
8b. If REJECTED:
    - Business status → "Rejected"
    - Business Owner receives rejection notification with reason
    - Can reapply with corrections
```

### Flow 2: Business Owner Posts Service

```
1. Business Owner logs in (must be approved)
   ↓
2. Goes to "My Services" dashboard
   ↓
3. Clicks "Add New Service"
   ↓
4. Fills service form:
   - Service name, description, category
   - Price, duration
   - Upload images
   - Set availability (days, time slots)
   ↓
5. Submits service
   ↓
6. Service is now visible to customers
   ↓
7. Service appears in marketplace with business info
```

### Flow 3: Customer Books Service

```
1. Customer visits platform/logs in
   ↓
2. Browses services (can filter by category, location, price)
   ↓
3. Views service details:
   - Service info
   - Business profile
   - Reviews and ratings
   - Available time slots
   ↓
4. Selects date and time
   ↓
5. Reviews booking details
   - Can apply reward points
   ↓
6. Confirms booking
   ↓
7. Booking status: "Pending"
   ↓
8. Business Owner receives notification
   ↓
9. Business Owner reviews and confirms booking
   ↓
10. Booking status: "Confirmed"
    ↓
11. Both parties receive confirmation
    ↓
12. On appointment date: Service is provided
    ↓
13. Business Owner marks as "Completed"
    ↓
14. Customer earns reward points
    ↓
15. Customer can leave review
```

### Flow 4: Super Admin Manages Platform

```
1. Super Admin logs in
   ↓
2. Dashboard shows:
   - Pending business applications
   - Platform statistics
   - Recent activities
   - Reported issues
   ↓
3. Reviews pending applications:
   - View business details
   - Check documents
   - Approve/Reject with notes
   ↓
4. Monitors active businesses:
   - View business performance
   - Handle customer complaints
   - Suspend if needed
   ↓
5. Manages platform settings:
   - Service categories
   - Reward point rules
   - Platform policies
```

---

## 🎨 User Interface Structure

### Super Admin Portal
```
/admin
  /dashboard - Overview, statistics, pending approvals
  /applications - Business verification queue
  /businesses - All businesses management
  /users - Customer management
  /reports - Platform analytics
  /settings - Platform configuration
```

### Business Owner Portal
```
/business
  /dashboard - Business overview, statistics
  /services - Manage services (add, edit, delete)
  /bookings - View and manage appointments
  /calendar - Booking calendar view
  /reviews - Customer reviews
  /profile - Business profile settings
  /analytics - Business performance metrics
```

### Customer Portal
```
/ - Landing page (marketplace)
/services - Browse all services
/service/:id - Service details
/business/:id - Business profile
/booking - Booking flow
/my-bookings - Appointment history
/rewards - Rewards dashboard
/profile - Customer profile
/notifications - Notifications
```

---

## 🔐 Authentication & Authorization

### Role-Based Access Control (RBAC)

#### Middleware Structure
```javascript
// checkRole.js
- checkSuperAdmin() - Only super admins
- checkBusinessOwner() - Only business owners
- checkCustomer() - Only customers
- checkBusinessOrAdmin() - Business owners or super admins
- checkAuthenticated() - Any logged-in user
```

#### Route Protection Examples
```javascript
// Super Admin only
router.get('/admin/dashboard', checkSuperAdmin, adminController.dashboard);

// Business Owner only
router.get('/business/services', checkBusinessOwner, businessController.services);

// Customer only
router.post('/booking', checkCustomer, bookingController.create);

// Business Owner accessing their own data
router.get('/business/:id/services', checkBusinessOwner, checkOwnership, ...);
```

---

## 📋 Feature Priority List

### Phase 1: Foundation (Critical)
1. ✅ User authentication with roles
2. ✅ Business model and registration
3. ✅ Super admin approval system
4. ✅ Business owner dashboard basics
5. ✅ Service posting by business owners

### Phase 2: Core Booking (High Priority)
6. ✅ Multi-business service browsing
7. ✅ Updated booking system with business reference
8. ✅ Business owner booking management
9. ✅ Notification system updates
10. ✅ Basic business profiles

### Phase 3: Enhancement (Medium Priority)
11. ⏳ Review and rating system
12. ⏳ Advanced search and filters
13. ⏳ Business analytics dashboard
14. ⏳ Customer reward system updates
15. ⏳ Business hours and availability management

### Phase 4: Advanced (Low Priority)
16. ⏳ Staff management for businesses
17. ⏳ Payment integration
18. ⏳ SMS notifications
19. ⏳ Business subscription tiers
20. ⏳ Mobile app

---

## 🔄 Migration Strategy

### Handling Existing Data

#### Current State
- May existing admin account
- May existing customer accounts
- May existing services (owned by admin)
- May existing appointments

#### Migration Plan

**Step 1: Backup**
```bash
# Backup current database
mongodump --db=your_db_name --out=./backup
```

**Step 2: Update User Model**
```javascript
// Add role field to existing users
db.users.updateMany(
  { role: { $exists: false } },
  { $set: { role: 'customer' } }
);

// Convert admin to super_admin
db.users.updateOne(
  { email: 'admin@example.com' },
  { $set: { role: 'super_admin' } }
);
```

**Step 3: Create Default Business**
```javascript
// Create a default business for existing services
const defaultBusiness = {
  businessName: 'Legacy Services',
  ownerId: adminId,
  verificationStatus: 'approved',
  // ... other fields
};
```

**Step 4: Update Services**
```javascript
// Link existing services to default business
db.services.updateMany(
  { businessId: { $exists: false } },
  { $set: { businessId: defaultBusinessId } }
);
```

**Step 5: Update Appointments**
```javascript
// Link existing appointments to default business
db.appointments.updateMany(
  { businessId: { $exists: false } },
  { $set: { businessId: defaultBusinessId } }
);
```

---

## 🚀 Implementation Roadmap

### Week 1-2: Database & Models
- [ ] Create Business model
- [ ] Update User model with roles
- [ ] Update Service model with businessId
- [ ] Update Appointment model with businessId
- [ ] Create Review model
- [ ] Update Notification model
- [ ] Run migration scripts

### Week 3-4: Authentication & Authorization
- [ ] Implement role-based middleware
- [ ] Create business owner registration flow
- [ ] Create super admin login
- [ ] Update session management
- [ ] Implement ownership checks

### Week 5-6: Super Admin Features
- [ ] Super admin dashboard
- [ ] Business application review page
- [ ] Approval/rejection system
- [ ] Business management interface
- [ ] Platform statistics

### Week 7-8: Business Owner Features
- [ ] Business owner dashboard
- [ ] Service management (CRUD)
- [ ] Booking management
- [ ] Business profile settings
- [ ] Basic analytics

### Week 9-10: Customer Features
- [ ] Multi-business service browsing
- [ ] Business profile pages
- [ ] Updated booking flow
- [ ] Search and filters
- [ ] Review system

### Week 11-12: Testing & Polish
- [ ] End-to-end testing
- [ ] Bug fixes
- [ ] UI/UX improvements
- [ ] Performance optimization
- [ ] Documentation

---

## 📊 Key Differences: Old vs New System

| Aspect | Old System | New System |
|--------|-----------|------------|
| **Users** | Admin + Customers | Super Admin + Business Owners + Customers |
| **Services** | Managed by admin | Posted by business owners |
| **Platform Type** | Single business | Multi-business marketplace |
| **Verification** | None | Business verification required |
| **Service Ownership** | Admin owns all | Each business owns their services |
| **Booking** | Direct to admin | To specific businesses |
| **Dashboard** | Admin + Customer | Super Admin + Business Owner + Customer |
| **Scalability** | Limited to one business | Unlimited businesses |

---

## 🎯 Success Metrics

### For Platform (Super Admin)
- Number of verified businesses
- Total bookings across platform
- Platform revenue (if commission-based)
- User growth rate
- Platform uptime

### For Business Owners
- Number of services posted
- Booking conversion rate
- Average rating
- Revenue per business
- Customer retention

### For Customers
- Service variety available
- Booking success rate
- Average wait time for confirmation
- Reward points earned
- User satisfaction

---

## 🔒 Security Considerations

1. **Role Verification**
   - Always verify user role on server-side
   - Never trust client-side role checks

2. **Data Isolation**
   - Business owners can only access their own data
   - Customers can only access their own bookings
   - Super admin has read-only access to sensitive data

3. **Document Upload**
   - Validate file types (PDF, JPG, PNG only)
   - Limit file sizes (max 5MB per file)
   - Scan for malware
   - Store in secure location

4. **API Security**
   - Rate limiting per user role
   - Input validation and sanitization
   - SQL injection prevention
   - XSS protection

---

## 📝 Next Steps

1. **Review this document** - Basahin at i-validate kung tama ang understanding
2. **Approve/Modify** - Mag-suggest ng changes kung may mali or kulang
3. **Start Implementation** - Once approved, magsisimula na tayo sa coding
4. **Iterative Development** - Build phase by phase with testing

---

## 💡 Additional Features to Consider (Future)

- **Business Categories/Tags** - Para mas madaling mag-filter
- **Featured Businesses** - Promoted listings
- **Business Subscription Plans** - Free, Basic, Premium tiers
- **Commission System** - Platform takes percentage per booking
- **Multi-location Support** - Businesses with multiple branches
- **Staff Management** - Business owners can add staff accounts
- **Inventory Management** - For businesses selling products
- **Loyalty Programs** - Per-business loyalty cards
- **Gift Cards** - Purchase and redeem
- **Waitlist Feature** - When fully booked
- **Cancellation Policies** - Per business rules
- **Automated Reminders** - SMS/Email before appointments
- **Business Analytics** - Detailed insights and reports
- **Customer Preferences** - Save favorite businesses/services
- **Social Sharing** - Share services on social media
- **Referral Program** - Earn rewards for referrals

---

**Document Version:** 1.0  
**Last Updated:** December 18, 2024  
**Status:** Draft - Awaiting Review
