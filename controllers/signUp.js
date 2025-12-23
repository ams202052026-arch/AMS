const User = require('../models/user');

exports.loadSignUpForm = (req, res) => {
    res.render('signUp', { error: null });
};

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

        // Create the user in database (using User model, not Customer)
        const newUser = await User.create({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password, // In production, hash this with bcrypt
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
