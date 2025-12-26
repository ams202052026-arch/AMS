require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('🔍 Testing Email Configuration...\n');
  
  console.log('📧 SMTP Settings:');
  console.log('  - Email:', process.env.SMTP_EMAIL || 'NOT SET');
  console.log('  - Password:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET');
  console.log('');

  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASS) {
    console.error('❌ SMTP credentials not found in environment variables!');
    console.log('\n💡 Make sure to add these to Render:');
    console.log('   SMTP_EMAIL=ams202052026@gmail.com');
    console.log('   SMTP_PASS=zuhe misn qymm vqil');
    process.exit(1);
  }

  try {
    console.log('🔌 Creating transporter...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS
      }
    });

    console.log('✅ Transporter created');
    console.log('📤 Sending test email...');

    const info = await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to: process.env.SMTP_EMAIL, // Send to self for testing
      subject: 'Test Email from Render - AMS',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from your AMS deployment on Render.</p>
        <p>If you received this, your email configuration is working correctly!</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
      `
    });

    console.log('✅ Email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('\n🎉 Email configuration is working!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Email sending failed!');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Possible causes:');
      console.log('   1. Wrong email or password');
      console.log('   2. Need to use App Password (not regular Gmail password)');
      console.log('   3. 2-Step Verification not enabled on Gmail');
      console.log('\n📝 To fix:');
      console.log('   1. Go to: https://myaccount.google.com/security');
      console.log('   2. Enable 2-Step Verification');
      console.log('   3. Go to: https://myaccount.google.com/apppasswords');
      console.log('   4. Create new App Password for "Mail"');
      console.log('   5. Use that password in SMTP_PASS');
    }
    
    process.exit(1);
  }
}

testEmail();
