# Database Schema - Multi-Business Platform

## 📊 Collections Overview

| Collection | Purpose | Key References |
|------------|---------|----------------|
| **users** | All users (customers, business owners, super admins) | - |
| **businesses** | Service provider businesses | ownerId → users |
| **services** | Services offered by businesses | businessId → businesses |
| **appointments** | Customer bookings | customerId → users, businessId → businesses, serviceId → services |
| **reviews** | Customer reviews | customerId → users, businessId → businesses, serviceId → services |
| **rewards** | Customer reward points | customerId → users |
| **notifications** | User notifications | userId → users |
| **staff** | Business staff members | - |
| **otps** | OTP verification codes | - |

---

## 👤 Users Collection

**Purpose:** Unified collection for all user types

```javascript
{
  _id: ObjectId,
  
  // Basic Info
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  phoneNumber: String,
  
  // Role & Access
  role: "super_admin" | "business_owner" | "customer",
  
  // Profile
  profilePicture: String,
  dateOfBirth: Date,
  gender: "male" | "female" | "other" | "prefer_not_to_say",
  
  // Verification
  isVerified: Boolean,
  verificationToken: String,
  verificationTokenExpires: Date,
  
  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Business Owner Specific
  businessId: ObjectId, // Reference to Business
  
  // Customer Specific
  rewardPoints: Number,
  appointmentHistory: [ObjectId], // References to Appointments
  favoriteBusinesses: [ObjectId], // References to Businesses
  
  // Account Status
  isActive: Boolean,
  isBanned: Boolean,
  banReason: String,
  
  // Security
  lastLogin: Date,
  loginAttempts: Number,
  lockUntil: Date,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### User Roles

1. **super_admin**
   - Platform administrator
   - Verifies businesses
   - Manages platform

2. **business_owner**
   - Owns a business
   - Manages services
   - Handles bookings
   - Has `businessId` field populated

3. **customer**
   - Books services
   - Earns rewards
   - Leaves reviews

---

## 🏢 Businesses Collection

**Purpose:** Service provider businesses on the platform

```javascript
{
  _id: ObjectId,
  
  // Owner
  ownerId: ObjectId, // Reference to User (business_owner)
  
  // Business Info
  businessName: String,
  businessType: "salon" | "spa" | "clinic" | "barbershop" | "gym" | "wellness" | "beauty" | "other",
  description: String,
  logo: String,
  coverPhoto: String,
  
  // Contact
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
    day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday",
    isOpen: Boolean,
    openTime: String, // "09:00"
    closeTime: String // "18:00"
  }],
  
  // Verification
  verificationStatus: "pending" | "approved" | "rejected" | "suspended",
  verificationDocuments: [{
    type: "dti" | "business_permit" | "valid_id" | "bir" | "mayor_permit" | "other",
    fileUrl: String,
    fileName: String,
    uploadedAt: Date
  }],
  rejectionReason: String,
  verifiedAt: Date,
  verifiedBy: ObjectId, // Reference to User (super_admin)
  
  // Statistics
  totalServices: Number,
  totalBookings: Number,
  completedBookings: Number,
  averageRating: Number (0-5),
  totalReviews: Number,
  
  // Status
  isActive: Boolean,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Business Verification Flow

```
pending → approved (can post services)
        → rejected (with reason)
        → suspended (by admin)
```

---

## 🛍️ Services Collection

**Purpose:** Services offered by businesses

```javascript
{
  _id: ObjectId,
  
  // Business Reference
  businessId: ObjectId, // Reference to Business
  
  // Service Info
  name: String,
  description: String,
  details: [String],
  price: Number,
  duration: Number, // minutes
  image: String,
  category: "hair" | "skin" | "nails" | "spa" | "other",
  
  // Staff
  assignedStaff: [ObjectId], // References to Staff
  
  // Availability
  isActive: Boolean,
  
  // Rewards
  pointsEarned: Number,
  
  // Booking Rules
  minAdvanceBooking: {
    value: Number,
    unit: "minutes" | "hours" | "days"
  },
  
  // Timestamps
  createdAt: Date
}
```

---

## 📅 Appointments Collection

**Purpose:** Customer bookings with businesses

```javascript
{
  _id: ObjectId,
  
  // References
  businessId: ObjectId, // Reference to Business
  customer: ObjectId, // Reference to User (customer)
  service: ObjectId, // Reference to Service
  staff: ObjectId, // Reference to Staff (optional)
  
  // Appointment Details
  date: Date,
  timeSlot: {
    start: String, // "10:00"
    end: String // "11:00"
  },
  queueNumber: String, // "Q20241221-001"
  
  // Status
  status: "pending" | "approved" | "in-progress" | "completed" | "cancelled" | "rescheduled" | "no-show",
  isWalkIn: Boolean,
  
  // Notes
  notes: String,
  
  // Reschedule
  rescheduleRequest: {
    requested: Boolean,
    newDate: Date,
    newTimeSlot: {
      start: String,
      end: String
    },
    reason: String
  },
  
  // Completion
  completedAt: Date,
  
  // Rewards & Payment
  pointsAwarded: Number,
  appliedRedemption: ObjectId, // Reference to Redemption
  discountApplied: Number,
  finalPrice: Number,
  
  // Timestamps
  createdAt: Date
}
```

### Appointment Status Flow

```
pending → approved → in-progress → completed
        → cancelled
        → rescheduled
        → no-show
```

---

## ⭐ Reviews Collection

**Purpose:** Customer reviews for businesses and services

```javascript
{
  _id: ObjectId,
  
  // References
  customerId: ObjectId, // Reference to User
  businessId: ObjectId, // Reference to Business
  serviceId: ObjectId, // Reference to Service
  appointmentId: ObjectId, // Reference to Appointment (unique)
  
  // Review Content
  rating: Number (1-5),
  comment: String,
  images: [String],
  
  // Business Response
  businessResponse: String,
  respondedAt: Date,
  respondedBy: ObjectId, // Reference to User (business_owner)
  
  // Status
  isVisible: Boolean,
  isEdited: Boolean,
  editedAt: Date,
  
  // Engagement
  helpfulCount: Number,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Note:** One review per appointment (unique index on appointmentId)

---

## 🎁 Rewards Collection

**Purpose:** Customer reward points tracking

```javascript
{
  _id: ObjectId,
  
  // Customer Reference
  customerId: ObjectId, // Reference to User
  
  // Points
  totalPoints: Number,
  lifetimePoints: Number,
  
  // Transaction History
  transactions: [{
    type: "earned" | "redeemed" | "expired",
    points: Number,
    reason: String,
    relatedId: ObjectId, // appointmentId or rewardId
    createdAt: Date
  }],
  
  // Timestamps
  updatedAt: Date
}
```

---

## 🔔 Notifications Collection

**Purpose:** User notifications

```javascript
{
  _id: ObjectId,
  
  // User Reference
  userId: ObjectId, // Reference to User
  userRole: "customer" | "business_owner" | "super_admin",
  
  // Notification Content
  type: "booking" | "verification" | "review" | "system",
  title: String,
  message: String,
  
  // Related Data
  relatedId: ObjectId, // appointmentId, businessId, etc.
  relatedType: "appointment" | "business" | "review",
  
  // Status
  isRead: Boolean,
  
  // Timestamps
  createdAt: Date
}
```

---

## 🔗 Relationships Diagram

```
User (super_admin)
  └─> verifies → Business

User (business_owner)
  └─> owns → Business
      └─> has many → Services
          └─> receives → Appointments
              └─> gets → Reviews

User (customer)
  ├─> books → Appointments
  ├─> writes → Reviews
  ├─> earns → Rewards
  └─> receives → Notifications
```

---

## 📊 Indexes

### Users
```javascript
{ email: 1 } // unique
{ role: 1 }
{ businessId: 1 }
```

### Businesses
```javascript
{ ownerId: 1 }
{ verificationStatus: 1 }
{ "address.city": 1 }
{ businessType: 1 }
```

### Services
```javascript
{ businessId: 1 }
{ category: 1 }
{ isActive: 1 }
```

### Appointments
```javascript
{ businessId: 1, date: 1 }
{ customer: 1, createdAt: -1 }
{ status: 1 }
{ queueNumber: 1 } // unique
```

### Reviews
```javascript
{ businessId: 1, createdAt: -1 }
{ customerId: 1, createdAt: -1 }
{ appointmentId: 1 } // unique
```

---

## 🔍 Common Queries

### Get all services for a business
```javascript
db.services.find({ businessId: businessId, isActive: true })
```

### Get all appointments for a business
```javascript
db.appointments.find({ businessId: businessId })
  .populate('customer')
  .populate('service')
  .sort({ date: -1 })
```

### Get customer's booking history
```javascript
db.appointments.find({ customer: customerId })
  .populate('business')
  .populate('service')
  .sort({ createdAt: -1 })
```

### Get pending business applications
```javascript
db.businesses.find({ verificationStatus: 'pending' })
  .populate('ownerId')
  .sort({ createdAt: 1 })
```

### Get business reviews with ratings
```javascript
db.reviews.find({ businessId: businessId, isVisible: true })
  .populate('customerId', 'firstName lastName profilePicture')
  .sort({ createdAt: -1 })
```

### Calculate business average rating
```javascript
db.reviews.aggregate([
  { $match: { businessId: businessId, isVisible: true } },
  { $group: {
    _id: null,
    averageRating: { $avg: '$rating' },
    totalReviews: { $sum: 1 }
  }}
])
```

---

**Last Updated:** December 21, 2024
