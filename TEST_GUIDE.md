# 🧪 Testing Guide - Business Owner Registration

## 🚀 Quick Test Steps

### Step 1: Access Registration Page

Open your browser and go to:
```
http://localhost:3000/business-owner/register
```

---

### Step 2: Fill Registration Form

Use these test data:

#### Personal Information
```
First Name: Maria
Last Name: Santos
Email: maria@beautysalon.com
Phone Number: 0917-123-4567
Password: password123
Confirm Password: password123
```

#### Business Information
```
Business Name: Maria's Beauty Salon
Business Type: Salon
Business Email: info@mariasbeauty.com
Business Phone: 0917-123-4567
Website: (leave blank or add https://mariasbeauty.com)
Description: Professional beauty and salon services in Metro Manila
```

#### Business Address
```
Street Address: 456 Rizal Avenue
Barangay: San Miguel
City: Manila
Province: Metro Manila
Zip Code: 1005
```

---

### Step 3: Submit Form

Click **"Continue to Document Upload →"**

**Expected Result:**
- Form submits successfully
- Redirects to document upload page
- Shows progress indicator (Step 2 of 3)

---

### Step 4: Document Upload Page

You'll see the document upload interface.

**For Testing - Choose One:**

**Option A: Skip Documents (Quick Test)**
- Click **"Skip for Now"** button
- Confirm the dialog
- Should redirect to success page

**Option B: Upload Documents (Full Test)**
- Upload sample files for:
  - DTI Certificate (required)
  - Business Permit (required)
  - Valid ID (required)
  - BIR Certificate (optional)
- Click **"Submit for Verification ✓"**

---

### Step 5: Success Page

You should see:
- ✅ Success message
- Business name displayed
- "What Happens Next" information
- Next steps guide

---

## 🔍 Verify in Database

After registration, check the database:

### Connect to MongoDB
```bash
mongosh AMS
```

### Check User Created
```javascript
db.users.find({ email: "maria@beautysalon.com" }).pretty()
```

**Expected:**
```javascript
{
  _id: ObjectId("..."),
  firstName: "Maria",
  lastName: "Santos",
  email: "maria@beautysalon.com",
  role: "business_owner",
  isVerified: false,
  businessId: ObjectId("..."),
  // ... other fields
}
```

### Check Business Created
```javascript
db.businesses.find({ businessName: "Maria's Beauty Salon" }).pretty()
```

**Expected:**
```javascript
{
  _id: ObjectId("..."),
  ownerId: ObjectId("..."),
  businessName: "Maria's Beauty Salon",
  businessType: "salon",
  verificationStatus: "pending",
  address: {
    street: "456 Rizal Avenue",
    barangay: "San Miguel",
    city: "Manila",
    province: "Metro Manila"
  },
  // ... other fields
}
```

---

## ✅ What to Check

### Registration Form
- [ ] Page loads correctly
- [ ] All fields are visible
- [ ] Required fields marked with *
- [ ] Form validation works
- [ ] Password confirmation works
- [ ] Responsive design works

### Document Upload
- [ ] Page loads after registration
- [ ] Progress indicator shows Step 2
- [ ] File upload buttons work
- [ ] File name displays after selection
- [ ] Skip button works
- [ ] Submit button works

### Success Page
- [ ] Shows success message
- [ ] Displays business name
- [ ] Shows next steps
- [ ] "Back to Home" button works

### Database
- [ ] User created with role "business_owner"
- [ ] User isVerified is false
- [ ] Business created with status "pending"
- [ ] User.businessId links to Business._id
- [ ] Business.ownerId links to User._id

---

## 🐛 Common Issues & Solutions

### Issue: Page not loading
**Solution:**
- Check if server is running: `npm start`
- Check URL is correct: `http://localhost:3000/business-owner/register`

### Issue: Form submission error
**Solution:**
- Check browser console for errors
- Check server logs for errors
- Verify all required fields are filled

### Issue: "Email already exists"
**Solution:**
- Use a different email
- Or delete the test user from database:
  ```javascript
  db.users.deleteOne({ email: "maria@beautysalon.com" })
  db.businesses.deleteOne({ businessName: "Maria's Beauty Salon" })
  ```

### Issue: Redirect not working
**Solution:**
- Check session is working
- Check routes are configured correctly
- Check controller is handling redirect

---

## 🧪 Additional Tests

### Test 1: Duplicate Email
1. Register with same email twice
2. Should show error: "Email already exists"

### Test 2: Duplicate Business Name
1. Register with same business name
2. Should show error: "Business name already exists"

### Test 3: Password Mismatch
1. Enter different passwords
2. Should show error: "Passwords do not match"

### Test 4: Missing Required Fields
1. Leave required fields empty
2. Browser should show validation error

### Test 5: Login Before Approval
1. Try to login with business owner credentials
2. Should fail because isVerified is false

---

## 📊 Test Results Template

```
✅ Registration Form
   ✅ Page loads
   ✅ Form validation works
   ✅ Submit successful

✅ Document Upload
   ✅ Page loads
   ✅ Skip button works
   ✅ Redirects to success

✅ Success Page
   ✅ Shows correct message
   ✅ Displays business name

✅ Database
   ✅ User created
   ✅ Business created
   ✅ Correct status (pending)

✅ Overall: PASSED
```

---

## 🎯 Next Steps After Testing

If all tests pass:
1. ✅ Registration system is working
2. ✅ Ready to build admin verification
3. ✅ Can proceed to Phase 5

If tests fail:
1. Note the error
2. Check server logs
3. Check browser console
4. Fix the issue
5. Test again

---

## 📞 Quick Commands

**Start Server:**
```bash
npm start
```

**Check Database:**
```bash
mongosh AMS
```

**View Users:**
```javascript
db.users.find().pretty()
```

**View Businesses:**
```javascript
db.businesses.find().pretty()
```

**Delete Test Data:**
```javascript
db.users.deleteOne({ email: "maria@beautysalon.com" })
db.businesses.deleteOne({ businessName: "Maria's Beauty Salon" })
```

---

**Happy Testing!** 🚀

Let me know if you encounter any issues!
