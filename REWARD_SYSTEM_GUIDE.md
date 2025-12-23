# AMS Reward System & Appointment Status Guide

## 🎁 **REWARD/POINTS SYSTEM EXPLAINED**

### **How Points Work:**

#### **1. Earning Points**
```
Customer Books Appointment → Service Completed → Points Awarded
```

**Points Sources:**
- **Service Completion**: Each service has `pointsEarned` value (default: 10 points)
- **Automatic Award**: Points given when business owner marks appointment as "completed"
- **Stored in Customer Account**: Points accumulate in `user.rewardPoints`

#### **2. Points Per Service**
```javascript
// Service Model
pointsEarned: {
    type: Number,
    default: 10  // Default points per service
}
```

**Examples:**
- Hair Cut: 10 points
- Hair Color: 15 points  
- Facial: 12 points
- Massage: 20 points

#### **3. Using Points (Redemption)**
```
Customer Has Points → Views Available Rewards → Redeems Reward → Points Deducted
```

**Redemption Process:**
1. Customer visits `/rewards` page
2. Sees available rewards with point requirements
3. Clicks "Redeem" if they have enough points
4. Points deducted from account
5. Redemption record created
6. Notification sent to customer

## 🏆 **REWARD TYPES**

### **Discount Rewards**
```javascript
// Reward Structure
{
    name: "10% Off Next Service",
    description: "Get 10% discount on your next appointment",
    pointsRequired: 50,
    type: "discount",
    discountValue: 10,
    discountType: "percentage"
}
```

### **Reward Categories:**
1. **Percentage Discounts**: 5%, 10%, 15%, 20% off
2. **Fixed Amount Discounts**: ₱50 off, ₱100 off, ₱200 off
3. **Free Services**: Free basic service after X points

### **Redemption Status:**
- **Active**: Ready to use
- **Pending**: Waiting for approval
- **Used**: Already applied to appointment
- **Expired**: No longer valid

## 📅 **APPOINTMENT STATUS EXPLAINED**

### **Complete Status Flow:**
```
pending → confirmed/approved → in-progress → completed
                ↓
            cancelled/no-show
```

### **Status Definitions:**

#### **1. 🟡 PENDING**
- **Meaning**: Appointment booked but waiting for confirmation
- **Who Sees**: Customer sees "Pending Approval"
- **Actions**: Business owner can confirm/cancel
- **Notifications**: No notification sent yet

#### **2. ✅ CONFIRMED/APPROVED**
- **Meaning**: Business owner accepted the appointment
- **Who Sees**: Customer sees "Confirmed" 
- **Actions**: Can start service, cancel, or mark no-show
- **Notifications**: "Appointment Confirmed!" sent to customer

#### **3. 🔄 IN-PROGRESS**
- **Meaning**: Service is currently being provided
- **Who Sees**: Customer sees "Service in Progress"
- **Actions**: Can complete or cancel
- **Notifications**: "It's Your Turn Now!" sent to customer

#### **4. 🎉 COMPLETED**
- **Meaning**: Service finished successfully
- **Who Sees**: Customer sees "Completed"
- **Actions**: No further actions needed
- **Notifications**: "Service Complete - Thank You!" + points awarded

#### **5. ❌ CANCELLED**
- **Meaning**: Appointment was cancelled
- **Who Sees**: Both see "Cancelled"
- **Actions**: Can book new appointment
- **Notifications**: "Appointment Cancelled" with reason

#### **6. ⚠️ NO-SHOW**
- **Meaning**: Customer didn't show up
- **Who Sees**: Customer sees "Missed Appointment"
- **Actions**: Can book new appointment
- **Notifications**: "Missed Appointment" reminder

#### **7. 🔄 RESCHEDULED**
- **Meaning**: Appointment moved to different date/time
- **Who Sees**: Both see new date/time
- **Actions**: Normal flow continues
- **Notifications**: "Appointment Rescheduled" with new details

## 💰 **POINTS CALCULATION EXAMPLES**

### **Scenario 1: Regular Service**
```
Service: Hair Cut (₱200, 10 points)
Customer completes appointment
→ Earns: 10 points
→ Total: Previous points + 10
→ Notification: "You earned 10 points!"
```

### **Scenario 2: Premium Service**
```
Service: Hair Color (₱800, 20 points)
Customer completes appointment  
→ Earns: 20 points
→ Total: Previous points + 20
→ Notification: "You earned 20 points!"
```

### **Scenario 3: Using Rewards**
```
Customer has: 100 points
Redeems: "10% Off" (50 points required)
→ Points deducted: 50
→ Remaining: 50 points
→ Gets: 10% discount voucher
→ Notification: "Reward redeemed!"
```

## 🔄 **COMPLETE CUSTOMER JOURNEY**

### **1. Book Appointment**
```
Status: pending
Points: No change
Notification: None (until confirmed)
```

### **2. Business Confirms**
```
Status: confirmed
Points: No change  
Notification: "Appointment Confirmed!"
```

### **3. Service Starts**
```
Status: in-progress
Points: No change
Notification: "It's Your Turn Now!"
```

### **4. Service Completes**
```
Status: completed
Points: +10 (or service-specific)
Notification: "Service Complete - Thank You! You earned 10 points!"
```

### **5. Customer Redeems Reward**
```
Points: -50 (for reward)
Gets: Discount voucher
Notification: "Reward Redeemed!"
```

## 📊 **POINTS TRACKING**

### **Customer Account:**
```javascript
// User Model
rewardPoints: {
    type: Number,
    default: 0  // Starts with 0 points
}
```

### **Points History:**
- **Earned**: When appointments completed
- **Spent**: When rewards redeemed
- **Balance**: Current available points
- **Tracking**: All transactions logged

### **Redemption Records:**
```javascript
// Redemption Model
{
    customer: ObjectId,
    reward: ObjectId,
    pointsUsed: Number,
    status: 'active|used|expired',
    redeemedAt: Date
}
```

## 🎯 **BUSINESS BENEFITS**

### **Customer Retention:**
- Points encourage repeat visits
- Rewards create loyalty
- Gamification increases engagement

### **Revenue Growth:**
- Customers return for rewards
- Higher lifetime value
- Word-of-mouth referrals

### **Data Insights:**
- Track customer preferences
- Popular services analysis
- Redemption patterns

## 📱 **USER INTERFACE**

### **Customer Rewards Page:**
- **Current Points**: Display total points
- **Available Rewards**: List redeemable items
- **My Redemptions**: History of redeemed rewards
- **Points History**: Earned/spent tracking

### **Appointment Status Display:**
- **Color Coding**: Visual status indicators
- **Status Badges**: Clear status labels
- **Action Buttons**: Context-appropriate actions
- **Progress Indicators**: Visual appointment flow

## ✅ **SUMMARY**

### **Points System:**
- ✅ Earn points by completing appointments
- ✅ Points vary by service type
- ✅ Redeem points for discounts
- ✅ Automatic point awarding
- ✅ Real-time balance updates

### **Appointment Statuses:**
- ✅ Clear progression from booking to completion
- ✅ Appropriate notifications for each status
- ✅ Business owner controls status changes
- ✅ Customer sees real-time updates

**The reward system encourages customer loyalty while appointment statuses provide clear communication throughout the service journey!**