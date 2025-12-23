const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');

// Import models
const Appointment = require('../models/appointment');
const User = require('../models/user');
const Service = require('../models/service');
const Staff = require('../models/staff');
const Business = require('../models/business');

// Import controller
const appointmentsController = require('../controllers/appointments');

async function testAppointmentsRoute() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ams');
        console.log('Connected to MongoDB');

        // Find test user
        const testUser = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        if (!testUser) {
            console.log('Test user not found');
            return;
        }

        console.log(`\n=== TESTING APPOINTMENTS ROUTE ===`);
        console.log(`User: ${testUser.fullName}`);

        // Create mock request and response objects
        const mockReq = {
            session: {
                userId: testUser._id
            }
        };

        let renderData = null;
        let renderTemplate = null;

        const mockRes = {
            render: (template, data) => {
                renderTemplate = template;
                renderData = data;
                console.log(`\n✅ Controller called res.render('${template}', data)`);
                console.log(`Data passed to template:`, JSON.stringify(data, null, 2));
            },
            status: (code) => ({
                render: (template, data) => {
                    console.log(`❌ Controller returned error ${code}: ${template}`);
                    console.log(`Error data:`, data);
                }
            })
        };

        console.log('\n1. Calling appointmentsController.loadAppointments...');
        
        try {
            await appointmentsController.loadAppointments(mockReq, mockRes);
            
            if (renderTemplate && renderData) {
                console.log('\n2. Analyzing render data:');
                console.log(`Template: ${renderTemplate}`);
                console.log(`Appointments count: ${renderData.appointments?.length || 0}`);
                
                if (renderData.appointments && renderData.appointments.length > 0) {
                    console.log('\n3. Appointments data:');
                    renderData.appointments.forEach((apt, index) => {
                        console.log(`${index + 1}. ${apt.status}: ${apt.service?.name} (${apt.queueNumber})`);
                    });
                    
                    console.log('\n✅ SUCCESS: Controller found appointments and would render them');
                } else {
                    console.log('\n❌ ISSUE: Controller found no appointments');
                }
            } else {
                console.log('\n❌ ISSUE: Controller did not call render');
            }
            
        } catch (controllerError) {
            console.error('❌ Controller error:', controllerError);
        }

        console.log('\n=== ROUTE TEST COMPLETE ===');
        
    } catch (error) {
        console.error('Error testing appointments route:', error);
    } finally {
        await mongoose.connection.close();
    }
}

// Load environment variables
require('dotenv').config();

testAppointmentsRoute();