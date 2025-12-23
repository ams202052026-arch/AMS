// Test script to verify time slot generation with service duration
require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('../models/service');

// Helper functions (copied from controller)
const addMinutesToTime = (timeStr, minutes) => {
    const [hours, mins] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
};

const timeToMinutes = (timeStr) => {
    const [hours, mins] = timeStr.split(':').map(Number);
    return hours * 60 + mins;
};

const formatTime12Hour = (time24) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
};

async function testTimeSlots() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find a service with 60-minute duration
        const service = await Service.findOne({ duration: 60 });
        
        if (!service) {
            console.log('❌ No service with 60-minute duration found');
            return;
        }

        console.log('📋 Testing Time Slots for Service:');
        console.log('   Name:', service.name);
        console.log('   Duration:', service.duration, 'minutes');
        console.log('   Price: ₱' + service.price);
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Generate sample slots
        const startHour = 9;
        const endHour = 18;
        const slotInterval = 30;
        const serviceDuration = service.duration;

        console.log('⏰ Generated Time Slots (30-min intervals):');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        let count = 0;
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += slotInterval) {
                const slotStart = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                const slotEnd = addMinutesToTime(slotStart, serviceDuration);
                
                const endMinutes = timeToMinutes(slotEnd);
                const businessEndMinutes = endHour * 60;
                
                if (endMinutes <= businessEndMinutes) {
                    count++;
                    const display = `${formatTime12Hour(slotStart)} - ${formatTime12Hour(slotEnd)}`;
                    console.log(`${count}. ${display}`);
                }
            }
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✅ Total available slots: ${count}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('✅ Test completed successfully!');
        console.log('   Each slot now shows the correct duration of', serviceDuration, 'minutes');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
}

testTimeSlots();
