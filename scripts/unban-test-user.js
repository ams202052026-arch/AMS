/**
 * Quick Script: Unban Test User
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');
const Business = require('../models/business');

async function unbanUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const user = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        
        if (user && user.isBanned) {
            user.isBanned = false;
            user.banReason = null;
            user.bannedAt = null;
            await user.save();
            
            // Reactivate business
            const business = await Business.findOne({ ownerId: user._id });
            if (business && business.verificationStatus === 'suspended') {
                business.verificationStatus = 'approved';
                business.suspensionReason = null;
                business.suspendedAt = null;
                await business.save();
                console.log('✓ Business reactivated');
            }
            
            console.log('✓ User unbanned:', user.email);
        } else {
            console.log('User is not banned');
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

unbanUser();
