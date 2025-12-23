# AMS Setup Guide

Complete setup instructions for the Appointment Management System.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Gmail account (for email verification)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/ams
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ams

# Server Port
PORT=3000

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Session Secret (change in production)
SESSION_SECRET=your-secret-key-here
```

#### Getting Gmail App Password:
1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security → App passwords
4. Generate a new app password for "Mail"
5. Use this password in EMAIL_PASS

### 3. Seed the Database

Run the seed script to create initial data:

```bash
npm run seed
```

This will create:
- Default admin account (username: `admin`, password: `admin123`)
- 8 sample services (Haircut, Hair Coloring, Shaving, etc.)
- 5 sample staff members
- 4 sample rewards

### 4. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:3000`

## Access Points

### Customer Portal
- Landing Page: `http://localhost:3000/`
- Sign Up: `http://localhost:3000/signup`
- Login: `http://localhost:3000/login`
- Home (Services): `http://localhost:3000/home`

### Admin Portal
- Admin Login: `http://localhost:3000/admin/login`
- Admin Dashboard: `http://localhost:3000/admin/dashboard`

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **IMPORTANT:** Change the admin password immediately after first login!

## Testing the System

### Test Customer Flow:

1. **Register a Customer**
   - Go to `/signup`
   - Fill in details
   - Check email for OTP code
   - Verify with OTP
   - Login

2. **Book an Appointment**
   - Browse services on home page
   - Click "Book Now"
   - Select date, time, and staff
   - Confirm booking
   - Note your queue number

3. **Check Appointments**
   - Go to "Appointments" tab
   - View your upcoming appointments
   - Try canceling or rescheduling

4. **View Rewards**
   - Go to "Rewards" tab
   - Check your points balance
   - Browse available rewards

### Test Admin Flow:

1. **Login as Admin**
   - Go to `/admin/login`
   - Use default credentials

2. **Manage Appointments**
   - View all appointments
   - Approve pending appointments
   - Assign staff to appointments
   - Complete appointments (awards points)

3. **Manage Queue**
   - View today's queue
   - Add walk-in customers
   - Start serving appointments
   - Mark as complete

4. **Manage Services**
   - Add new services
   - Edit existing services
   - Assign staff to services

5. **Manage Staff**
   - Add new staff members
   - Set availability schedules
   - View performance stats

6. **View Reports**
   - Check appointment statistics
   - View service popularity
   - Monitor staff performance

## Troubleshooting

### MongoDB Connection Issues

**Error:** `MongooseServerSelectionError`

**Solution:**
- Check if MongoDB is running: `mongod --version`
- Verify MONGODB_URI in `.env`
- For local MongoDB: `mongodb://localhost:27017/ams`
- For MongoDB Atlas: Check network access and credentials

### Email Verification Not Working

**Error:** Email not sending

**Solution:**
- Verify EMAIL_USER and EMAIL_PASS in `.env`
- Use Gmail App Password, not regular password
- Check if 2FA is enabled on Gmail account
- Check spam folder for verification emails

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
- Change PORT in `.env` to another port (e.g., 3001)
- Or kill the process using port 3000:
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  
  # Linux/Mac
  lsof -ti:3000 | xargs kill
  ```

### Session Issues

**Error:** Session not persisting

**Solution:**
- Clear browser cookies
- Check SESSION_SECRET in `.env`
- Restart the server

## Database Schema

### Collections Created:
- `customers` - Customer accounts
- `admins` - Admin accounts
- `services` - Available services
- `staff` - Staff members
- `appointments` - Bookings
- `notifications` - Customer notifications
- `rewards` - Available rewards
- `redemptions` - Reward redemptions
- `otps` - Email verification codes (auto-expires)

## Production Deployment

### Before Deploying:

1. **Change Admin Password**
   - Login to admin panel
   - Update password in database

2. **Update Environment Variables**
   - Use strong SESSION_SECRET
   - Use production MongoDB URI
   - Configure production email service

3. **Security Checklist**
   - Enable HTTPS
   - Set secure cookie options
   - Add rate limiting
   - Implement CSRF protection
   - Add input validation
   - Enable MongoDB authentication

4. **Performance Optimization**
   - Add database indexes
   - Enable compression
   - Set up caching
   - Optimize images

### Deployment Platforms:

**Heroku:**
```bash
heroku create ams-app
heroku config:set MONGODB_URI=your_uri
heroku config:set EMAIL_USER=your_email
heroku config:set EMAIL_PASS=your_password
git push heroku main
```

**Vercel:**
- Already configured with `vercel.json`
- Set environment variables in Vercel dashboard
- Deploy: `vercel --prod`

**Railway/Render:**
- Connect GitHub repository
- Set environment variables
- Deploy automatically

## Maintenance

### Regular Tasks:

1. **Backup Database**
   ```bash
   mongodump --uri="mongodb://localhost:27017/ams" --out=./backup
   ```

2. **Clean Old OTPs**
   - OTPs auto-expire after 60 seconds
   - MongoDB TTL index handles cleanup

3. **Monitor Logs**
   - Check server logs for errors
   - Monitor MongoDB performance

4. **Update Dependencies**
   ```bash
   npm outdated
   npm update
   ```

## Support

For issues or questions:
- Check the README.md
- Review error logs
- Contact development team

## License

ISC
