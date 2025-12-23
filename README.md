# AMS - Appointment Management System

Digital Queue and Appointment Management System for salon/spa businesses.

## Features

### Customer Features
- ✅ User registration with email verification (OTP)
- ✅ Browse available services
- ✅ Book appointments with preferred staff
- ✅ View upcoming appointments with queue numbers
- ✅ Appointment history
- ✅ Loyalty rewards system (earn and redeem points)
- ✅ Real-time notifications
- ✅ Cancel/reschedule appointments

### Admin Features
- ✅ Secure admin dashboard
- ✅ Manage services (add, edit, deactivate)
- ✅ Manage staff (add, edit, set availability)
- ✅ Appointment management (approve, cancel, reschedule, complete)
- ✅ Queue management (real-time queue view by staff)
- ✅ Walk-in customer registration
- ✅ Staff performance tracking (KPIs)
- ✅ Reports dashboard (appointments, services, staff performance)
- ✅ Loyalty program management

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **View Engine:** EJS
- **Session Management:** express-session
- **Email:** Nodemailer (for OTP verification)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=3000
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

4. Seed the database with initial data:
   ```bash
   node scripts/seed.js
   ```

5. Start the server:
   ```bash
   npm start
   ```
   Or for development:
   ```bash
   npm run dev
   ```

## Default Admin Credentials

After running the seed script:
- **Username:** admin
- **Password:** admin123

⚠️ **Important:** Change the admin password in production!

## Project Structure

```
AMS/
├── config/          # Database configuration
├── controllers/     # Route controllers
│   ├── admin/      # Admin controllers
│   └── ...         # Customer controllers
├── middleware/      # Custom middleware
├── models/         # Mongoose models
├── public/         # Static files (CSS, JS, images)
│   ├── css/
│   ├── js/
│   └── image/
├── routes/         # Express routes
│   ├── admin/
│   └── ...
├── scripts/        # Utility scripts (seed, etc.)
├── services/       # Business logic services
├── views/          # EJS templates
│   ├── admin/
│   ├── partials/
│   └── ...
└── server.js       # Application entry point
```

## API Endpoints

### Customer Routes
- `GET /` - Landing page
- `GET /signup` - Registration page
- `POST /signup` - Register new customer
- `GET /login` - Login page
- `POST /login` - Authenticate customer
- `GET /home` - Customer dashboard
- `GET /appointments` - View appointments
- `POST /appointments/book` - Book new appointment
- `GET /rewards` - View rewards
- `GET /history` - Appointment history
- `GET /api/notifications` - Get notifications

### Admin Routes
- `GET /admin/login` - Admin login
- `GET /admin/dashboard` - Admin dashboard
- `GET /admin/appointments` - Manage appointments
- `GET /admin/services` - Manage services
- `GET /admin/staff` - Manage staff
- `GET /admin/queue` - Queue management
- `GET /admin/reports` - View reports

## Database Models

- **Customer** - User accounts with reward points
- **Admin** - Admin accounts
- **Service** - Available services
- **Staff** - Staff members with availability
- **Appointment** - Bookings with queue numbers
- **Notification** - Customer notifications
- **Reward** - Available rewards
- **Redemption** - Reward redemption tracking
- **OTP** - Email verification codes

## Queue System

The system automatically generates unique queue numbers for each appointment:
- Format: `Q[YYYYMMDD]-[###]`
- Example: `Q20251126-001`

Queue numbers are assigned when:
- Customer books online
- Admin adds walk-in customer

## Loyalty Program

Customers earn points for completed appointments:
- Points are based on service price
- Points can be redeemed for rewards
- Rewards include discounts, free services, and vouchers

## Notifications

Customers receive notifications for:
- Appointment confirmation
- Appointment approval
- Appointment cancellation
- Appointment rescheduling
- Queue updates
- Reward redemptions

## Development

Run in development mode with auto-reload:
```bash
npm run dev
```

## License

ISC

## Support

For issues or questions, contact the development team.
