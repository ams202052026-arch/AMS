const OTPModel = require('../models/otp');
const brevoEmailService = require('./brevoEmailService');

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

    // Check if Brevo is configured
    if (!brevoEmailService.isBrevoConfigured) {
      console.error('❌ Email service not configured');
      return res.render('signUp', { 
        error: 'Email service is currently unavailable. Please try again later.' 
      });
    }

    const code = generateOTP();

    // Save OTP to the database (expires after 60 sec)
    await OTPModel.create({
      email,
      code
    });

    // Send the email using Brevo API
    await brevoEmailService.sendOTPEmail(email, code);

    console.log(`SERVICE 1 (SEND OTP)`);
    console.log(` - OTP SENT TO: ${email}`);
    console.log(` - OTP SAVED AND WILL DELETE AFTER 1 MINUTE`);

    res.redirect('/verifyOtp');
  }
  catch (error) {
    console.error('❌ FAILED TO SEND OTP');
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    return res.render('signUp', { 
      error: 'Failed to send verification code. Please try again or check your email address.' 
    });
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
