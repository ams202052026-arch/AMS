const OTPModel = require('../models/otp');
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
        }
      }
);

function generateOTP() {
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
}

exports.sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    const code = generateOTP();

    // Save OTP to the database (expires after 60 sec)
    await OTPModel.create({
      email,
      code
    });

    //Send the email
    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: 'Verify Your Email - AMS',
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
                        <path d="M20 26L32 34L44 26M20 26V40C20 41.1046 20.8954 42 22 42H42C43.1046 42 44 41.1046 44 40V26M20 26L32 18L44 26" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="32" cy="32" r="4" fill="#ffffff"/>
                      </svg>
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
                      
                      <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 0;">If you didn't create an account with AMS, please ignore this email or contact our support team if you have concerns.</p>
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

    console.log(`SERVICE 1 (SEND OTP)`);
    console.log(` - OTP SENT TO: ${email}`);
    console.log(` - OTP SAVED AND WILL DELETE AFTER 1 MINUTE`);

    res.redirect('/verifyOtp');
  }
  catch (error) {
    console.log(`(FAILED TO SEND OTP) ${error}`);
  }
};

exports.verifyOTP = async (req, res, next) => {

    const email = req.session.customerDetails?.email;
    const { code } = req.body;

    if (!email) {

        return res.send({ success: false, message: "Session expired. Please sign up again." });
    }

    // Find OTP record by email only
    const otpRecord = await OTPModel.findOne({ email });

    if (!otpRecord) {
        
      
        console.log('OTP EXPIRED')
        return res.redirect('/signUp')
    }

    
    if (Date.now() - otpRecord.createdAt.getTime() > 60000) {

        console.log('OTP DELETED');
        console.log(Date.now());
        console.log(otpRecord.createdAt.getTime());
        return res.redirect('/signUp')
    }

    // Check if code matches
    if (otpRecord.code !== code) {

      console.log("S2 wrong otp");
      console.log(otpRecord.code)

       console.log(code)
        return res.render('otp');
    }

    

     console.log("S2");
    console.log("OTP VERIFIED");
    next(); 
};
