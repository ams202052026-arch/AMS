# Manual Test Guide - Service Update Functionality

## Issue Resolution Status
The "Not Found" error when updating services has been fixed. The system now properly handles multipart form submissions with method override.

## How to Test Service Updates

### Method 1: Through the Application (Recommended)

1. **Login to the System**
   - Go to `http://localhost:3000`
   - Login with: `alphi.fidelino@lspu.edu.ph` / `password123`

2. **Switch to Business Mode**
   - Click "Switch to Business" in the header
   - You should be redirected to the business dashboard

3. **Navigate to Services**
   - Click "Services" in the sidebar
   - You should see the services list page

4. **Create a Service (if none exist)**
   - Click "Add New Service"
   - Fill in the required fields:
     - Name: "Test Service"
     - Price: 100
     - Duration: 60
     - Category: Hair
   - Click "Add Service"

5. **Edit the Service**
   - Find the service in the list
   - Click "Edit" button
   - Modify any fields (e.g., change name to "Updated Test Service")
   - Optionally upload an image
   - Click "Update Service"

6. **Verify the Update**
   - You should be redirected back to the services list
   - The service should show the updated information

### Method 2: Using the Test HTML Form

1. **Open the Test Form**
   - Open `test-service-update.html` in your browser
   - Make sure you're logged in to AMS in another tab

2. **Get a Service ID**
   - Go to the services page in AMS
   - Click "Edit" on any service
   - Copy the service ID from the URL (the long string after `/services/`)

3. **Fill the Test Form**
   - Paste the service ID in the form
   - Fill in the update details
   - Click "Update Service"

4. **Check the Result**
   - You should be redirected to the services list
   - The service should be updated

## Expected Behavior

### ✅ Success Scenarios
- **Service Update**: Form submits successfully, redirects to services list
- **Image Upload**: New images are uploaded to Cloudinary
- **Form Validation**: Required fields are validated
- **Method Override**: POST requests with `_method=PUT` work correctly

### ❌ Error Scenarios That Should NOT Happen
- ~~"Cannot POST /business-owner/services/[id]"~~ - **FIXED**
- ~~"Not Found" when updating services~~ - **FIXED**
- ~~`req.body` undefined errors~~ - **FIXED**

## Technical Details

### What Was Fixed
1. **Method Override**: Enhanced method-override middleware to work with multipart forms
2. **Route Handling**: Added POST route that handles `_method=PUT` for service updates
3. **Multer Integration**: Fixed multer configuration to work with optional file uploads
4. **Error Handling**: Added proper error handling for all scenarios

### Current Route Configuration
- `POST /business-owner/services` → Create new service
- `PUT /business-owner/services/:id` → Update service (direct PUT)
- `POST /business-owner/services/:id` → Update service (with `_method=PUT`)

### Form Configuration
```html
<form method="POST" enctype="multipart/form-data">
    <input type="hidden" name="_method" value="PUT">
    <!-- Other form fields -->
</form>
```

## Troubleshooting

### If You Still Get "Not Found"
1. **Check the Service ID**: Make sure you're using a valid service ID
2. **Check Login Status**: Ensure you're logged in and in business mode
3. **Check Form Fields**: Ensure the `_method=PUT` field is present
4. **Check Browser Console**: Look for any JavaScript errors

### If You Get Authentication Errors
1. **Clear Browser Cache**: Clear cookies and cache
2. **Re-login**: Login again and switch to business mode
3. **Check Session**: Make sure the session is active

### If Images Don't Upload
1. **Check File Size**: Images must be under 2MB
2. **Check File Type**: Only JPG, PNG, WEBP are allowed
3. **Check Cloudinary Config**: Ensure environment variables are set

## Status: ✅ RESOLVED

The service update functionality is now working correctly. Both direct PUT requests and POST requests with method override are supported, and the Cloudinary image upload integration is fully functional.