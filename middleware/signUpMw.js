const User = require('../models/user');

exports.checkIfUserExist = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        const userExist = await User.findOne({ email: email.toLowerCase() });

        if (userExist) {
            console.log("MIDDLEWARE 1");
            console.log(" - USER ALREADY EXIST");
            return res.render('signUp', { 
                error: 'Email already exists. Please use a different email or login.' 
            });
        }

        console.log("MIDDLEWARE 1");
        console.log(" - USER NOT EXIST");

        // Store in session
        req.session.customerDetails = { name, email, password };

        // Correct destructuring
        const { name: nm, email: eml, password: psswrd } = req.session.customerDetails;

        console.log(` - CUSTOMER DETAILS STORED ON SESSION: ${nm}, ${eml}, ${psswrd}`);

        next();
    }
    catch (error) {
        console.log(error);
        next(error);
    }
};