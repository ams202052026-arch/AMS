const nodemailer = require('nodemailer');

// Use SendGrid for production (Render), Gmail for development
const transporter = nodemailer.createTransport(
    process.env.NODE_ENV === 'production' && process.env.SENDGRID_API_KEY
        ? {
            host: 'smtp.sendgrid.net',
            port: 587,
            auth: {
                user: 'apikey',
                pass: process.env.SENDGRID_API_KEY
            }
        }
        : {
            service: 'gmail',
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASS
            },
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 10000,
            socketTimeout: 10000
        }
);

/**
 * Send appointment confirmation email
 */
exports.sendAppointmentConfirmationEmail = async (appointment, business, customer) => {
    try {
        const { formatTime12Hour } = require('../utils/timeFormat');
        
        const staffName = appointment.staff ? appointment.staff.name : 'Our team';
        const formattedDate = new Date(appointment.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
        });
        const formattedStartTime = formatTime12Hour(appointment.timeSlot.start);
        const formattedEndTime = formatTime12Hour(appointment.timeSlot.end);

        await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to: customer.email,
            subject: `Appointment Confirmed - ${business.businessName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafafa;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; padding: 20px 10px;">
                    <tr>
                      <td align="center">
                        <table width="500" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); overflow: hidden;">
                          
                          <!-- Header -->
                          <tr>
                            <td style="background: #1a1a1a; padding: 24px 20px; text-align: center;">
                              <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="32" cy="32" r="30" stroke="#ffffff" stroke-width="2" fill="none"/>
                                <path d="M32 16L28 20L24 24L28 28L32 24L36 28L40 24L36 20L32 16Z" fill="#ffffff"/>
                                <path d="M20 28L24 32L20 36L24 40L28 36L24 32L28 28L24 24L20 28Z" fill="#ffffff"/>
                                <path d="M44 28L40 32L44 36L40 40L36 36L40 32L36 28L40 24L44 28Z" fill="#ffffff"/>
                                <path d="M28 40L32 44L36 40L32 36L28 40Z" fill="#ffffff"/>
                              </svg>
                              <h1 style="color: #ffffff; margin: 12px 0 4px; font-size: 20px; font-weight: 700;">Appointment Confirmed</h1>
                              <p style="color: #cccccc; margin: 0; font-size: 13px;">Your booking is confirmed</p>
                            </td>
                          </tr>
                          
                          <!-- Content -->
                          <tr>
                            <td style="padding: 24px 20px;">
                              <p style="color: #1a1a1a; font-size: 14px; line-height: 1.5; margin: 0 0 12px;">Hello ${customer.firstName},</p>
                              <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0 0 20px;">Your appointment with <strong>${business.businessName}</strong> has been confirmed.</p>
                              
                              <!-- Appointment Details Box -->
                              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 20px;">
                                <tr>
                                  <td style="padding: 16px;">
                                    <p style="color: #999999; font-size: 10px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Appointment Details</p>
                                    
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                      <tr>
                                        <td style="padding: 4px 0; color: #666666; font-size: 13px; width: 100px;">Service:</td>
                                        <td style="padding: 4px 0; color: #1a1a1a; font-size: 13px; font-weight: 600;">${appointment.service.name}</td>
                                      </tr>
                                      <tr>
                                        <td style="padding: 4px 0; color: #666666; font-size: 13px;">Date:</td>
                                        <td style="padding: 4px 0; color: #1a1a1a; font-size: 13px; font-weight: 600;">${formattedDate}</td>
                                      </tr>
                                      <tr>
                                        <td style="padding: 4px 0; color: #666666; font-size: 13px;">Time:</td>
                                        <td style="padding: 4px 0; color: #1a1a1a; font-size: 13px; font-weight: 600;">${formattedStartTime} - ${formattedEndTime}</td>
                                      </tr>
                                      <tr>
                                        <td style="padding: 4px 0; color: #666666; font-size: 13px;">Staff:</td>
                                        <td style="padding: 4px 0; color: #1a1a1a; font-size: 13px; font-weight: 600;">${staffName}</td>
                                      </tr>
                                      <tr>
                                        <td style="padding: 4px 0; color: #666666; font-size: 13px;">Queue #:</td>
                                        <td style="padding: 4px 0; color: #1a1a1a; font-size: 13px; font-weight: 600;">#${appointment.queueNumber}</td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                              
                              <!-- Info Box -->
                              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 6px; margin-bottom: 20px;">
                                <tr>
                                  <td style="padding: 12px;">
                                    <p style="color: #ffffff; font-size: 12px; line-height: 1.5; margin: 0;">
                                      <strong>Please arrive 5-10 minutes early.</strong> We look forward to serving you!
                                    </p>
                                  </td>
                                </tr>
                              </table>
                              
                              <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0;">If you need to cancel or reschedule, please contact us as soon as possible.</p>
                            </td>
                          </tr>
                          
                          <!-- Footer -->
                          <tr>
                            <td style="background-color: #fafafa; padding: 16px 20px; border-top: 1px solid #e0e0e0;">
                              <p style="color: #999999; font-size: 11px; line-height: 1.4; margin: 0 0 4px; text-align: center;">Automated message from ${business.businessName}</p>
                              <p style="color: #666666; font-size: 11px; line-height: 1.4; margin: 0; text-align: center; font-weight: 600;">Appointment Management System</p>
                            </td>
                          </tr>
                          
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
            `
        });

        console.log(`✓ Confirmation email sent to: ${customer.email}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending confirmation email:', error);
        return false;
    }
};

/**
 * Send appointment completion email
 */
exports.sendAppointmentCompletionEmail = async (appointment, business, customer, pointsEarned) => {
    try {
        const staffName = appointment.staff ? appointment.staff.name : 'Our team';
        const finalPrice = appointment.finalPrice || appointment.service.price;
        const formattedDate = new Date(appointment.date).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
        });

        await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to: customer.email,
            subject: `Service Complete - Thank You! - ${business.businessName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafafa;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; padding: 20px 10px;">
                    <tr>
                      <td align="center">
                        <table width="500" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); overflow: hidden;">
                          
                          <!-- Header -->
                          <tr>
                            <td style="background: #1a1a1a; padding: 24px 20px; text-align: center;">
                              <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="32" cy="32" r="30" stroke="#ffffff" stroke-width="2" fill="none"/>
                                <path d="M20 32L28 40L44 24" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                              </svg>
                              <h1 style="color: #ffffff; margin: 12px 0 4px; font-size: 20px; font-weight: 700;">Service Complete</h1>
                              <p style="color: #cccccc; margin: 0; font-size: 13px;">Thank you for choosing us</p>
                            </td>
                          </tr>
                          
                          <!-- Content -->
                          <tr>
                            <td style="padding: 24px 20px;">
                              <p style="color: #1a1a1a; font-size: 14px; line-height: 1.5; margin: 0 0 12px;">Hello ${customer.firstName},</p>
                              <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0 0 20px;">Your <strong>${appointment.service.name}</strong> appointment has been completed successfully!</p>
                              
                              <!-- Service Summary Box -->
                              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 20px;">
                                <tr>
                                  <td style="padding: 16px;">
                                    <p style="color: #999999; font-size: 10px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Service Summary</p>
                                    
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                      <tr>
                                        <td style="padding: 4px 0; color: #666666; font-size: 13px; width: 100px;">Service:</td>
                                        <td style="padding: 4px 0; color: #1a1a1a; font-size: 13px; font-weight: 600;">${appointment.service.name}</td>
                                      </tr>
                                      <tr>
                                        <td style="padding: 4px 0; color: #666666; font-size: 13px;">Business:</td>
                                        <td style="padding: 4px 0; color: #1a1a1a; font-size: 13px; font-weight: 600;">${business.businessName}</td>
                                      </tr>
                                      <tr>
                                        <td style="padding: 4px 0; color: #666666; font-size: 13px;">Staff:</td>
                                        <td style="padding: 4px 0; color: #1a1a1a; font-size: 13px; font-weight: 600;">${staffName}</td>
                                      </tr>
                                      <tr>
                                        <td style="padding: 4px 0; color: #666666; font-size: 13px;">Date:</td>
                                        <td style="padding: 4px 0; color: #1a1a1a; font-size: 13px; font-weight: 600;">${formattedDate}</td>
                                      </tr>
                                      <tr>
                                        <td style="padding: 4px 0; color: #666666; font-size: 13px;">Amount Paid:</td>
                                        <td style="padding: 4px 0; color: #1a1a1a; font-size: 13px; font-weight: 600;">₱${finalPrice}</td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                              
                              <!-- Rewards Box -->
                              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 6px; margin-bottom: 20px;">
                                <tr>
                                  <td style="padding: 16px; text-align: center;">
                                    <p style="color: #cccccc; font-size: 12px; margin: 0 0 6px;">Rewards Earned</p>
                                    <p style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 6px;">+${pointsEarned} Points</p>
                                    <p style="color: #cccccc; font-size: 12px; margin: 0;">Total Points: ${customer.rewardPoints} points</p>
                                  </td>
                                </tr>
                              </table>
                              
                              <p style="color: #666666; font-size: 13px; line-height: 1.5; margin: 0 0 8px; text-align: center;">Thank you for choosing <strong>${business.businessName}</strong>.</p>
                              <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">We hope to see you again soon!</p>
                            </td>
                          </tr>
                          
                          <!-- Footer -->
                          <tr>
                            <td style="background-color: #fafafa; padding: 16px 20px; border-top: 1px solid #e0e0e0;">
                              <p style="color: #999999; font-size: 11px; line-height: 1.4; margin: 0 0 4px; text-align: center;">Automated message from ${business.businessName}</p>
                              <p style="color: #666666; font-size: 11px; line-height: 1.4; margin: 0; text-align: center; font-weight: 600;">Appointment Management System</p>
                            </td>
                          </tr>
                          
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
            `
        });

        console.log(`✓ Completion email sent to: ${customer.email}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending completion email:', error);
        return false;
    }
};

/**
 * Send business approval email
 */
exports.sendBusinessApprovalEmail = async (business, owner) => {
    try {
        const formattedDate = new Date().toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
        });

        await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to: owner.email,
            subject: `🎉 Business Application Approved - ${business.businessName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafafa;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; padding: 20px 10px;">
                    <tr>
                      <td align="center">
                        <table width="500" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); overflow: hidden;">
                          
                          <!-- Header -->
                          <tr>
                            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px 20px; text-align: center;">
                              <svg width="48" height="48" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="40" cy="40" r="38" stroke="#ffffff" stroke-width="3" fill="none"/>
                                <path d="M25 40L35 50L55 30" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                              </svg>
                              <h1 style="color: #ffffff; margin: 12px 0 4px; font-size: 22px; font-weight: 700;">Congratulations!</h1>
                              <p style="color: #ffffff; margin: 0; font-size: 14px; opacity: 0.95;">Your Business Application is Approved</p>
                            </td>
                          </tr>
                          
                          <!-- Content -->
                          <tr>
                            <td style="padding: 24px 20px;">
                              <p style="color: #1a1a1a; font-size: 14px; line-height: 1.5; margin: 0 0 12px;">Hello ${owner.firstName} ${owner.lastName},</p>
                              <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0 0 20px;">We're excited to inform you that your business application for <strong>${business.businessName}</strong> has been approved!</p>
                              
                              <!-- Business Details Box -->
                              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; margin-bottom: 20px;">
                                <tr>
                                  <td style="padding: 16px;">
                                    <p style="color: #059669; font-size: 10px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Business Details</p>
                                    
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                      <tr>
                                        <td style="padding: 4px 0; color: #666666; font-size: 13px; width: 110px;">Business Name:</td>
                                        <td style="padding: 4px 0; color: #1a1a1a; font-size: 13px; font-weight: 600;">${business.businessName}</td>
                                      </tr>
                                      <tr>
                                        <td style="padding: 4px 0; color: #666666; font-size: 13px;">Address:</td>
                                        <td style="padding: 4px 0; color: #1a1a1a; font-size: 13px; font-weight: 600;">${business.address.street}, ${business.address.barangay}, ${business.address.city}, ${business.address.province} ${business.address.zipCode}</td>
                                      </tr>
                                      <tr>
                                        <td style="padding: 4px 0; color: #666666; font-size: 13px;">Approval Date:</td>
                                        <td style="padding: 4px 0; color: #1a1a1a; font-size: 13px; font-weight: 600;">${formattedDate}</td>
                                      </tr>
                                      <tr>
                                        <td style="padding: 4px 0; color: #666666; font-size: 13px;">Status:</td>
                                        <td style="padding: 4px 0;">
                                          <span style="display: inline-block; padding: 3px 10px; background: #10b981; color: #ffffff; border-radius: 10px; font-size: 11px; font-weight: 600;">APPROVED</span>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                              
                              <!-- Next Steps Box -->
                              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 8px; margin-bottom: 20px;">
                                <tr>
                                  <td style="padding: 16px;">
                                    <p style="color: #ffffff; font-size: 13px; font-weight: 600; margin: 0 0 10px;">Next Steps:</p>
                                    <ol style="color: #cccccc; font-size: 12px; line-height: 1.6; margin: 0; padding-left: 18px;">
                                      <li style="margin-bottom: 6px;">Log in to your business owner dashboard</li>
                                      <li style="margin-bottom: 6px;">Set up your business hours and services</li>
                                      <li style="margin-bottom: 6px;">Add staff members (optional)</li>
                                      <li style="margin-bottom: 0;">Start accepting appointments from customers!</li>
                                    </ol>
                                  </td>
                                </tr>
                              </table>
                              
                              <!-- CTA Button -->
                              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                                <tr>
                                  <td align="center">
                                    <a href="${process.env.BASE_URL || 'http://localhost:3000'}/business-owner/login" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);">
                                      Access Your Dashboard
                                    </a>
                                  </td>
                                </tr>
                              </table>
                              
                              <p style="color: #666666; font-size: 13px; line-height: 1.5; margin: 0 0 8px; text-align: center;">Welcome to the Appointment Management System!</p>
                              <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">If you have any questions, please don't hesitate to contact our support team.</p>
                            </td>
                          </tr>
                          
                          <!-- Footer -->
                          <tr>
                            <td style="background-color: #fafafa; padding: 16px 20px; border-top: 1px solid #e0e0e0;">
                              <p style="color: #999999; font-size: 11px; line-height: 1.4; margin: 0 0 4px; text-align: center;">Automated message from Appointment Management System</p>
                              <p style="color: #666666; font-size: 11px; line-height: 1.4; margin: 0; text-align: center; font-weight: 600;">© ${new Date().getFullYear()} AMS. All rights reserved.</p>
                            </td>
                          </tr>
                          
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
            `
        });

        console.log(`✓ Business approval email sent to: ${owner.email}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending business approval email:', error);
        return false;
    }
};

/**
 * Send business rejection email
 */
exports.sendBusinessRejectionEmail = async (business, owner, rejectionReason) => {
    try {
        const formattedDate = new Date().toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
        });

        await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to: owner.email,
            subject: `Business Application Update - ${business.businessName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafafa;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; padding: 20px 10px;">
                    <tr>
                      <td align="center">
                        <table width="500" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); overflow: hidden;">
                          
                          <!-- Header -->
                          <tr>
                            <td style="background: #1a1a1a; padding: 24px 20px; text-align: center;">
                              <svg width="48" height="48" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="40" cy="40" r="38" stroke="#ffffff" stroke-width="3" fill="none"/>
                                <path d="M30 30L50 50M50 30L30 50" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                              <h1 style="color: #ffffff; margin: 12px 0 4px; font-size: 22px; font-weight: 700;">Application Update</h1>
                              <p style="color: #cccccc; margin: 0; font-size: 14px;">Business Application Status</p>
                            </td>
                          </tr>
                          
                          <!-- Content -->
                          <tr>
                            <td style="padding: 24px 20px;">
                              <p style="color: #1a1a1a; font-size: 14px; line-height: 1.5; margin: 0 0 12px;">Hello ${owner.firstName} ${owner.lastName},</p>
                              <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0 0 20px;">Thank you for your interest in joining our platform. Unfortunately, your business application for <strong>${business.businessName}</strong> has not been approved at this time.</p>
                              
                              <!-- Business Details Box -->
                              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 20px;">
                                <tr>
                                  <td style="padding: 16px;">
                                    <p style="color: #999999; font-size: 10px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Application Details</p>
                                    
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                      <tr>
                                        <td style="padding: 4px 0; color: #666666; font-size: 13px; width: 110px;">Business Name:</td>
                                        <td style="padding: 4px 0; color: #1a1a1a; font-size: 13px; font-weight: 600;">${business.businessName}</td>
                                      </tr>
                                      <tr>
                                        <td style="padding: 4px 0; color: #666666; font-size: 13px;">Address:</td>
                                        <td style="padding: 4px 0; color: #1a1a1a; font-size: 13px; font-weight: 600;">${business.address.street}, ${business.address.barangay}, ${business.address.city}, ${business.address.province} ${business.address.zipCode}</td>
                                      </tr>
                                      <tr>
                                        <td style="padding: 4px 0; color: #666666; font-size: 13px;">Review Date:</td>
                                        <td style="padding: 4px 0; color: #1a1a1a; font-size: 13px; font-weight: 600;">${formattedDate}</td>
                                      </tr>
                                      <tr>
                                        <td style="padding: 4px 0; color: #666666; font-size: 13px;">Status:</td>
                                        <td style="padding: 4px 0;">
                                          <span style="display: inline-block; padding: 3px 10px; background: #dc2626; color: #ffffff; border-radius: 10px; font-size: 11px; font-weight: 600;">NOT APPROVED</span>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                              
                              <!-- Rejection Reason Box -->
                              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 8px; margin-bottom: 20px;">
                                <tr>
                                  <td style="padding: 16px;">
                                    <p style="color: #ffffff; font-size: 13px; font-weight: 600; margin: 0 0 8px;">Reason:</p>
                                    <p style="color: #cccccc; font-size: 13px; line-height: 1.6; margin: 0;">${rejectionReason}</p>
                                  </td>
                                </tr>
                              </table>
                              
                              <!-- Next Steps Box -->
                              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; margin-bottom: 20px;">
                                <tr>
                                  <td style="padding: 16px;">
                                    <p style="color: #059669; font-size: 13px; font-weight: 600; margin: 0 0 10px;">What's Next?</p>
                                    <p style="color: #666666; font-size: 12px; line-height: 1.6; margin: 0;">You can reapply with the necessary corrections. Please review the reason above and ensure all requirements are met before submitting a new application.</p>
                                  </td>
                                </tr>
                              </table>
                              
                              <!-- CTA Button -->
                              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                                <tr>
                                  <td align="center">
                                    <a href="${process.env.BASE_URL || 'http://localhost:3000'}/business-owner/login" style="display: inline-block; padding: 12px 32px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                                      Login to Reapply
                                    </a>
                                  </td>
                                </tr>
                              </table>
                              
                              <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">If you have any questions, please don't hesitate to contact our support team.</p>
                            </td>
                          </tr>
                          
                          <!-- Footer -->
                          <tr>
                            <td style="background-color: #fafafa; padding: 16px 20px; border-top: 1px solid #e0e0e0;">
                              <p style="color: #999999; font-size: 11px; line-height: 1.4; margin: 0 0 4px; text-align: center;">Automated message from Appointment Management System</p>
                              <p style="color: #666666; font-size: 11px; line-height: 1.4; margin: 0; text-align: center; font-weight: 600;">© ${new Date().getFullYear()} AMS. All rights reserved.</p>
                            </td>
                          </tr>
                          
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
            `
        });

        console.log(`✓ Business rejection email sent to: ${owner.email}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending business rejection email:', error);
        return false;
    }
};
