// Check if customer is logged in
const checkSession = (req, res, next) => {
    if (req.session.userId || req.session.customerDetails) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Check customer details (for signup flow)
const checkCustomerDetails = (req, res, next) => {
    const details = req.session.customerDetails;

    if (details) {
        console.log('MIDDLEWARE: Customer details present');
        next();
    } else {
        console.log('MIDDLEWARE: No customer details');
        res.redirect('/');
    }
};

module.exports = checkSession;
module.exports.checkCustomerDetails = checkCustomerDetails;
