/**
 * Authentication Middleware
 * Role-based access control for the multi-business platform
 */

const User = require('../models/user');

/**
 * Check if user is authenticated (any role)
 */
exports.isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/login');
};

/**
 * Alias for isAuthenticated (more semantic)
 */
exports.requireAuth = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/login');
};

/**
 * Check if user is a customer
 */
exports.isCustomer = (req, res, next) => {
    if (req.session.userId && req.session.userRole === 'customer') {
        return next();
    }
    res.redirect('/login');
};

/**
 * Check if user is a business owner
 */
exports.isBusinessOwner = (req, res, next) => {
    if (req.session.userId && req.session.userRole === 'business_owner') {
        return next();
    }
    res.redirect('/login');
};

/**
 * Check if user is a super admin
 */
exports.isSuperAdmin = (req, res, next) => {
    if (req.session.userId && req.session.userRole === 'super_admin') {
        return next();
    }
    
    // Check if this is an AJAX request
    if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        return res.status(401).json({ 
            success: false, 
            error: 'Unauthorized. Please log in as super admin.' 
        });
    }
    
    res.redirect('/admin/login');
};

/**
 * Check if user is business owner OR super admin
 */
exports.isBusinessOwnerOrAdmin = (req, res, next) => {
    if (req.session.userId && 
        (req.session.userRole === 'business_owner' || req.session.userRole === 'super_admin')) {
        return next();
    }
    res.redirect('/login');
};

/**
 * Check if user owns the business
 * Use this after isBusinessOwner middleware
 */
exports.ownsBusinessResource = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        const businessId = req.params.businessId || req.body.businessId;

        if (!businessId) {
            return res.status(400).json({ error: 'Business ID required' });
        }

        const user = await User.findById(userId);
        
        if (!user || !user.businessId) {
            return res.status(403).json({ error: 'No business associated with this account' });
        }

        // Check if user owns this business
        if (user.businessId.toString() !== businessId.toString()) {
            return res.status(403).json({ error: 'You do not have permission to access this business' });
        }

        // Attach business ID to request for use in controller
        req.userBusinessId = user.businessId;
        next();
    } catch (error) {
        console.error('Business ownership check error:', error);
        res.status(500).json({ error: 'Authorization check failed' });
    }
};

/**
 * Redirect authenticated users away from login/signup pages
 */
exports.redirectIfAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        const role = req.session.userRole;
        
        switch (role) {
            case 'super_admin':
                return res.redirect('/admin/dashboard');
            case 'business_owner':
                return res.redirect('/business-owner/dashboard');
            case 'customer':
                return res.redirect('/home');
            default:
                return res.redirect('/');
        }
    }
    next();
};

/**
 * Check if user account is active and not banned
 */
exports.checkAccountStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.session.userId);
        
        if (!user) {
            req.session.destroy();
            return res.redirect('/login');
        }

        if (!user.isActive) {
            req.session.destroy();
            return res.render('login', { 
                error: 'Your account has been deactivated. Please contact support.',
                success: null 
            });
        }

        if (user.isBanned) {
            req.session.destroy();
            return res.render('login', { 
                error: `Your account has been banned. Reason: ${user.banReason || 'Violation of terms'}`,
                success: null 
            });
        }

        next();
    } catch (error) {
        console.error('Account status check error:', error);
        res.status(500).send('Error checking account status');
    }
};

/**
 * Check if user can access business features
 * Either business_owner role OR customer with approved business
 */
exports.canAccessBusiness = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        const userRole = req.session.userRole;

        console.log('🔍 canAccessBusiness check:');
        console.log('  - userId:', userId);
        console.log('  - userRole:', userRole);
        console.log('  - currentMode:', req.session.currentMode);

        if (!userId) {
            console.log('  ❌ No userId in session, redirecting to login');
            return res.redirect('/login');
        }

        // If user is business_owner role, allow access
        if (userRole === 'business_owner') {
            console.log('  ✅ User is business_owner, allowing access');
            return next();
        }

        // If user is customer, check if they have approved business
        if (userRole === 'customer') {
            console.log('  🔍 User is customer, checking for approved business...');
            const Business = require('../models/business');
            const business = await Business.findOne({ 
                ownerId: userId, 
                verificationStatus: 'approved' 
            });

            if (business) {
                console.log('  ✅ Customer has approved business:', business.businessName);
                // Set business mode if not already set
                if (req.session.currentMode !== 'business') {
                    console.log('  🔄 Setting currentMode to business');
                    req.session.currentMode = 'business';
                }
                return next();
            } else {
                console.log('  ❌ Customer has no approved business');
            }
        }

        // Redirect to appropriate page
        if (userRole === 'customer') {
            console.log('  🔄 Redirecting customer to /home');
            return res.redirect('/home');
        } else {
            console.log('  🔄 Redirecting to /login');
            return res.redirect('/login');
        }

    } catch (error) {
        console.error('❌ Business access check error:', error);
        res.redirect('/login');
    }
};

/**
 * Attach user data to request object
 * Use after authentication middleware
 */
exports.attachUserData = async (req, res, next) => {
    try {
        if (req.session.userId) {
            const user = await User.findById(req.session.userId)
                .select('-password')
                .populate('businessId');
            
            req.user = user;
            res.locals.user = user; // Make available in views
        }
        next();
    } catch (error) {
        console.error('Error attaching user data:', error);
        next();
    }
};
