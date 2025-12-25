const { getPermanentAdminAccessURL } = require('../middleware/adminAccess');

console.log('\n🔐 PERMANENT ADMIN ACCESS URL');
console.log('================================\n');
console.log('Copy and paste this URL in your browser:\n');
console.log(getPermanentAdminAccessURL('http://localhost:3000'));
console.log('\n================================\n');
console.log('This URL will:');
console.log('1. Grant you secure access to the admin area');
console.log('2. Redirect you to the admin login page');
console.log('3. Allow you to login with your super admin credentials');
console.log('4. Never expire (permanent access)\n');
