# Cloudinary Setup Guide

## Overview
Cloudinary is used for storing business documents and images uploaded by business owners during registration.

## Why Cloudinary?
- ✅ Free tier: 25GB storage, 25GB bandwidth/month
- ✅ Automatic image optimization
- ✅ CDN delivery for fast loading
- ✅ Supports images and PDFs
- ✅ Easy integration with Node.js

## Setup Steps

### 1. Create Cloudinary Account
1. Go to: https://cloudinary.com/users/register/free
2. Sign up with your email
3. Verify your email address
4. Login to your dashboard

### 2. Get Your Credentials
1. Go to: https://cloudinary.com/console
2. You'll see your **Dashboard** with:
   - **Cloud Name** (e.g., `dxyz123abc`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (click "Reveal" to see it)

### 3. Update .env File
Open your `.env` file and replace the placeholder values:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

**Example:**
```env
CLOUDINARY_CLOUD_NAME=dxyz123abc
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=AbCdEfGhIjKlMnOpQrStUvWxYz
```

### 4. Restart Your Server
```bash
# Stop the server (Ctrl+C)
# Start again
npm start
```

## What Gets Uploaded?

### Business Documents
Uploaded to folder: `business-documents/`
- DTI Registration Certificate
- Business Permit
- Valid ID (Owner)
- Proof of Address

**File Limits:**
- Max size: 5MB per file
- Formats: JPG, JPEG, PNG, PDF

### Business Logos (Future)
Uploaded to folder: `business-logos/`
- Business logo/profile picture

**File Limits:**
- Max size: 2MB
- Formats: JPG, JPEG, PNG

## Testing Document Upload

### 1. Register as Business Owner
```
URL: http://localhost:3000/business-owner/register
```

Fill in all required fields and submit.

### 2. Upload Documents
You'll be redirected to the document upload page.

**Upload at least one document:**
- DTI Registration (required)
- Business Permit (required)
- Valid ID (required)
- Proof of Address (optional)

### 3. View Documents as Super Admin
```
1. Login as super admin: http://localhost:3000/admin/login
2. Go to Businesses: http://localhost:3000/admin/businesses
3. Click on the pending business
4. View uploaded documents
```

## Folder Structure in Cloudinary

```
Your Cloudinary Account
├── business-documents/
│   ├── abc123_dti.pdf
│   ├── abc123_permit.jpg
│   ├── abc123_id.jpg
│   └── abc123_address.pdf
└── business-logos/
    ├── business1_logo.png
    └── business2_logo.jpg
```

## Troubleshooting

### Error: "Invalid cloud_name"
**Solution:** Check that `CLOUDINARY_CLOUD_NAME` in `.env` matches your dashboard.

### Error: "Invalid API key"
**Solution:** Check that `CLOUDINARY_API_KEY` in `.env` is correct (numbers only).

### Error: "Invalid API secret"
**Solution:** 
1. Go to Cloudinary dashboard
2. Click "Reveal" on API Secret
3. Copy the exact value to `.env`

### Error: "File too large"
**Solution:** 
- Documents: Max 5MB
- Logos: Max 2MB
- Compress your files before uploading

### Documents not showing in admin panel
**Solution:**
1. Check if files were uploaded to Cloudinary dashboard
2. Check browser console for errors
3. Verify business has `verificationDocuments` array in database

## Viewing Uploaded Files

### In Cloudinary Dashboard
1. Go to: https://cloudinary.com/console/media_library
2. Navigate to `business-documents` folder
3. Click on any file to view/download

### In Admin Panel
1. Login as super admin
2. Go to Businesses page
3. Click on any business
4. Scroll to "Verification Documents" section
5. Click "View Document" links

## Security Features

✅ **File Type Validation:** Only allows JPG, JPEG, PNG, PDF
✅ **File Size Limits:** 5MB for documents, 2MB for logos
✅ **Automatic Optimization:** Images are resized to max 1000x1000px
✅ **Secure URLs:** Files are served via HTTPS
✅ **Access Control:** Only super admins can view documents

## Free Tier Limits

Cloudinary Free Plan includes:
- **Storage:** 25GB
- **Bandwidth:** 25GB/month
- **Transformations:** 25 credits/month
- **Images/Videos:** Unlimited

**Estimated Capacity:**
- ~5,000 business documents (assuming 5MB average)
- ~12,500 business logos (assuming 2MB average)

## Upgrade Options

If you exceed free tier limits:
- **Plus Plan:** $89/month - 100GB storage, 100GB bandwidth
- **Advanced Plan:** $224/month - 200GB storage, 200GB bandwidth

For a small to medium platform, the free tier should be sufficient for the first few hundred businesses.

## Alternative: Local Storage

If you don't want to use Cloudinary, you can store files locally:

**Pros:**
- No external dependency
- No bandwidth limits
- Free

**Cons:**
- Files stored on your server
- No CDN (slower loading)
- Manual backup needed
- Harder to scale

**To use local storage instead:**
1. Don't set up Cloudinary credentials
2. Use multer with local disk storage
3. Serve files from `/uploads` folder

---

**Status:** Ready to use after adding credentials to `.env`
**Documentation:** https://cloudinary.com/documentation/node_integration
