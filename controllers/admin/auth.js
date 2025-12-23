const Admin = require('../../models/admin');

// Load admin login page
exports.loadLoginPage = (req, res) => {
    res.render('admin/login', { error: null });
};

// Admin login
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });

        if (!admin || admin.password !== password) {
            return res.render('admin/login', { error: 'Invalid credentials' });
        }

        req.session.adminId = admin._id;
        req.session.isAdmin = true;
        admin.lastLogin = new Date();
        await admin.save();

        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error(error);
        res.render('admin/login', { error: 'Login failed' });
    }
};

// Admin logout
exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
};
