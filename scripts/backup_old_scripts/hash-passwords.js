const bcrypt = require('bcrypt');

async function hashPasswords() {
  const passwords = {
    'admin123': await bcrypt.hash('admin123', 10),
    'manager123': await bcrypt.hash('manager123', 10),
    'agent123': await bcrypt.hash('agent123', 10)
  };
  
  console.log('Password hashes:');
  console.log('admin123:', passwords['admin123']);
  console.log('manager123:', passwords['manager123']);
  console.log('agent123:', passwords['agent123']);
  
  // SQL to update users
  console.log('\nSQL to update users:');
  console.log(`UPDATE users SET password_hash = '${passwords['admin123']}' WHERE username = 'admin';`);
  console.log(`UPDATE users SET password_hash = '${passwords['manager123']}' WHERE username = 'manager';`);
  console.log(`UPDATE users SET password_hash = '${passwords['agent123']}' WHERE username = 'agent';`);
}

hashPasswords().catch(console.error);
