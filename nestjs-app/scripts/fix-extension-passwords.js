#!/usr/bin/env node

/**
 * Script to fix extension passwords that are stored as plain text
 * This will hash all plain text passwords using bcrypt
 */

const { DataSource } = require('typeorm');
const bcrypt = require('bcrypt');
const path = require('path');

// Import TypeORM configuration
const dataSourceConfig = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'postgres',
  port: parseInt(process.env.POSTGRES_PORT) || 5432,
  username: process.env.POSTGRES_USER || 'pbx_user',
  password: process.env.POSTGRES_PASSWORD || 'pbx_password',
  database: process.env.POSTGRES_DB || 'pbx_db',
  entities: [path.join(__dirname, '../dist/**/*.entity.js')],
  migrations: [path.join(__dirname, '../dist/migrations/*.js')],
  synchronize: false,
  logging: false,
};

async function fixExtensionPasswords() {
  console.log('🔧 Starting extension password fix...');
  
  const dataSource = new DataSource(dataSourceConfig);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connected');
    
    // Get all extensions
    const extensionRepository = dataSource.getRepository('Extension');
    const extensions = await extensionRepository.find();
    
    console.log(`📋 Found ${extensions.length} extensions to check`);
    
    let fixedCount = 0;
    const saltRounds = 10;
    
    for (const extension of extensions) {
      // Check if sipPassword is already hashed (bcrypt hashes start with $2b$)
      if (extension.sipPassword && !extension.sipPassword.startsWith('$2b$')) {
        console.log(`🔨 Fixing password for extension ${extension.extension}@${extension.domainId}`);
        
        // Store the plain password for FreeSWITCH
        const plainPassword = extension.sipPassword;
        
        // Hash the password for SIP authentication
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
        
        // Update the extension
        await extensionRepository.update(extension.id, {
          sipPassword: hashedPassword,
          freeswitchPassword: plainPassword // Keep plain password for FreeSWITCH
        });
        
        fixedCount++;
        console.log(`✅ Fixed extension ${extension.extension}@${extension.domainId}`);
      } else if (extension.sipPassword && extension.sipPassword.startsWith('$2b$')) {
        console.log(`✓ Extension ${extension.extension}@${extension.domainId} already has hashed password`);
      } else {
        console.log(`⚠️  Extension ${extension.extension}@${extension.domainId} has no password`);
      }
    }
    
    console.log(`\n🎉 Password fix completed!`);
    console.log(`📊 Fixed ${fixedCount} extensions`);
    console.log(`📊 Total extensions: ${extensions.length}`);
    
  } catch (error) {
    console.error('❌ Error fixing passwords:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  fixExtensionPasswords()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixExtensionPasswords };
