require('dotenv').config();

const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
const session = require('express-session');
const methodOverride = require('method-override');
const { startScheduler } = require('./services/scheduler');

const app = express();

connectDB();

// Start notification scheduler
startScheduler();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure method-override to work with both query string and body
app.use(methodOverride('_method')); // For query string
app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // Look in POST body and delete it
        const method = req.body._method;
        delete req.body._method;
        return method;
    }
}));

app.use(session({
    secret: 'awdpawpdawpdawdoawobawdbawodwououadbawob',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 60 * 1000 }
}));

// Global middleware - attach user data to all requests
const { attachUserData } = require('./middleware/auth');
app.use(attachUserData);

// Authentication Routes (NEW)
const authRoutes = require('./routes/auth');
app.use('/', authRoutes);

// Business Owner Routes (NEW)
const businessOwnerRoutes = require('./routes/businessOwner');
app.use('/business-owner', businessOwnerRoutes);

// Unified Business Routes (for mode switching)
const unifiedBusinessRoutes = require('./routes/business');
app.use('/business', unifiedBusinessRoutes);

// Customer Routes
const signUpRoute = require('./routes/signUp');
app.use('/signUp', signUpRoute);

// Note: Login/Logout now handled by auth routes above
// Keeping these for backward compatibility with OTP flow
const loginRoutes = require('./routes/login');
app.use('/login-old', loginRoutes); // Renamed to avoid conflict

const logoutRoutes = require('./routes/logout');
app.use('/logout-old', logoutRoutes); // Renamed to avoid conflict

const forgotPasswordRoutes = require('./routes/forgotPassword');
app.use('/forgot-password', forgotPasswordRoutes);

const landingPageRouters = require('./routes/landingPage');
app.use('/', landingPageRouters);

const homeRoutes = require('./routes/home');
app.use('/home', homeRoutes);

const otpRoutes = require('./routes/otp');
app.use('/verifyOtp', otpRoutes);

const appointmentsRoutes = require('./routes/appointments');
app.use('/appointments', appointmentsRoutes);

const rewardsRoutes = require('./routes/rewards');
app.use('/rewards', rewardsRoutes);

const historyRoutes = require('./routes/history');
app.use('/history', historyRoutes);

const notificationsRoutes = require('./routes/notifications');
app.use('/notifications', notificationsRoutes);

const notificationsApiRoutes = require('./routes/api/notifications');
app.use('/api/notifications', notificationsApiRoutes);

const profileRoutes = require('./routes/profile');
app.use('/profile', profileRoutes);

const servicesRoutes = require('./routes/services');
app.use('/api/services', servicesRoutes);

// Admin Routes
const adminRoutes = require('./routes/admin/index');
app.use('/admin', adminRoutes);

// Test Routes (Development only)
if (process.env.NODE_ENV === 'development') {
    app.get('/test-status', (req, res) => {
        res.json({
            status: 'Server is running',
            timestamp: new Date().toISOString(),
            availableTestRoutes: [
                '/test-map',
                '/simple-map-test', 
                '/openstreetmap-test',
                '/test-mode-switch',
                '/test-status'
            ]
        });
    });
    
    app.get('/test-map', (req, res) => {
        res.render('test-map');
    });
    
    app.get('/simple-map-test', (req, res) => {
        res.render('simple-map-test');
    });
    
    app.get('/openstreetmap-test', (req, res) => {
        res.render('openstreetmap-test');
    });
    
    app.get('/test-mode-switch', (req, res) => {
        res.render('test-mode-switch');
    });
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
