const mongoose = require('mongoose');
require('dotenv').config();

const Service = require('../models/service');
const Business = require('../models/business');

async function cleanupInappropriateServices() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // List of inappropriate service names to remove
        const inappropriateNames = [
            'Shabu',
            'shabu',
            'SHABU',
            'Pabunot Paa',
            'pabunot paa',
            'PABUNOT PAA'
        ];

        // Find and deactivate inappropriate services
        const result = await Service.updateMany(
            { 
                name: { 
                    $in: inappropriateNames.map(name => new RegExp(name, 'i'))
                }
            },
            { 
                $set: { isActive: false }
            }
        );

        console.log(`\n🧹 Cleanup Results:`);
        console.log(`   Modified: ${result.modifiedCount} services`);

        // List all deactivated services
        const deactivatedServices = await Service.find({
            name: { 
                $in: inappropriateNames.map(name => new RegExp(name, 'i'))
            }
        }).populate('businessId', 'businessName');

        if (deactivatedServices.length > 0) {
            console.log(`\n📋 Deactivated Services:`);
            deactivatedServices.forEach(service => {
                console.log(`   - ${service.name} (${service.businessId?.businessName || 'Unknown Business'})`);
            });
        }

        // Optionally delete them completely
        console.log(`\n❓ Do you want to delete these services permanently?`);
        console.log(`   Run with DELETE=true to permanently delete`);
        
        if (process.env.DELETE === 'true') {
            const deleteResult = await Service.deleteMany({
                name: { 
                    $in: inappropriateNames.map(name => new RegExp(name, 'i'))
                }
            });
            console.log(`\n🗑️  Deleted ${deleteResult.deletedCount} services permanently`);
        }

        await mongoose.connection.close();
        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

cleanupInappropriateServices();
