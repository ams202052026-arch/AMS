/**
 * Authentication Controller
 * Handles login, signup, and logout for all user types
 */

const User = require('../models/user');
const Business = require('../models/business');
const bcrypt = require('bcrypt');

/**
 * Load Login Page
 */
exports.loadLoginPage = (req, res) => {
    const success = req.query.reset === 'success' 
        ? 'Password reset successful! Please login with your new password.' 
        : null;
    
    res.render('login', { error: null, success });
};

/**
 * Handle Login
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login attempt:', email);

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log('User not found:', email);
            return res.render('login', { 
                error: 'Invalid email or password', 
                success: null 
            });
        }

        console.log('User found:', user.email, 'Role:', user.role, 'Verified:', user.isVerified);

        // Check if there's already an active session with different role
        if (req.session.userId && req.session.userRole !== user.role) {
            console.log('⚠️ Session conflict detected! Current role:', req.session.userRole, 'New role:', user.role);
            return res.render('login', { 
                error: 'You are already logged in with a different account type. Please use a different browser or incognito window, or logout first.', 
                success: null 
            });
        }

        // Check if account is active
        if (!user.isActive) {
            console.log('Account is inactive');
            return res.render('login', { 
                error: 'Your account has been deactivated. Please contact support.', 
                success: null 
            });
        }

        // Check if account is banned
        if (user.isBanned) {
            console.log('Account is banned');
            return res.render('login', { 
                error: `Your account has been banned. Reason: ${user.banReason || 'Violation of terms'}`, 
                success: null 
            });
        }

        // Check if user is verified (only for customers and business owners)
        if ((user.role === 'customer' || user.role === 'business_owner') && !user.isVerified) {
            console.log('User not verified');
            return res.render('login', { 
                error: 'Please verify your email first', 
                success: null 
            });
        }

        // Check password
        // TODO: In production, use bcrypt.compare(password, user.password)
        // For now, direct comparison (update after migration)
        console.log('Checking password...');
        
        const isPasswordValid = password === user.password; // Temporary - will use bcrypt after migration
        
        if (!isPasswordValid) {
            console.log('Password mismatch');
            
            return res.render('login', { 
                error: 'Invalid email or password', 
                success: null 
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Set session based on role
        req.session.userId = user._id;
        req.session.userEmail = user.email;
        req.session.userName = user.fullName;
        req.session.userRole = user.role;
        req.session.currentMode = 'customer'; // Default to customer mode

        console.log('User logged in:', user.email, 'Role:', user.role);
        console.log('Session ID set:', req.session.userId);
        console.log('Default mode set:', req.session.currentMode);

        // Redirect based on role
        switch (user.role) {
            case 'super_admin':
                return res.redirect('/admin/dashboard');
            case 'business_owner':
                return res.redirect('/business/dashboard');
            case 'customer':
                return res.redirect('/home');
            default:
                return res.redirect('/');
        }
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { 
            error: 'An error occurred during login', 
            success: null 
        });
    }
};

/**
 * Load Signup Page
 */
exports.loadSignUpPage = (req, res) => {
    res.render('signUp', { error: null });
};

/**
 * Handle Customer Signup (after OTP verification)
 */
exports.storeCustomerData = async (req, res) => {
    try {
        const customerDetails = req.session.customerDetails;

        if (!customerDetails) {
            console.log('No customer details in session');
            return res.redirect('/signUp');
        }

        const { name, email, password } = customerDetails;

        // Split name into first and last name
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || firstName;

        // Create the user in database
        const newUser = await User.create({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password, // TODO: Hash with bcrypt in production
            role: 'customer',
            isVerified: true // Mark as verified since OTP was confirmed
        });

        console.log('✓ Customer created successfully:', email);

        // Clear session data
        delete req.session.customerDetails;

        // Redirect to login
        res.redirect('/login');
    } catch (error) {
        console.error('Error storing customer data:', error);
        
        if (error.code === 11000) {
            // Duplicate email
            return res.render('signUp', { 
                error: 'Email already exists. Please use a different email or login.' 
            });
        }
        
        res.render('signUp', { 
            error: 'An error occurred during signup. Please try again.' 
        });
    }
};

/**
 * Handle Logout
 */
exports.logout = (req, res) => {
    const userRole = req.session.userRole;
    
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        
        // Redirect based on previous role
        if (userRole === 'super_admin') {
            return res.redirect('/admin/login');
        }
        
        res.redirect('/login');
    });
};

/**
 * Redirect to appropriate home based on role
 */
exports.redirectToHome = (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    switch (req.session.userRole) {
        case 'super_admin':
            return res.redirect('/admin/dashboard');
        case 'business_owner':
            return res.redirect('/business-owner/dashboard');
        case 'customer':
            return res.redirect('/home');
        default:
            return res.redirect('/');
    }
};
/**
 * Mode Switching Functions
 */

/**
 * Switch to Business Mode
 */
exports.switchToBusiness = async (req, res) => {
    try {
        const userId = req.session.userId;
        
        if (!userId) {
            return res.redirect('/login');
        }

        // Find user
        const user = await User.findById(userId);
        
        if (!user) {
            return res.redirect('/login');
        }

        // Find business by ownerId (not by user.businessId)
        const business = await Business.findOne({ ownerId: userId });
        
        // Check if user has a business application
        if (!business) {
            // User hasn't applied for business yet
            return res.redirect('/business/register');
        }
        
        // Check business verification status
        switch (business.verificationStatus) {
            case 'approved':
                // Business is approved, switch to business mode
                req.session.currentMode = 'business';
                console.log('✓ Switched to business mode for user:', user.email);
                return res.redirect('/business-owner/dashboard');
                
            case 'pending':
                // Business application is pending
                console.log('Business application pending for user:', user.email);
                return res.redirect('/business/status');
                
            case 'rejected':
                // Business application was rejected
                console.log('Business application rejected for user:', user.email);
                return res.redirect('/business/reapply');
                
            case 'suspended':
                // Business is suspended
                console.log('Business suspended for user:', user.email);
                return res.redirect('/business/status');
                
            default:
                // Unknown status, redirect to status page
                console.log('Unknown business status for user:', user.email);
                return res.redirect('/business/status');
        }
        
    } catch (error) {
        console.error('Switch to business error:', error);
        res.redirect('/home');
    }
};

/**
 * Switch to Customer Mode
 */
exports.switchToCustomer = async (req, res) => {
    try {
        const userId = req.session.userId;
        
        if (!userId) {
            return res.redirect('/login');
        }

        // Set customer mode in session
        req.session.currentMode = 'customer';
        
        // Redirect to customer dashboard
        res.redirect('/home');
        
    } catch (error) {
        console.error('Switch to customer error:', error);
        res.redirect('/home');
    }
};

/**
 * Get Mode Status API
 */
exports.getModeStatus = async (req, res) => {
    try {
        const userId = req.session.userId;
        
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Find business by ownerId (not by user.businessId)
        const business = await Business.findOne({ ownerId: userId });

        // Determine business application status
        let businessStatus = 'not_applied';
        let canSwitchToBusiness = false;
        
        if (business) {
            // Check actual business verification status
            switch (business.verificationStatus) {
                case 'approved':
                    businessStatus = 'approved';
                    canSwitchToBusiness = true;
                    break;
                case 'pending':
                    businessStatus = 'pending';
                    canSwitchToBusiness = false;
                    break;
                case 'rejected':
                    businessStatus = 'rejected';
                    canSwitchToBusiness = false;
                    break;
                case 'suspended':
                    businessStatus = 'suspended';
                    canSwitchToBusiness = false;
                    break;
                default:
                    businessStatus = 'pending';
                    canSwitchToBusiness = false;
            }
        }

        const currentMode = req.session.currentMode || 'customer';

        res.json({
            currentMode,
            businessStatus,
            canSwitchToBusiness,
            userRole: user.role,
            businessId: business ? business._id : null,
            businessName: business ? business.businessName : null,
            suspensionReason: business && business.suspensionReason ? business.suspensionReason : null
        });
        
    } catch (error) {
        console.error('Get mode status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};