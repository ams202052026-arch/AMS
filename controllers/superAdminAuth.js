/**
 * Super Admin Authentication Controller
 * Handles super admin login
 */

const User = require('../models/user');

/**
 * Load Super Admin Login Page
 */
exports.loadLoginPage = (req, res) => {
    res.render('admin/login', { error: null, success: null });
};

/**
 * Handle Super Admin Login
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Super Admin login attempt:', email);

        // Validate input
        if (!email || !password) {
            return res.render('admin/login', { 
                error: 'Email and password are required',
                success: null 
            });
        }

        // Check if there's already an active session with different role
        if (req.session.userId && req.session.userRole !== 'super_admin') {
            console.log('⚠️ Session conflict detected! Current role:', req.session.userRole);
            return res.render('admin/login', { 
                error: 'You are already logged in as a different user type. Please use a different browser or incognito window, or logout first.',
                success: null 
            });
        }

        // Find user by email
        const user = await User.findOne({ 
            email: email.toLowerCase(),
            role: 'super_admin' 
        });

        if (!user) {
            console.log('Super admin not found:', email);
            return res.render('admin/login', { 
                error: 'Invalid credentials',
                success: null 
            });
        }

        // Check password
        // TODO: Use bcrypt.compare in production
        console.log('Checking password...');
        console.log('Input password:', password);
        console.log('Stored password:', user.password);
        console.log('Match:', password === user.password);
        
        const isPasswordValid = password === user.password;
        
        if (!isPasswordValid) {
            console.log('Password mismatch');
            
            return res.render('admin/login', { 
                error: 'Invalid credentials',
                success: null 
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Set session
        req.session.userId = user._id;
        req.session.userEmail = user.email;
        req.session.userName = user.fullName;
        req.session.userRole = 'super_admin';
        req.session.isAdmin = true; // For backward compatibility

        console.log('Super admin logged in:', user.email);

        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Super admin login error:', error);
        res.render('admin/login', { 
            error: 'An error occurred during login',
            success: null 
        });
    }
};

/**
 * Handle Super Admin Logout
 */
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/admin/login');
    });
};

/**
 * Create Initial Super Admin (for setup)
 * This should only be run once during initial setup
 */
exports.createInitialSuperAdmin = async (req, res) => {
    try {
        // Check if any super admin exists
        const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
        
        if (existingSuperAdmin) {
            return res.status(400).json({ 
                error: 'Super admin already exists' 
            });
        }

        // Create super admin
        const superAdmin = await User.create({
            firstName: 'Super',
            lastName: 'Admin',
            email: 'admin@servicehub.com',
            password: 'admin123', // TODO: Change this and hash with bcrypt
            role: 'super_admin',
            isVerified: true,
            isActive: true
        });

        console.log('✓ Initial super admin created:', superAdmin.email);

        res.json({ 
            success: true,
            message: 'Super admin created successfully',
            email: superAdmin.email,
            note: 'Please change the default password immediately'
        });

    } catch (error) {
        console.error('Error creating super admin:', error);
        res.status(500).json({ 
            error: 'Failed to create super admin' 
        });
    }
};
