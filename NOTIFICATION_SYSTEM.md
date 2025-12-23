# AMS Notification System - Complete Guide

## Ano-ano ang Nag-nonotify sa System?

Ang AMS ay may comprehensive notification system na nag-send ng notifications sa mga customers para sa iba't ibang events. Narito ang complete list:

## 📅 APPOINTMENT-RELATED NOTIFICATIONS

### 1. **Booking Confirmed** (`appointment_confirm`)
**Kailan**: Kapag nag-book ng appointment ang customer
**Saan**: `controllers/appointments.js` - `bookAppointment()` function
**Message**: 
```
"Booking Confirmed! 
Your appointment has been booked successfully.

Service: [Service Name]
Date: [Date]
Time: [Time Slot]
Staff: [Staff Name]
Queue Number: [Queue Number]

We'll notify you when it's your turn!"
```

### 2. **Appointment Approved** (`appointment_confirm`)
**Kailan**: Kapag nag-approve ang admin ng pending appointment
**Saan**: `controllers/admin/appointments.js` - `approveAppointment()` function
**Message**: Confirmation details with queue number

### 3. **Appointment Reminder** (`appointment_reminder`)
**Kailan**: 24 hours before ang appointment (automated via scheduler)
**Saan**: `services/notificationService.js` - `sendAppointmentReminders()` function
**Schedule**: Runs every hour via cron job
**Message**:
```
"Reminder: Appointment Tomorrow
Don't forget your appointment tomorrow!

Service: [Service Name]
Date: [Date]
Time: [Time Slot]
Staff: [Staff Name]
Queue: [Queue Number]

Need to reschedule? Visit your appointments page."
```

### 4. **Ready to Serve** (`queue_update`)
**Kailan**: Kapag naging "in-progress" ang appointment status
**Saan**: `services/notificationService.js` - `sendReadyToServeNotification()` function
**Message**:
```
"It's Your Turn Now!
We're ready to serve you! Please come to the service area immediately.

Queue Number: [Queue Number]
Service: [Service Name]
Staff: [Staff Name]

Please proceed to [Staff Name]'s station. We're excited to serve you!"
```

### 5. **Appointment Rescheduled** (`appointment_update`)
**Kailan**: Kapag nag-reschedule ng appointment
**Saan**: `controllers/appointments.js` - `rescheduleAppointment()` function
**Message**: New appointment details

### 6. **Appointment Cancelled** (`appointment_cancelled`)
**Kailan**: Kapag na-cancel ang appointment (by admin or customer)
**Saan**: 
- `controllers/admin/appointments.js` - `cancelAppointment()` function
- `services/scheduler.js` - Auto-cancel expired appointments
**Message**: Cancellation details with reason

### 7. **Service Complete** (`reward_update`)
**Kailan**: Kapag na-complete ang appointment
**Saan**: `controllers/admin/appointments.js` - `completeAppointment()` function
**Message**:
```
"🎉 Service Complete - Thank You!
Your [Service Name] appointment has been completed successfully!

You earned [Points] reward points!
Total Points: [Total Points]

Thank you for choosing our service. We hope to see you again soon!"
```

## 🎁 REWARD-RELATED NOTIFICATIONS

### 8. **Points Milestone** (`reward_milestone`)
**Kailan**: Kapag umabot sa certain points threshold (automated)
**Saan**: `services/notificationService.js` - `checkPointsMilestones()` function
**Schedule**: Runs every hour via cron job
**Minimum**: 20 points
**Message**:
```
"You've Earned Enough Points!
Congratulations! You now have [Points] points.

You can redeem:
• [Reward 1] ([Points] pts)
• [Reward 2] ([Points] pts)
• [Reward 3] ([Points] pts)

View rewards to redeem now!"
```

### 9. **Reward Redeemed** (`reward_redeemed`)
**Kailan**: Kapag nag-redeem ng reward
**Saan**: `controllers/rewards.js` - `redeemReward()` function
**Message**:
```
"Reward Redeemed
You have successfully redeemed: [Reward Name]

Points Used: [Points]
Remaining Points: [Remaining Points]

Enjoy your reward!"
```

## 🏢 BUSINESS-RELATED NOTIFICATIONS

### 10. **Business Application Approved** (`business_approved`)
**Kailan**: Kapag na-approve ang business application
**Saan**: `controllers/admin/businesses.js` - `approveBusiness()` function
**Message**:
```
"🎉 Business Approved!
Congratulations! Your business '[Business Name]' has been approved.

You can now:
• Switch to Business Mode
• Manage your services and staff
• Accept customer appointments
• Access business dashboard

Welcome to the AMS business community!"
```

### 11. **Business Application Rejected** (`business_rejected`)
**Kailan**: Kapag na-reject ang business application
**Saan**: `controllers/admin/businesses.js` - `rejectBusiness()` function
**Message**:
```
"❌ Business Application Rejected
Unfortunately, your business application has been rejected.

Reason: [Rejection Reason]

You can reapply with updated information and documents.
Please ensure all requirements are met before reapplying."
```

### 12. **Business Suspended** (`business_suspended`)
**Kailan**: Kapag na-suspend ang business
**Saan**: `controllers/admin/businesses.js` - `suspendBusiness()` function
**Message**:
```
"⚠️ Business Suspended
Your business '[Business Name]' has been temporarily suspended.

Reason: [Suspension Reason]

Please contact support for more information on how to resolve this issue."
```

### 13. **Business Reactivated** (`business_reactivated`)
**Kailan**: Kapag na-reactivate ang suspended business
**Saan**: `controllers/admin/businesses.js` - `reactivateBusiness()` function
**Message**:
```
"✅ Business Reactivated
Great news! Your business '[Business Name]' has been reactivated.

You can now resume:
• Accepting appointments
• Managing services and staff
• Accessing business features

Thank you for resolving the issues!"
```

## 🤖 AUTOMATED NOTIFICATIONS

### Scheduler Service (`services/scheduler.js`)
Ang system ay may automated scheduler na tumatakbo every hour:

1. **Appointment Reminders** - 24 hours before appointment
2. **Points Milestone Check** - Check kung may bagong milestone
3. **Auto-cancel Expired** - Cancel pending appointments na expired na
4. **Ready to Serve** - Notify kapag ready na ang service

### Cron Jobs
```javascript
// Runs every hour
cron.schedule('0 * * * *', async () => {
    await sendAppointmentReminders();
    await checkPointsMilestones();
    await autoCancelExpiredPendingAppointments();
});
```

## 📊 NOTIFICATION TYPES SUMMARY

| Type | Trigger | Frequency | Automated |
|------|---------|-----------|-----------|
| `appointment_confirm` | Booking/Approval | Per action | ❌ |
| `appointment_reminder` | 24hrs before | Daily | ✅ |
| `appointment_update` | Reschedule | Per action | ❌ |
| `appointment_cancelled` | Cancellation | Per action | ✅/❌ |
| `queue_update` | Ready to serve | Per action | ❌ |
| `reward_update` | Service complete | Per action | ❌ |
| `reward_redeemed` | Redeem reward | Per action | ❌ |
| `reward_milestone` | Points threshold | Hourly check | ✅ |
| `business_approved` | Admin approval | Per action | ❌ |
| `business_rejected` | Admin rejection | Per action | ❌ |
| `business_suspended` | Admin suspension | Per action | ❌ |
| `business_reactivated` | Admin reactivation | Per action | ❌ |

## 🎯 KEY FEATURES

### Real-time Updates
- Notification badge sa header updates every 30 seconds
- Instant notifications kapag may bagong event
- Visual indicators para sa read/unread status

### Smart Notifications
- Hindi mag-duplicate ang reminders
- Points milestone notifications may minimum threshold
- Expired appointments auto-cancel with notification

### User Experience
- Clear, detailed messages
- Actionable information
- Professional tone
- Emoji indicators para sa easy recognition

## 📱 How Users Receive Notifications

1. **Header Badge** - Shows unread count
2. **Notifications Page** - Complete list with actions
3. **Real-time Updates** - Auto-refresh every 30 seconds
4. **Interactive Features** - Mark as read, delete, clear all

Ang notification system ay fully integrated sa lahat ng major features ng AMS, ensuring na ang users ay laging updated sa lahat ng important events!