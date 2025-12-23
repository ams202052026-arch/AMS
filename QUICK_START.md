# 🚀 Quick Start Guide - AMS

## ✅ Core Functionalities Working

All core features have been tested and are working:
- ✅ Admin login
- ✅ Customer login  
- ✅ Service management (add/edit/delete)
- ✅ Staff management
- ✅ Appointment booking
- ✅ Queue number generation

## 📋 Step-by-Step Usage

### 1. Initial Setup (One Time)

```bash
# Install dependencies
npm install

# Seed the database
npm run seed

# Test core functionality
npm test
```

### 2. Start the Server

```bash
npm run dev
```

Server runs on: `http://localhost:3000`

---

## 👤 CUSTOMER FLOW

### Login
**URL:** `http://localhost:3000/login`

**Test Account:**
- Email: `customer@test.com`
- Password: `password123`

### Or Sign Up New Account
1. Go to `/signup`
2. Fill in details
3. Check email for OTP
4. Enter OTP to verify
5. Login with your credentials

### Book an Appointment

1. **Browse Services** - After login, you'll see the home page with all services
2. **Click a Service** - Modal opens with details
3. **Click "Book Now"** - Goes to booking page
4. **Select Date** - Choose appointment date
5. **Select Time** - Pick available time slot
6. **Select Staff** (optional) - Choose preferred staff or leave as "Any Available"
7. **Add Notes** (optional) - Any special requests
8. **Confirm Booking** - You'll get a queue number!

### View Your Appointments
- Click **"Appointments"** in navigation
- See all your upcoming appointments with queue numbers
- Cancel or reschedule if needed

### Check Rewards
- Click **"Rewards"** in navigation
- View your points balance
- Browse available rewards
- Redeem rewards when you have enough points

### View History
- Click **"History"** in navigation
- See all past appointments
- Check points earned

---

## 🔐 ADMIN FLOW

### Login
**URL:** `http://localhost:3000/admin/login`

**Credentials:**
- Username: `admin`
- Password: `admin123`

### Dashboard
- View today's statistics
- See pending appointments
- Check recent activity
- Monitor staff performance

### Manage Services

1. **View Services** - Click "Services" in sidebar
2. **Add New Service:**
   - Click "+ Add Service"
   - Fill in:
     - Name (e.g., "Haircut")
     - Description
     - Details (one per line)
     - Price (₱)
     - Duration (minutes)
     - Points Earned
     - Category
     - Image URL
     - Assign Staff (check boxes)
   - Click "Add Service"

3. **Edit Service:**
   - Click "Edit" on any service
   - Update details
   - Click "Update Service"

4. **Deactivate Service:**
   - Click "Deactivate" to hide from customers

### Manage Staff

1. **View Staff** - Click "Staff" in sidebar
2. **Add New Staff:**
   - Click "+ Add Staff"
   - Fill in name, email, phone
   - Select specialties (services they can perform)
   - Set availability schedule (by day)
   - Click "Add Staff"

3. **Edit Staff:**
   - Click "Edit" on any staff
   - Update details and availability
   - Click "Update Staff"

### Manage Appointments

1. **View All Appointments** - Click "Appointments" in sidebar
2. **Filter:**
   - By status (pending, approved, completed)
   - By date
   - By staff

3. **Actions:**
   - **Approve** - Confirm pending appointments
   - **Assign Staff** - Select staff for appointment
   - **Reschedule** - Change date/time
   - **Complete** - Mark as done (awards points to customer)
   - **Cancel** - Cancel appointment

4. **Add Walk-in:**
   - Click "+ Add Walk-in"
   - Enter customer details
   - Select service and staff
   - Instant queue number assigned

### Queue Management

1. **View Queue** - Click "Queue" in sidebar
2. **See Today's Queue:**
   - Grouped by staff
   - Shows unassigned appointments
   - Real-time queue positions

3. **Actions:**
   - **Assign Staff** - For unassigned appointments
   - **Start** - Begin serving customer
   - **Done** - Complete service

### Manage Rewards

1. **View Rewards** - Click "Rewards" in sidebar
2. **Add New Reward:**
   - Click "+ Add Reward"
   - Fill in name, description
   - Set points required
   - Choose type (discount, free service, gift, voucher)
   - For discounts: set value and type (% or fixed)
   - Select applicable services (optional)
   - Set expiry date (optional)
   - Click "Add Reward"

3. **View Redemptions:**
   - Click "View Redemptions"
   - See all customer reward redemptions
   - Track usage

### View Reports

1. **Click "Reports"** in sidebar
2. **Select Period:**
   - Today
   - Week
   - Month

3. **View:**
   - Total appointments
   - Completion rate
   - Service popularity
   - Staff performance rankings
   - Customer activity
   - Loyalty statistics

4. **Export Data:**
   - Export appointments
   - Export staff data

---

## 🔍 Troubleshooting

### Can't Login as Customer
- Make sure you've run `npm run seed` to create test account
- Or sign up a new account and verify email
- Check server logs for errors

### Can't Book Appointment
- Make sure you're logged in
- Check if services exist (run `npm run seed`)
- Check server logs for errors

### Services Not Showing
- Run `npm run seed` to create sample services
- Or add services via admin panel

### Queue Number Not Generated
- This is now fixed! Queue numbers generate automatically
- Format: `Q[YYYYMMDD]-[###]`
- Example: `Q20251127-001`

---

## 📊 Test Everything

Run the test script to verify all core functionality:

```bash
npm test
```

This checks:
- ✅ Admin account
- ✅ Customer account
- ✅ Services
- ✅ Staff
- ✅ Service creation
- ✅ Appointment creation
- ✅ Queue number generation

---

## 🎯 Key Features Summary

### Customer Side:
- Email verification with OTP
- Browse services with details
- Book appointments with date/time selection
- View queue numbers
- Track appointments
- Earn and redeem loyalty points
- View appointment history

### Admin Side:
- Secure dashboard
- Full CRUD for services
- Full CRUD for staff
- Appointment management
- Queue management
- Walk-in registration
- Rewards program management
- Performance reports
- Data export

---

## 📞 Need Help?

1. Check server logs in terminal
2. Run `npm test` to verify setup
3. Check SETUP.md for detailed configuration
4. Check README.md for full documentation

---

**Happy Managing! 🎉**
