require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS
    }
});

async function testEmail() {
    try {
        console.log('Testing forgot password email...');
        console.log('SMTP Email:', process.env.SMTP_EMAIL);
        
        const code = '12345';
        
        const result = await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to: process.env.SMTP_EMAIL, // Send to self for testing
            subject: 'Password Reset Code - AMS [TEST]',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafafa;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; padding: 40px 20px;">
                    <tr>
                      <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08); overflow: hidden;">
                          
                          <!-- Header -->
                          <tr>
                            <td style="background: #1a1a1a; padding: 40px 40px 30px; text-align: center;">
                              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="32" cy="32" r="30" stroke="#ffffff" stroke-width="2" fill="none"/>
                                <path d="M32 18C26.4772 18 22 22.4772 22 28V30C20.8954 30 20 30.8954 20 32V44C20 45.1046 20.8954 46 22 46H42C43.1046 46 44 45.1046 44 44V32C44 30.8954 43.1046 30 42 30V28C42 22.4772 37.5228 18 32 18ZM32 20C36.4183 20 40 23.5817 40 28V30H24V28C24 23.5817 27.5817 20 32 20ZM32 34C33.1046 34 34 34.8954 34 36C34 36.7403 33.5978 37.3866 33 37.7324V40C33 40.5523 32.5523 41 32 41C31.4477 41 31 40.5523 31 40V37.7324C30.4022 37.3866 30 36.7403 30 36C30 34.8954 30.8954 34 32 34Z" fill="#ffffff"/>
                              </svg>
                              <h1 style="color: #ffffff; margin: 20px 0 10px; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Password Reset</h1>
                              <p style="color: #cccccc; margin: 0; font-size: 16px;">Secure your account</p>
                            </td>
                          </tr>
                          
                          <!-- Content -->
                          <tr>
                            <td style="padding: 40px;">
                              <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">Hello,</p>
                              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">We received a request to reset your password. Use the verification code below to proceed:</p>
                              
                              <!-- OTP Box -->
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td align="center" style="padding: 0 0 32px;">
                                    <div style="background: #fafafa; border: 2px solid #1a1a1a; border-radius: 12px; padding: 32px; display: inline-block;">
                                      <p style="color: #999999; font-size: 12px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Reset Code</p>
                                      <p style="color: #1a1a1a; font-size: 48px; font-weight: 700; margin: 0; letter-spacing: 12px; font-family: 'Courier New', monospace;">${code}</p>
                                    </div>
                                  </td>
                                </tr>
                              </table>
                              
                              <!-- Warning Box -->
                              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 8px; margin-bottom: 32px;">
                                <tr>
                                  <td style="padding: 16px;">
                                    <p style="color: #ffffff; font-size: 14px; line-height: 1.6; margin: 0;">
                                      <strong>Security Notice:</strong> This code expires in 60 seconds. If you didn't request a password reset, please secure your account immediately.
                                    </p>
                                  </td>
                                </tr>
                              </table>
                              
                              <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 0;">For your security, never share this code with anyone. AMS staff will never ask for your verification code.</p>
                            </td>
                          </tr>
                          
                          <!-- Footer -->
                          <tr>
                            <td style="background-color: #fafafa; padding: 32px 40px; border-top: 1px solid #e0e0e0;">
                              <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 0 0 8px; text-align: center;">Automated message from AMS</p>
                              <p style="color: #666666; font-size: 13px; line-height: 1.6; margin: 0; text-align: center; font-weight: 600;">Appointment Management System</p>
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
        
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', result.messageId);
        console.log('Check your email:', process.env.SMTP_EMAIL);
        
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        console.error('Full error:', error);
    }
}

testEmail();
