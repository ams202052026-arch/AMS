# Design Document: Unified Business Mode Switching

## Overview

This design implements a unified login system where users can seamlessly switch between Customer Mode and Business Mode within a single account, similar to Facebook's "Switch to Page" functionality. This eliminates the need for separate business owner accounts and provides a cohesive user experience across both customer and business functionalities.

### Key Design Principles

1. **Single Account, Multiple Roles** - One user account can have both customer and business capabilities
2. **Mode-Based Context Switching** - Clear separation between customer and business interfaces
3. **Progressive Enhancement** - Customers can upgrade to business owners without losing existing data
4. **Data Isolation** - Customer and business data remain properly separated despite shared authentication
5. **Seamless Transitions** - Mode switching should be instant and intuitive

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Authentication                      │
│                    (Single Login System)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├─────────────────┬────────────────────┐
                       │                 │                    │
              ┌────────▼────────┐ ┌─────▼──────┐  ┌─────────▼────────┐
              │  Customer Mode  │ │ Mode Switch│  │  Business Mode   │
              │   (Default)     │ │ Controller │  │  (Conditional)   │
              └────────┬────────┘ └─────┬──────┘  └─────────┬────────┘
                       │                 │                    │
              ┌────────▼────────┐ ┌─────▼──────┐  ┌─────────▼────────┐
              │ Customer        │ │ Business   │  │ Business         │
              │ Dashboard       │ │ Application│  │ Dashboard        │
              │ - Bookings      │ │ Status     │  │ - Services       │
              │ - Rewards       │ │ Check      │  │ - Bookings       │
              │ - History       │ └────────────┘  │ - Analytics      │
              └─────────────────┘                 └──────────────────┘
```

### Mode Switching Flow

```
User Login
    │
    ▼
Customer Mode (Default)
    │
    ├─[Switch to Business Mode]─┐
    │                            │
    │                            ▼
    │                    Check Business Status
    │                            │
    │                            ├─ No Application ──> Business Application Form
    │                            │
    │                            ├─ Pending ──────────> Application Status Page
    │                            │
    │                            ├─ Approved ─────────> Business Dashboard
    │                            │
    │                            └─ Rejected ─────────> Reapply Option
    │
    └─[Continue as Customer]────> Customer Features
```

## Components and Interfaces

### 1. Mode Switching Middleware

**Purpose:** Manages mode transitions and validates access permissions

```javascript
// middleware/modeSwitch.js

/**
 * Checks if user can access business mode
 */
function canAccessBusinessMode(req, res, next) {
  const user = req.session.user;
  
  if (!user) {
    return res.redirect('/login');
  }
  
  // Check if user has approved business
  if (user.businessApplication?.status === 'approved') {
    return next();
  }
  
  // Redirect based on application status
  const status = user.businessApplication?.status || 'none';
  
  switch (status) {
    case 'none':
      return res.redirect('/business/apply');
    case 'pending':
      return res.redirect('/business/application-status');
    case 'rejected':
      return res.redirect('/business/application-status');
    case 'suspended':
      return res.render('error', {
        title: 'Business Suspended',
        message: 'Your business has been suspended. Please contact support.'
      });
    default:
      return res.redirect('/home');
  }
}

/**
 * Switches user to business mode
 */
function switchToBusinessMode(req, res, next) {
  req.session.currentMode = 'business';
  req.session.save((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to switch mode' });
    }
    next();
  });
}

/**
 * Switches user to customer mode
 */
function switchToCustomerMode(req, res, next) {
  req.session.currentMode = 'customer';
  req.session.save((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to switch mode' });
    }
    next();
  });
}

/**
 * Ensures user is in customer mode
 */
function requireCustomerMode(req, res, next) {
  if (req.session.currentMode !== 'customer') {
    return res.redirect('/switch-to-customer');
  }
  next();
}

/**
 * Ensures user is in business mode
 */
function requireBusinessMode(req, res, next) {
  if (req.session.currentMode !== 'business') {
    return res.redirect('/switch-to-business');
  }
  next();
}

module.exports = {
  canAccessBusinessMode,
  switchToBusinessMode,
  switchToCustomerMode,
  requireCustomerMode,
  requireBusinessMode
};
```

### 2. Mode Switch Controller

**Purpose:** Handles mode switching requests and redirects

```javascript
// controllers/modeSwitch.js

const User = require('../models/user');
const Business = require('../models/business');

/**
 * Switch to business mode
 */
async function switchToBusiness(req, res) {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.redirect('/login');
    }
    
    // Update session mode
    req.session.currentMode = 'business';
    
    // Check business application status
    const status = user.businessApplication?.status || 'none';
    
    switch (status) {
      case 'none':
        return res.redirect('/business/apply');
      
      case 'pending':
        return res.redirect('/business/application-status');
      
      case 'approved':
        return res.redirect('/business/dashboard');
      
      case 'rejected':
        return res.redirect('/business/application-status');
      
      case 'suspended':
        return res.render('error', {
          title: 'Business Suspended',
          message: 'Your business access has been suspended.',
          statusCode: 403
        });
      
      default:
        return res.redirect('/home');
    }
  } catch (error) {
    console.error('Error switching to business mode:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to switch to business mode',
      statusCode: 500
    });
  }
}

/**
 * Switch to customer mode
 */
async function switchToCustomer(req, res) {
  try {
    // Update session mode
    req.session.currentMode = 'customer';
    
    // Redirect to customer dashboard
    res.redirect('/home');
  } catch (error) {
    console.error('Error switching to customer mode:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to switch to customer mode',
      statusCode: 500
    });
  }
}

/**
 * Get current mode status
 */
async function getModeStatus(req, res) {
  try {
    const userId = req.session.userId;
    const currentMode = req.session.currentMode || 'customer';
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const businessStatus = user.businessApplication?.status || 'none';
    
    res.json({
      currentMode,
      businessStatus,
      canAccessBusiness: businessStatus === 'approved',
      hasApplication: businessStatus !== 'none'
    });
  } catch (error) {
    console.error('Error getting mode status:', error);
    res.status(500).json({ error: 'Failed to get mode status' });
  }
}

module.exports = {
  switchToBusiness,
  switchToCustomer,
  getModeStatus
};
```

### 3. Updated Navigation Component

**Purpose:** Displays mode-specific navigation with switching options

```javascript
// Navigation rendering logic (in EJS template)

<% 
const currentMode = session.currentMode || 'customer';
const businessStatus = user.businessApplication?.status || 'none';
const canAccessBusiness = businessStatus === 'approved';
%>

<!-- Mode Indicator -->
<div class="mode-indicator">
  <% if (currentMode === 'customer') { %>
    <span class="mode-badge customer-mode">👤 Customer Mode</span>
  <% } else { %>
    <span class="mode-badge business-mode">⚡ Business Mode</span>
  <% } %>
</div>

<!-- Mode Switch Button -->
<div class="mode-switch">
  <% if (currentMode === 'customer') { %>
    <a href="/switch-to-business" class="mode-switch-btn">
      <span>⚡</span> Switch to Business Mode
    </a>
  <% } else { %>
    <a href="/switch-to-customer" class="mode-switch-btn">
      <span>👤</span> Switch to Customer Mode
    </a>
  <% } %>
</div>

<!-- Mode-Specific Navigation -->
<nav class="main-navigation">
  <% if (currentMode === 'customer') { %>
    <!-- Customer Navigation -->
    <a href="/home">Home</a>
    <a href="/appointments">Appointments</a>
    <a href="/rewards">Rewards</a>
    <a href="/history">History</a>
  <% } else { %>
    <!-- Business Navigation -->
    <a href="/business/dashboard">Dashboard</a>
    <a href="/business/services">Services</a>
    <a href="/business/bookings">Bookings</a>
    <a href="/business/analytics">Analytics</a>
  <% } %>
</nav>
```

## Data Models

### Updated User Model

```javascript
// models/user.js

const userSchema = new mongoose.Schema({
  // Existing fields
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phoneNumber: String,
  profilePicture: String,
  role: { 
    type: String, 
    enum: ['customer', 'super_admin'], 
    default: 'customer' 
  },
  
  // Business Application Tracking (NEW)
  businessApplication: {
    status: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected', 'suspended'],
      default: 'none'
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business'
    },
    appliedAt: Date,
    approvedAt: Date,
    rejectedAt: Date,
    suspendedAt: Date,
    rejectionReason: String,
    suspensionReason: String,
    lastStatusChange: Date
  },
  
  // Existing fields
  rewardPoints: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Method to check if user can access business mode
userSchema.methods.canAccessBusinessMode = function() {
  return this.businessApplication?.status === 'approved';
};

// Method to get business application status
userSchema.methods.getBusinessStatus = function() {
  return this.businessApplication?.status || 'none';
};

module.exports = mongoose.model('User', userSchema);
```

### Updated Business Model

```javascript
// models/business.js

const businessSchema = new mongoose.Schema({
  // Link to user account (NEW)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Existing fields
  businessName: { type: String, required: true },
  businessType: String,
  description: String,
  logo: String,
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
    zipCode: String
  },
  
  // Business Hours
  businessHours: [{
    day: String,
    isOpen: Boolean,
    openTime: String,
    closeTime: String
  }],
  
  // Verification
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  verificationDocuments: [{
    type: String,
    fileUrl: String,
    uploadedAt: Date
  }],
  rejectionReason: String,
  suspensionReason: String,
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Statistics
  totalServices: { type: Number, default: 0 },
  totalBookings: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  
  // Status
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Business', businessSchema);
```

### Session Data Structure

```javascript
// Session structure
req.session = {
  userId: ObjectId,
  userEmail: String,
  userName: String,
  userRole: 'customer' | 'super_admin',
  
  // Mode tracking (NEW)
  currentMode: 'customer' | 'business',
  
  // Business context (when in business mode)
  businessId: ObjectId,
  businessStatus: 'none' | 'pending' | 'approved' | 'rejected' | 'suspended'
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Mode switching preserves authentication
*For any* authenticated user, switching between customer and business modes should preserve their session and authentication state without requiring re-login
**Validates: Requirements 2.3**

### Property 2: Business status determines access
*For any* user attempting to access business mode, the system should redirect them based on their business application status (none → apply, pending → status, approved → dashboard, rejected → status)
**Validates: Requirements 1.2, 1.3, 1.4, 1.5**

### Property 3: Mode-specific data isolation
*For any* user with both customer and business data, actions performed in customer mode should not affect business data, and actions in business mode should not affect customer data
**Validates: Requirements 4.2, 4.3, 8.2, 8.3, 8.4**

### Property 4: Business application creates linked record
*For any* user starting a business application, the system should create a business record linked to their user account and update their businessApplication status
**Validates: Requirements 3.1, 3.2**

### Property 5: Approval enables business mode access
*For any* user whose business application is approved, the system should enable access to business mode and update their account permissions
**Validates: Requirements 3.5, 4.1, 5.3**

### Property 6: Rejection preserves customer access
*For any* user whose business application is rejected, the system should maintain their customer mode access and allow reapplication
**Validates: Requirements 5.4, 7.1, 7.2**

### Property 7: Suspension isolates business access
*For any* user whose business is suspended, the system should disable business mode access while preserving all customer mode functionality and data
**Validates: Requirements 5.5, 8.5**

### Property 8: Mode-specific notifications
*For any* user with notifications in both modes, the system should display separate notification counts for customer and business modes
**Validates: Requirements 4.4, 6.5**

### Property 9: Reapplication resets status
*For any* user reapplying after rejection, the system should reset their application status to pending and notify super admins
**Validates: Requirements 7.3, 7.4, 7.5**

### Property 10: Logout clears all mode data
*For any* authenticated user, logging out should clear session data for both customer and business modes
**Validates: Requirements 4.5**

## Error Handling

### Mode Switching Errors

1. **Invalid Mode Transition**
   - Error: User tries to access business mode without proper status
   - Handling: Redirect to appropriate page based on business status
   - User Message: "Please complete your business application first"

2. **Session Expiration During Mode Switch**
   - Error: Session expires while switching modes
   - Handling: Redirect to login page with return URL
   - User Message: "Your session has expired. Please log in again"

3. **Business Suspension**
   - Error: User tries to access suspended business
   - Handling: Show error page with contact information
   - User Message: "Your business has been suspended. Please contact support"

4. **Database Error During Mode Switch**
   - Error: Database query fails during mode transition
   - Handling: Log error, show generic error page
   - User Message: "Unable to switch modes. Please try again"

### Business Application Errors

1. **Duplicate Application**
   - Error: User tries to apply when application already exists
   - Handling: Redirect to application status page
   - User Message: "You already have a pending application"

2. **Document Upload Failure**
   - Error: Document upload to Cloudinary fails
   - Handling: Show error, allow retry
   - User Message: "Failed to upload document. Please try again"

3. **Invalid Business Data**
   - Error: Business information validation fails
   - Handling: Show validation errors on form
   - User Message: "Please correct the highlighted fields"

## Testing Strategy

### Unit Testing

**Mode Switching Logic:**
- Test mode switching with different business statuses
- Test session preservation during mode switches
- Test access control for each mode
- Test error handling for invalid transitions

**Business Application:**
- Test application creation and linking to user
- Test document upload and storage
- Test status updates and notifications
- Test reapplication workflow

**Data Isolation:**
- Test that customer actions don't affect business data
- Test that business actions don't affect customer data
- Test notification separation between modes

### Property-Based Testing

Using **fast-check** (JavaScript property testing library):

**Property 1: Mode switching preserves authentication**
```javascript
// Test that switching modes preserves user session
fc.assert(
  fc.property(
    fc.record({
      userId: fc.string(),
      userEmail: fc.emailAddress(),
      currentMode: fc.constantFrom('customer', 'business')
    }),
    (session) => {
      const beforeSwitch = { ...session };
      const afterSwitch = switchMode(session);
      
      return (
        afterSwitch.userId === beforeSwitch.userId &&
        afterSwitch.userEmail === beforeSwitch.userEmail &&
        afterSwitch.currentMode !== beforeSwitch.currentMode
      );
    }
  )
);
```

**Property 2: Business status determines access**
```javascript
// Test that business status correctly determines redirect
fc.assert(
  fc.property(
    fc.constantFrom('none', 'pending', 'approved', 'rejected', 'suspended'),
    (status) => {
      const redirect = getBusinessModeRedirect(status);
      
      const expectedRedirects = {
        'none': '/business/apply',
        'pending': '/business/application-status',
        'approved': '/business/dashboard',
        'rejected': '/business/application-status',
        'suspended': '/error'
      };
      
      return redirect === expectedRedirects[status];
    }
  )
);
```

**Property 3: Mode-specific data isolation**
```javascript
// Test that customer and business data remain isolated
fc.assert(
  fc.property(
    fc.record({
      customerData: fc.array(fc.anything()),
      businessData: fc.array(fc.anything()),
      action: fc.constantFrom('customer', 'business')
    }),
    (testData) => {
      const before = {
        customer: [...testData.customerData],
        business: [...testData.businessData]
      };
      
      performAction(testData.action, testData);
      
      const after = {
        customer: getCustomerData(),
        business: getBusinessData()
      };
      
      if (testData.action === 'customer') {
        return JSON.stringify(after.business) === JSON.stringify(before.business);
      } else {
        return JSON.stringify(after.customer) === JSON.stringify(before.customer);
      }
    }
  )
);
```

### Integration Testing

**End-to-End Mode Switching Flow:**
1. User logs in as customer
2. User switches to business mode
3. System checks business status
4. User completes business application
5. Admin approves application
6. User switches to business mode successfully
7. User accesses business dashboard
8. User switches back to customer mode
9. User accesses customer features

**Multi-Mode Operations:**
1. User books appointment as customer
2. User switches to business mode
3. User manages business services
4. User switches back to customer mode
5. Verify customer booking still exists
6. Verify business services still exist

### Manual Testing Checklist

- [ ] Customer can see "Switch to Business Mode" button
- [ ] Clicking switch button checks business status correctly
- [ ] Users without application are redirected to application form
- [ ] Users with pending application see status page
- [ ] Users with approved business access dashboard
- [ ] Users with rejected application can reapply
- [ ] Business mode shows correct navigation
- [ ] Customer mode shows correct navigation
- [ ] Mode indicator displays correctly
- [ ] Notifications are mode-specific
- [ ] Logout clears both modes
- [ ] Session persists during mode switches
- [ ] Business suspension blocks business access
- [ ] Business suspension preserves customer access

## Implementation Notes

### Phase 1: Core Infrastructure (Week 1)
- Update User model with businessApplication field
- Create mode switching middleware
- Implement mode switch controller
- Update session management

### Phase 2: UI Integration (Week 2)
- Add mode indicators to navigation
- Create mode switch buttons
- Update navigation for both modes
- Add visual feedback for mode transitions

### Phase 3: Business Application Integration (Week 3)
- Modify business application to link to users
- Update approval/rejection workflow
- Implement reapplication functionality
- Add admin interface updates

### Phase 4: Testing & Polish (Week 4)
- Write unit tests
- Write property-based tests
- Perform integration testing
- Fix bugs and refine UX

## Security Considerations

1. **Session Security**
   - Always validate mode on server-side
   - Never trust client-side mode indicators
   - Regenerate session ID on mode switch

2. **Access Control**
   - Verify business status before granting access
   - Check ownership of business data
   - Prevent cross-mode data access

3. **Data Isolation**
   - Separate queries for customer and business data
   - Use mode-specific middleware
   - Validate data context before operations

4. **Audit Trail**
   - Log all mode switches
   - Track business status changes
   - Monitor suspicious mode switching patterns

## Performance Considerations

1. **Session Management**
   - Cache business status in session
   - Minimize database queries during mode switches
   - Use session middleware efficiently

2. **Database Queries**
   - Index businessApplication.status field
   - Use lean queries for status checks
   - Cache user business status

3. **UI Rendering**
   - Lazy load mode-specific components
   - Cache navigation templates
   - Optimize mode indicator rendering

## Future Enhancements

1. **Multi-Business Support**
   - Allow users to own multiple businesses
   - Add business selector in business mode
   - Separate dashboards per business

2. **Role-Based Permissions**
   - Add staff roles within businesses
   - Implement granular permissions
   - Allow delegation of business tasks

3. **Advanced Analytics**
   - Track mode usage patterns
   - Analyze conversion from customer to business owner
   - Monitor mode switching frequency

4. **Mobile App Support**
   - Implement mode switching in mobile app
   - Add push notifications per mode
   - Optimize mobile UI for mode transitions

---

**Design Version:** 1.0  
**Last Updated:** December 21, 2025  
**Status:** Ready for Implementation