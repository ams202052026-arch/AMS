const crypto = require('crypto');

// Store allowed admin access tokens (in production, use database or Redis)
const allowedAdminTokens = new Set();

// PERMANENT STATIC ADMIN TOKEN - Never expires, only for super admin
// This is a secure, hard-to-guess token for your exclusive access
const PERMANENT_ADMIN_TOKEN = 'sa_7f8e9d2c4b6a1e5f3d8c9b4a7e6f2d1c8b5a4e3f2d1c9b8a7e6f5d4c3b2a1e0f';

// Add permanent token to allowed tokens on startup
allowedAdminTokens.add(PERMANENT_ADMIN_TOKEN);

// Generate a secure admin access token
function generateAdminToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Middleware to check if admin access is allowed
function checkAdminAccess(req, res, next) {
    const token = req.query.token || req.body.token || req.headers['x-admin-token'];
    
    if (!token) {
        return res.status(403).render('error', {
            title: 'Access Denied',
            message: 'Admin access requires a valid token.',
            statusCode: 403
        });
    }
    
    if (!allowedAdminTokens.has(token)) {
        return res.status(403).render('error', {
            title: 'Invalid Token',
            message: 'The provided admin token is invalid or expired.',
            statusCode: 403
        });
    }
    
    next();
}

// Function to create a temporary admin access token (expires in 1 hour)
function createTemporaryAdminAccess() {
    const token = generateAdminToken();
    allowedAdminTokens.add(token);
    
    // Auto-expire token after 1 hour
    setTimeout(() => {
        allowedAdminTokens.delete(token);
        console.log(`Admin token ${token.substring(0, 8)}... expired`);
    }, 60 * 60 * 1000); // 1 hour
    
    return token;
}

// Function to revoke all admin tokens (except permanent token)
function revokeAllAdminTokens() {
    allowedAdminTokens.clear();
    // Re-add permanent token
    allowedAdminTokens.add(PERMANENT_ADMIN_TOKEN);
    console.log('All temporary admin tokens revoked (permanent token preserved)');
}

// Function to get the permanent admin access URL
function getPermanentAdminAccessURL(baseURL = 'http://localhost:3000') {
    return `${baseURL}/admin/secure-access?token=${PERMANENT_ADMIN_TOKEN}`;
}

module.exports = {
    checkAdminAccess,
    createTemporaryAdminAccess,
    revokeAllAdminTokens,
    generateAdminToken,
    getPermanentAdminAccessURL,
    PERMANENT_ADMIN_TOKEN
};