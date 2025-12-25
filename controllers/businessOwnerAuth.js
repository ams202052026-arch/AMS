/**
 * Business Owner Authentication Controller
 * Handles business owner registration and verification
 */

const User = require('../models/user');
const Business = require('../models/business');
const { uploadToCloudinary } = require('../config/cloudinary');

/**
 * Load Business Owner Registration Page
 */
exports.loadRegistrationPage = (req, res) => {
    console.log('🚀 LOAD REGISTRATION PAGE CALLED!');
    console.log('=== LOAD REGISTRATION PAGE ===');
    console.log('Session userId:', req.session.userId);
    console.log('User object:', req.user);
    
    // Check if user is already logged in (unified system)
    if (req.session.userId) {
        console.log('✅ Loading unified mode registration page');
        // This is an existing customer applying for business mode
        res.render('businessOwner/register', { 
            error: null, 
            success: null,
            isUnifiedMode: true,
            user: req.user 
        });
    } else {
        console.log('❌ Loading separate mode registration page');
        // This is the old separate business owner registration
        res.render('businessOwner/register', { 
            error: null, 
            success: null,
            isUnifiedMode: false,
            user: null 
        });
    }
};

/**
 * Handle Business Owner Registration
 */
exports.register = async (req, res) => {
    try {
        // Add debug logging
        console.log('=== REGISTER FUNCTION CALLED ===');
        console.log('Session userId:', req.session.userId);
        console.log('Request method:', req.method);
        console.log('Request URL:', req.url);
        
        // Check if this is unified mode (existing customer) or separate mode (new business owner)
        const isUnifiedMode = req.session.userId ? true : false;
        console.log('isUnifiedMode:', isUnifiedMode);
        
        if (isUnifiedMode) {
            console.log('Calling registerUnifiedMode...');
            return await exports.registerUnifiedMode(req, res);
        } else {
            console.log('Calling registerSeparateMode...');
            return await exports.registerSeparateMode(req, res);
        }
    } catch (error) {
        console.error('Registration routing error:', error);
        res.render('businessOwner/register', { 
            error: 'An error occurred during registration. Please try again.',
            success: null,
            isUnifiedMode: req.session.userId ? true : false,
            user: req.user || null
        });
    }
};

/**
 * Handle Business Registration for Existing Customers (Unified Mode)
 */
exports.registerUnifiedMode = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.redirect('/login');
        }

        // Check if user already has a business application
        if (user.businessId) {
            return res.redirect('/business/status');
        }

        const {
            // Business Information
            businessName,
            businessType,
            description,
            businessPhone,
            website,
            
            // Address
            street,
            barangay,
            city,
            province,
            zipCode,
            
            // Coordinates from map
            latitude,
            longitude
        } = req.body;

        // Debug: Log received values
        console.log('=== UNIFIED MODE REGISTRATION DEBUG ===');
        console.log('businessName:', businessName);
        console.log('businessType:', businessType);
        console.log('businessPhone:', businessPhone);
        console.log('street:', street);
        console.log('barangay:', barangay);
        console.log('city:', city);
        console.log('province:', province);
        console.log('Full req.body:', req.body);
        console.log('=====================================');

        // Validation (no businessEmail required for unified mode)
        // Check for both undefined and empty string values
        if (!businessName || businessName.trim() === '' || 
            !businessType || businessType.trim() === '' || 
            !businessPhone || businessPhone.trim() === '') {
            console.log('❌ Business info validation failed');
            console.log('businessName:', `"${businessName}"`);
            console.log('businessType:', `"${businessType}"`);
            console.log('businessPhone:', `"${businessPhone}"`);
            return res.render('businessOwner/register', { 
                error: 'Please fill in all required business information fields',
                success: null,
                isUnifiedMode: true,
                user: user
            });
        }

        if (!street || street.trim() === '' || 
            !barangay || barangay.trim() === '' || 
            !city || city.trim() === '' || 
            !province || province.trim() === '') {
            console.log('❌ Address validation failed');
            console.log('street:', `"${street}"`);
            console.log('barangay:', `"${barangay}"`);
            console.log('city:', `"${city}"`);
            console.log('province:', `"${province}"`);
            return res.render('businessOwner/register', { 
                error: 'Please fill in all required address fields',
                success: null,
                isUnifiedMode: true,
                user: user
            });
        }

        // Check if business name already exists
        const existingBusiness = await Business.findOne({ 
            businessName: { $regex: new RegExp(`^${businessName}$`, 'i') } 
        });
        if (existingBusiness) {
            return res.render('businessOwner/register', { 
                error: 'Business name already exists. Please use a different name.',
                success: null,
                isUnifiedMode: true,
                user: user
            });
        }

        // Create Business (use user's email as business email)
        const newBusiness = await Business.create({
            ownerId: user._id,
            businessName,
            businessType,
            description: description || '',
            email: user.email, // Use user's email instead of separate business email
            phoneNumber: businessPhone,
            website: website || '',
            address: {
                street,
                barangay,
                city,
                province,
                zipCode: zipCode || '',
                coordinates: {
                    lat: latitude ? parseFloat(latitude) : null,
                    lng: longitude ? parseFloat(longitude) : null
                }
            },
            verificationStatus: 'pending',
            isActive: false // Will be activated after verification
        });

        console.log('✓ Business created for existing customer:', businessName);

        // Link business to user
        user.businessId = newBusiness._id;
        await user.save();

        console.log('✓ Business linked to existing user:', user.email);

        // Store registration data in session for document upload
        req.session.pendingBusinessId = newBusiness._id;

        // Redirect to document upload page
        res.redirect('/business/upload-documents');

    } catch (error) {
        console.error('Unified business registration error:', error);
        
        if (error.code === 11000) {
            return res.render('businessOwner/register', { 
                error: 'Business name already exists',
                success: null,
                isUnifiedMode: true,
                user: req.user
            });
        }
        
        res.render('businessOwner/register', { 
            error: 'An error occurred during registration. Please try again.',
            success: null,
            isUnifiedMode: true,
            user: req.user
        });
    }
};

/**
 * Handle Business Registration for New Business Owners (Separate Mode)
 */
exports.registerSeparateMode = async (req, res) => {
    try {
        const {
            // Personal Information
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            phoneNumber,
            
            // Business Information
            businessName,
            businessType,
            description,
            businessEmail,
            businessPhone,
            website,
            
            // Address
            street,
            barangay,
            city,
            province,
            zipCode,
            
            // Coordinates from map
            latitude,
            longitude
        } = req.body;

        // Validation
        if (!firstName || !lastName || !email || !password) {
            return res.render('businessOwner/register', { 
                error: 'Please fill in all required personal information fields',
                success: null,
                isUnifiedMode: false,
                user: null
            });
        }

        if (!businessName || !businessType || !businessEmail || !businessPhone) {
            return res.render('businessOwner/register', { 
                error: 'Please fill in all required business information fields',
                success: null,
                isUnifiedMode: false,
                user: null
            });
        }

        if (!street || !barangay || !city || !province) {
            return res.render('businessOwner/register', { 
                error: 'Please fill in all required address fields',
                success: null,
                isUnifiedMode: false,
                user: null
            });
        }

        if (password !== confirmPassword) {
            return res.render('businessOwner/register', { 
                error: 'Passwords do not match',
                success: null,
                isUnifiedMode: false,
                user: null
            });
        }

        if (password.length < 6) {
            return res.render('businessOwner/register', { 
                error: 'Password must be at least 6 characters long',
                success: null,
                isUnifiedMode: false,
                user: null
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.render('businessOwner/register', { 
                error: 'Email already registered. Please use a different email or login.',
                success: null,
                isUnifiedMode: false,
                user: null
            });
        }

        // Check if business name already exists
        const existingBusiness = await Business.findOne({ 
            businessName: { $regex: new RegExp(`^${businessName}$`, 'i') } 
        });
        if (existingBusiness) {
            return res.render('businessOwner/register', { 
                error: 'Business name already exists. Please use a different name.',
                success: null,
                isUnifiedMode: false,
                user: null
            });
        }

        // Create User account
        const newUser = await User.create({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password, // TODO: Hash with bcrypt in production
            phoneNumber,
            role: 'business_owner',
            isVerified: false // Will be verified via email
        });

        console.log('✓ Business owner user created:', email);

        // Create Business
        const newBusiness = await Business.create({
            ownerId: newUser._id,
            businessName,
            businessType,
            description: description || '',
            email: businessEmail.toLowerCase(),
            phoneNumber: businessPhone,
            website: website || '',
            address: {
                street,
                barangay,
                city,
                province,
                zipCode: zipCode || '',
                coordinates: {
                    lat: latitude ? parseFloat(latitude) : null,
                    lng: longitude ? parseFloat(longitude) : null
                }
            },
            verificationStatus: 'pending',
            isActive: false // Will be activated after verification
        });

        console.log('✓ Business created:', businessName);

        // Link business to user
        newUser.businessId = newBusiness._id;
        await newUser.save();

        console.log('✓ Business linked to user');

        // Store registration data in session for document upload
        req.session.pendingBusinessOwnerId = newUser._id;
        req.session.pendingBusinessId = newBusiness._id;

        // Redirect to document upload page
        res.redirect('/business-owner/upload-documents');

    } catch (error) {
        console.error('Business owner registration error:', error);
        
        if (error.code === 11000) {
            return res.render('businessOwner/register', { 
                error: 'Email or business name already exists',
                success: null,
                isUnifiedMode: false,
                user: null
            });
        }
        
        res.render('businessOwner/register', { 
            error: 'An error occurred during registration. Please try again.',
            success: null,
            isUnifiedMode: false,
            user: null
        });
    }
};

/**
 * Load Document Upload Page
 */
exports.loadDocumentUploadPage = (req, res) => {
    // Check if this is unified mode (existing customer) or separate mode (new business owner)
    const isUnifiedMode = req.session.userId ? true : false;
    
    if (isUnifiedMode) {
        // For unified mode, only check pendingBusinessId
        if (!req.session.pendingBusinessId) {
            return res.redirect('/business/register');
        }
    } else {
        // For separate mode, check both pendingBusinessOwnerId and pendingBusinessId
        if (!req.session.pendingBusinessOwnerId || !req.session.pendingBusinessId) {
            return res.redirect('/business-owner/register');
        }
    }

    res.render('businessOwner/uploadDocuments', { 
        error: null, 
        success: null,
        businessId: req.session.pendingBusinessId,
        isUnifiedMode: isUnifiedMode
    });
};

/**
 * Handle Document Upload
 */
exports.uploadDocuments = async (req, res) => {
    try {
        const businessId = req.session.pendingBusinessId;
        const isUnifiedMode = req.session.userId ? true : false;
        
        if (!businessId) {
            const redirectUrl = isUnifiedMode ? '/business/register' : '/business-owner/register';
            return res.redirect(redirectUrl);
        }

        const business = await Business.findById(businessId);
        
        if (!business) {
            return res.render('businessOwner/uploadDocuments', { 
                error: 'Business not found',
                success: null,
                businessId,
                isUnifiedMode
            });
        }

        // Get uploaded files from multer (using .fields())
        const files = req.files;
        
        console.log('📁 Files received:', files);
        
        if (!files || Object.keys(files).length === 0) {
            return res.render('businessOwner/uploadDocuments', { 
                error: 'Please upload at least one document',
                success: null,
                businessId,
                isUnifiedMode
            });
        }

        // Upload files to Cloudinary and save document URLs to business
        const documents = [];
        
        try {
            // Process each file type (req.files is an object when using .fields())
            for (const [fieldName, fileArray] of Object.entries(files)) {
                if (fileArray && fileArray.length > 0) {
                    const file = fileArray[0]; // Get first file from array
                    console.log(`🔄 Uploading ${fieldName} to Cloudinary...`);
                    const filename = `${businessId}_${fieldName}_${Date.now()}`;
                    const result = await uploadToCloudinary(file.buffer, filename);
                    
                    documents.push({
                        type: fieldName,
                        fileUrl: result.secure_url,
                        fileName: result.public_id,
                        uploadedAt: new Date()
                    });
                    
                    console.log(`✅ Uploaded ${fieldName}: ${result.secure_url}`);
                }
            }

            console.log(`📄 Total documents processed: ${documents.length}`);

            // Update business with documents
            business.verificationDocuments = documents;
            await business.save();

            console.log('💾 Documents saved to database for business:', business.businessName);
            console.log('📋 Document URLs:', documents.map(d => d.fileUrl));

            console.log('✓ Documents uploaded to Cloudinary for business:', business.businessName);

            // Clear session (different for unified vs separate mode)
            const isUnifiedMode = req.session.userId ? true : false;
            if (isUnifiedMode) {
                // For unified mode, only clear pendingBusinessId
                delete req.session.pendingBusinessId;
            } else {
                // For separate mode, clear both
                delete req.session.pendingBusinessOwnerId;
                delete req.session.pendingBusinessId;
            }

            // Redirect to success page
            res.render('businessOwner/registrationSuccess', {
                businessName: business.businessName,
                isUnifiedMode: isUnifiedMode
            });

        } catch (uploadError) {
            console.error('Cloudinary upload error:', uploadError);
            return res.render('businessOwner/uploadDocuments', { 
                error: 'Failed to upload documents. Please check your internet connection and try again.',
                success: null,
                businessId,
                isUnifiedMode: req.session.userId ? true : false
            });
        }

    } catch (error) {
        console.error('Document upload error:', error);
        res.render('businessOwner/uploadDocuments', { 
            error: 'An error occurred during document upload. Please try again.',
            success: null,
            businessId: req.session.pendingBusinessId,
            isUnifiedMode: req.session.userId ? true : false
        });
    }
};

/**
 * Skip Document Upload (for testing)
 */
exports.skipDocumentUpload = async (req, res) => {
    try {
        const businessId = req.session.pendingBusinessId;
        const isUnifiedMode = req.session.userId ? true : false;
        
        if (!businessId) {
            const redirectUrl = isUnifiedMode ? '/business/register' : '/business-owner/register';
            return res.redirect(redirectUrl);
        }

        const business = await Business.findById(businessId);
        
        if (!business) {
            const redirectUrl = isUnifiedMode ? '/business/register' : '/business-owner/register';
            return res.redirect(redirectUrl);
        }

        console.log('⚠️ Documents skipped for business:', business.businessName);

        // Clear session (different for unified vs separate mode)
        if (isUnifiedMode) {
            // For unified mode, only clear pendingBusinessId
            delete req.session.pendingBusinessId;
        } else {
            // For separate mode, clear both
            delete req.session.pendingBusinessOwnerId;
            delete req.session.pendingBusinessId;
        }

        // Redirect to success page
        res.render('businessOwner/registrationSuccess', {
            businessName: business.businessName,
            isUnifiedMode: isUnifiedMode
        });

    } catch (error) {
        console.error('Skip document error:', error);
        const redirectUrl = req.session.userId ? '/business/register' : '/business-owner/register';
        res.redirect(redirectUrl);
    }
};

/**
 * Verify Email (callback from email link)
 */
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.render('businessOwner/verificationResult', {
                success: false,
                message: 'Invalid or expired verification link'
            });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        console.log('✓ Email verified for user:', user.email);

        res.render('businessOwner/verificationResult', {
            success: true,
            message: 'Email verified successfully! Your business application is now pending admin approval.'
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.render('businessOwner/verificationResult', {
            success: false,
            message: 'An error occurred during verification'
        });
    }
};

/**
 * Unified Business Application Functions
 * For existing customers applying for business mode
 */

/**
 * Load Application Status Page
 */
exports.loadApplicationStatus = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId).populate('businessId');
        
        if (!user) {
            return res.redirect('/login');
        }

        let applicationStatus = 'not_applied';
        let business = null;
        
        if (user.businessId) {
            business = user.businessId;
            applicationStatus = business.verificationStatus || 'pending';
        }

        res.render('businessOwner/applicationStatus', { 
            user,
            business,
            applicationStatus,
            error: null 
        });
        
    } catch (error) {
        console.error('Load application status error:', error);
        res.render('businessOwner/applicationStatus', { 
            user: null,
            business: null,
            applicationStatus: 'error',
            error: 'Error loading application status' 
        });
    }
};

/**
 * Load Reapplication Page
 */
exports.loadReapplicationPage = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId).populate('businessId');
        
        if (!user || !user.businessId) {
            return res.redirect('/business/register');
        }

        const business = user.businessId;
        
        if (business.verificationStatus !== 'rejected') {
            return res.redirect('/business/status');
        }

        res.render('businessOwner/reapply', { 
            user,
            business,
            error: null 
        });
        
    } catch (error) {
        console.error('Load reapplication page error:', error);
        res.redirect('/business/status');
    }
};

/**
 * Handle Reapplication
 */
exports.reapply = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId).populate('businessId');
        
        if (!user || !user.businessId) {
            return res.redirect('/business/register');
        }

        const business = user.businessId;
        
        if (business.verificationStatus !== 'rejected') {
            return res.redirect('/business/status');
        }

        // Update business information with new data
        const {
            businessName,
            businessType,
            description,
            businessPhone,
            website,
            street,
            barangay,
            city,
            province,
            zipCode,
            latitude,
            longitude
        } = req.body;

        // Update business record (keep existing email)
        await Business.findByIdAndUpdate(business._id, {
            businessName,
            businessType,
            description,
            businessPhone,
            website,
            address: {
                street,
                barangay,
                city,
                province,
                zipCode,
                coordinates: {
                    lat: latitude ? parseFloat(latitude) : null,
                    lng: longitude ? parseFloat(longitude) : null
                }
            },
            verificationStatus: 'pending',
            rejectionReason: null,
            reappliedAt: new Date()
        });

        res.render('businessOwner/registrationSuccess', {
            businessName: businessName,
            message: 'Your business reapplication has been submitted successfully! You will be notified once reviewed.',
            redirectUrl: '/business/status',
            isUnifiedMode: false
        });
        
    } catch (error) {
        console.error('Reapplication error:', error);
        res.render('businessOwner/reapply', { 
            user: req.user,
            business: req.user?.businessId,
            error: 'An error occurred during reapplication. Please try again.' 
        });
    }
};