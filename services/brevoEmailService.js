const brevo = require('@getbrevo/brevo');

// Initialize Brevo API client
let apiInstance = null;
let isBrevoConfigured = false;

if (process.env.BREVO_API_KEY) {
    apiInstance = new brevo.TransactionalEmailsApi();
    const apiKey = apiInstance.authentications['apiKey'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    isBrevoConfigured = true;
    console.log('✅ Brevo API configured successfully');
} else {
    console.log('⚠️ Brevo API key not found, email sending will be disabled');
}

/**
 * Send email using Brevo API
 */
async function sendEmail({ to, subject, htmlContent, senderName = 'AMS' }) {
    if (!isBrevoConfigured) {
        throw new Error('Brevo API is not configured');
    }

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { 
        name: senderName, 
        email: process.env.SMTP_EMAIL || 'noreply@ams.com' 
    };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;

    try {
        const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`✅ Email sent successfully to ${to}`);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('❌ Brevo API error:', error);
        throw error;
    }
}

/**
 * Send OTP verification email
 */
async function sendOTPEmail(email, code) {
    const htmlContent = `
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
                      <h1 style="color: #ffffff; margin: 20px 0 10px; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Verify Your Email</h1>
                      <p style="color: #cccccc; margin: 0; font-size: 16px;">Welcome to AMS</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">Hello,</p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">Thank you for signing up! Please use the verification code below to complete your registration:</p>
                      
                      <!-- OTP Box -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 0 0 32px;">
                            <div style="background: #fafafa; border: 2px solid #1a1a1a; border-radius: 12px; padding: 32px; display: inline-block;">
                              <p style="color: #999999; font-size: 12px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Verification Code</p>
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
                              <strong>Important:</strong> This code will expire in 60 seconds. Please enter it promptly to verify your account.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 0;">If you didn't create an account with AMS, please ignore this email.</p>
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
    `;

    return await sendEmail({
        to: email,
        subject: 'Verify Your Email - AMS',
        htmlContent,
        senderName: 'AMS Verification'
    });
}

module.exports = {
    sendEmail,
    sendOTPEmail,
    isBrevoConfigured
};
