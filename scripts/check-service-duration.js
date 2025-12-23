// Check service durations in database
require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('../models/service');

async function checkServiceDurations() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const services = await Service.find();
        
        console.log('📋 Services in Database:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        services.forEach(service => {
            console.log(`Service: ${service.name}`);
            console.log(`  Duration: ${service.duration} minutes`);
            console.log(`  Price: ₱${service.price}`);
            console.log(`  ID: ${service._id}`);
            console.log('');
        });

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
}

checkServiceDurations();
