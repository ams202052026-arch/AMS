const OTPModel = require('../models/otp');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS
  }
});

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
      subject: 'Your OTP',
      html: `<h3>${code}</h3>`
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
