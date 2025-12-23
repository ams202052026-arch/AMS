/**
 * Business Owner Dashboard Controller
 * Handles business owner dashboard and overview
 */

const Business = require('../../models/business');
const User = require('../../models/user');
const Service = require('../../models/service');
const Appointment = require('../../models/appointment');

/**
 * Load Business Owner Dashboard
 */
exports.loadDashboard = async (req, res) => {
    try {
        const userId = req.session.userId;
        
        // Get business owner and their business
        const user = await User.findById(userId);
        if (!user) {
            return res.redirect('/login');
        }

        // Find business by ownerId (works for both business_owner role and customer with business)
        const business = await Business.findOne({ ownerId: userId });
        
        // If no business exists, redirect based on user role
        if (!business) {
            if (user.role === 'business_owner') {
                return res.render('businessOwner/dashboard', {
                    business: null,
                    user,
                    stats: {
                        totalServices: 0,
                        todayAppointments: 0,
                        pendingAppointments: 0,
                        monthlyRevenue: 0
                    },
                    recentAppointments: [],
                    topServices: [],
                    staffPerformance: []
                });
            } else {
                // Customer without business, redirect to apply
                return res.redirect('/business/register');
            }
        }

        // Get current date ranges
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

        // Get statistics
        const totalServices = await Service.countDocuments({ 
            businessId: business._id,
            isActive: true 
        });

        const todayAppointments = await Appointment.countDocuments({
            businessId: business._id,
            date: { $gte: today, $lt: tomorrow }
        });

        const pendingAppointments = await Appointment.countDocuments({
            businessId: business._id,
            status: 'pending'
        });

        const totalAppointments = await Appointment.countDocuments({
            businessId: business._id
        });

        const completedAppointments = await Appointment.countDocuments({
            businessId: business._id,
            status: 'completed'
        });

        const cancelledAppointments = await Appointment.countDocuments({
            businessId: business._id,
            status: 'cancelled'
        });

        // Calculate completion rate
        const completionRate = totalAppointments > 0 
            ? ((completedAppointments / totalAppointments) * 100).toFixed(1)
            : 0;

        // Get staff count
        const Staff = require('../../models/staff');
        const totalStaff = await Staff.countDocuments({
            businessId: business._id,
            isActive: true
        });

        // Calculate monthly revenue
        const monthlyRevenue = await Appointment.aggregate([
            {
                $match: {
                    businessId: business._id,
                    date: { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth },
                    status: 'completed'
                }
            },
            {
                $lookup: {
                    from: 'services',
                    localField: 'service',
                    foreignField: '_id',
                    as: 'serviceData'
                }
            },
            {
                $unwind: '$serviceData'
            },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: {
                            $ifNull: ['$finalPrice', '$serviceData.price']
                        }
                    }
                }
            }
        ]);

        // Calculate total revenue (all time)
        const totalRevenue = await Appointment.aggregate([
            {
                $match: {
                    businessId: business._id,
                    status: 'completed'
                }
            },
            {
                $lookup: {
                    from: 'services',
                    localField: 'service',
                    foreignField: '_id',
                    as: 'serviceData'
                }
            },
            {
                $unwind: '$serviceData'
            },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: {
                            $ifNull: ['$finalPrice', '$serviceData.price']
                        }
                    }
                }
            }
        ]);

        // Get top services
        const topServices = await Appointment.aggregate([
            {
                $match: {
                    businessId: business._id,
                    status: { $in: ['completed', 'confirmed', 'in-progress'] }
                }
            },
            {
                $group: {
                    _id: '$service',
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'services',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'serviceData'
                }
            },
            {
                $unwind: '$serviceData'
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 5
            },
            {
                $project: {
                    name: '$serviceData.name',
                    count: 1,
                    price: '$serviceData.price'
                }
            }
        ]);

        // Get staff performance KPIs
        const staffPerformance = await Appointment.aggregate([
            {
                $match: {
                    businessId: business._id,
                    status: { $in: ['completed', 'confirmed', 'in-progress', 'pending'] }
                }
            },
            {
                $group: {
                    _id: '$staff',
                    totalAppointments: { $sum: 1 },
                    completedAppointments: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    pendingAppointments: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    }
                }
            },
            {
                $lookup: {
                    from: 'staffs',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'staffData'
                }
            },
            {
                $unwind: '$staffData'
            },
            {
                $lookup: {
                    from: 'appointments',
                    let: { staffId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$staff', '$$staffId'] },
                                        { $eq: ['$status', 'completed'] }
                                    ]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: 'services',
                                localField: 'service',
                                foreignField: '_id',
                                as: 'serviceData'
                            }
                        },
                        {
                            $unwind: '$serviceData'
                        },
                        {
                            $group: {
                                _id: null,
                                totalRevenue: {
                                    $sum: { $ifNull: ['$finalPrice', '$serviceData.price'] }
                                }
                            }
                        }
                    ],
                    as: 'revenueData'
                }
            },
            {
                $project: {
                    staffId: '$_id',
                    staffName: '$staffData.name',
                    totalAppointments: 1,
                    completedAppointments: 1,
                    pendingAppointments: 1,
                    completionRate: {
                        $cond: [
                            { $gt: ['$totalAppointments', 0] },
                            {
                                $multiply: [
                                    { $divide: ['$completedAppointments', '$totalAppointments'] },
                                    100
                                ]
                            },
                            0
                        ]
                    },
                    totalRevenue: {
                        $ifNull: [{ $arrayElemAt: ['$revenueData.totalRevenue', 0] }, 0]
                    }
                }
            },
            {
                $sort: { totalRevenue: -1 }
            }
        ]);

        console.log('📊 Staff Performance Data:', staffPerformance.length, 'staff members found');
        if (staffPerformance.length > 0) {
            console.log('Sample:', staffPerformance[0]);
        }

        // Get recent appointments
        const recentAppointments = await Appointment.find({ businessId: business._id })
            .populate('customer', 'firstName lastName')
            .populate('service', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        const stats = {
            totalServices,
            todayAppointments,
            pendingAppointments,
            totalAppointments,
            completedAppointments,
            cancelledAppointments,
            completionRate,
            totalStaff,
            monthlyRevenue: monthlyRevenue[0]?.total || 0,
            totalRevenue: totalRevenue[0]?.total || 0,
            averageRating: business.averageRating || 0,
            totalReviews: business.totalReviews || 0
        };

        res.render('businessOwner/dashboard', {
            business,
            user,
            stats,
            recentAppointments,
            topServices,
            staffPerformance
        });

    } catch (error) {
        console.error('Error loading business owner dashboard:', error);
        res.status(500).render('error', { message: 'Error loading dashboard' });
    }
};

/**
 * Handle Business Owner Login
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Business owner login attempt:', email);

        // Validate input
        if (!email || !password) {
            return res.render('businessOwner/login', { 
                error: 'Email and password are required',
                success: null 
            });
        }

        // Find business owner by email
        const user = await User.findOne({ 
            email: email.toLowerCase(),
            role: 'business_owner' 
        });

        if (!user) {
            console.log('Business owner not found:', email);
            return res.render('businessOwner/login', { 
                error: 'Invalid email or password',
                success: null 
            });
        }

        // Check password (TODO: Use bcrypt.compare in production)
        const isPasswordValid = password === user.password;
        
        if (!isPasswordValid) {
            console.log('Password mismatch');
            
            return res.render('businessOwner/login', { 
                error: 'Invalid email or password',
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
        req.session.userRole = 'business_owner';

        console.log('Business owner logged in:', user.email);

        res.redirect('/business-owner/dashboard');
    } catch (error) {
        console.error('Business owner login error:', error);
        res.render('businessOwner/login', { 
            error: 'An error occurred during login',
            success: null 
        });
    }
};

/**
 * Load Business Owner Login Page
 */
exports.loadLoginPage = (req, res) => {
    res.render('businessOwner/login', { error: null, success: null });
};

/**
 * Handle Business Owner Signup (Account Creation Only)
 */
exports.signup = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phoneNumber,
            password,
            confirmPassword
        } = req.body;

        // Validation
        if (!firstName || !lastName || !email || !password) {
            return res.render('businessOwner/signup', { 
                error: 'Please fill in all required fields',
                success: null 
            });
        }

        if (password !== confirmPassword) {
            return res.render('businessOwner/signup', { 
                error: 'Passwords do not match',
                success: null 
            });
        }

        if (password.length < 6) {
            return res.render('businessOwner/signup', { 
                error: 'Password must be at least 6 characters long',
                success: null 
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.render('businessOwner/signup', { 
                error: 'Email already registered. Please use a different email or login.',
                success: null 
            });
        }

        // Create User account (no business yet)
        const newUser = await User.create({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password, // TODO: Hash with bcrypt in production
            phoneNumber,
            role: 'business_owner',
            isVerified: true, // Auto-verify for now
            isActive: true
        });

        console.log('✓ Business owner account created:', email);

        // Auto-login the user
        req.session.userId = newUser._id;
        req.session.userEmail = newUser.email;
        req.session.userName = newUser.fullName;
        req.session.userRole = 'business_owner';

        // Redirect to dashboard (they can apply for business there)
        res.redirect('/business-owner/dashboard');

    } catch (error) {
        console.error('Business owner signup error:', error);
        
        if (error.code === 11000) {
            return res.render('businessOwner/signup', { 
                error: 'Email already exists',
                success: null 
            });
        }
        
        res.render('businessOwner/signup', { 
            error: 'An error occurred during registration. Please try again.',
            success: null 
        });
    }
};

/**
 * Load Business Owner Signup Page
 */
exports.loadSignupPage = (req, res) => {
    res.render('businessOwner/signup', { error: null, success: null });
};

/**
 * Handle Business Owner Logout
 */
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/business-owner/login');
    });
};