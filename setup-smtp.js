#!/usr/bin/env node

/**
 * SMTP Configuration Helper Script
 * Helps set up email credentials for the Guard Tracking App
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const prompt = (question) => {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
};

const envPath = path.join(__dirname, 'backend', '.env');

const setupSMTP = async () => {
  console.log('🚀 SMTP Configuration Setup');
  console.log('============================\n');

  // Check if .env exists
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found. Creating from .env.example...');
    const examplePath = path.join(__dirname, 'backend', '.env.example');
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath);
      console.log('✅ .env file created!\n');
    } else {
      console.log('❌ .env.example not found. Please create .env manually.');
      return;
    }
  }

  console.log('Choose your email provider:');
  console.log('1. Gmail (recommended for development)');
  console.log('2. SendGrid (recommended for production)');
  console.log('3. Mailgun');
  console.log('4. Custom SMTP server');
  console.log('5. Skip (configure manually)\n');

  const choice = await prompt('Enter your choice (1-5): ');

  let smtpConfig = {};

  switch (choice) {
    case '1':
      console.log('\n📧 Gmail Configuration');
      console.log('Please ensure you have:');
      console.log('1. Enabled 2-Factor Authentication');
      console.log('2. Generated an App Password\n');
      
      smtpConfig.SMTP_HOST = 'smtp.gmail.com';
      smtpConfig.SMTP_PORT = '587';
      smtpConfig.SMTP_USER = await prompt('Enter your Gmail address: ');
      smtpConfig.SMTP_PASS = await prompt('Enter your App Password (16 characters): ');
      smtpConfig.SMTP_FROM = await prompt('Enter sender email (or press Enter for default): ') || 'noreply@tracsopro.com';
      break;

    case '2':
      console.log('\n📧 SendGrid Configuration');
      smtpConfig.SMTP_HOST = 'smtp.sendgrid.net';
      smtpConfig.SMTP_PORT = '587';
      smtpConfig.SMTP_USER = 'apikey';
      smtpConfig.SMTP_PASS = await prompt('Enter your SendGrid API Key: ');
      smtpConfig.SMTP_FROM = await prompt('Enter sender email: ');
      break;

    case '3':
      console.log('\n📧 Mailgun Configuration');
      smtpConfig.SMTP_HOST = 'smtp.mailgun.org';
      smtpConfig.SMTP_PORT = '587';
      smtpConfig.SMTP_USER = await prompt('Enter your Mailgun SMTP username: ');
      smtpConfig.SMTP_PASS = await prompt('Enter your Mailgun SMTP password: ');
      smtpConfig.SMTP_FROM = await prompt('Enter sender email: ');
      break;

    case '4':
      console.log('\n📧 Custom SMTP Configuration');
      smtpConfig.SMTP_HOST = await prompt('Enter SMTP host: ');
      smtpConfig.SMTP_PORT = await prompt('Enter SMTP port (usually 587 or 465): ');
      smtpConfig.SMTP_USER = await prompt('Enter SMTP username: ');
      smtpConfig.SMTP_PASS = await prompt('Enter SMTP password: ');
      smtpConfig.SMTP_FROM = await prompt('Enter sender email: ');
      break;

    case '5':
      console.log('\n⏭️  Skipping automatic configuration.');
      console.log('Please manually edit the .env file with your SMTP credentials.');
      rl.close();
      return;

    default:
      console.log('❌ Invalid choice. Please run the script again.');
      rl.close();
      return;
  }

  // Update .env file
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Update SMTP settings
    Object.keys(smtpConfig).forEach(key => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${smtpConfig[key]}`);
      } else {
        envContent += `\n${key}=${smtpConfig[key]}`;
      }
    });

    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ SMTP configuration updated successfully!');
    
    // Test configuration
    const testNow = await prompt('\nDo you want to test the email configuration now? (y/n): ');
    if (testNow.toLowerCase() === 'y') {
      console.log('\n🧪 Testing email configuration...');
      console.log('Please run: node test-email-otp.js');
    }

  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
  }

  rl.close();
};

// Show current configuration
const showCurrentConfig = () => {
  if (fs.existsSync(envPath)) {
    console.log('\n📋 Current SMTP Configuration:');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const smtpLines = envContent.split('\n').filter(line => 
      line.startsWith('SMTP_') && !line.includes('SMTP_PASS')
    );
    
    smtpLines.forEach(line => {
      console.log(`   ${line}`);
    });
    
    const hasPassword = envContent.includes('SMTP_PASS=') && 
                       !envContent.match(/SMTP_PASS=\s*$/m);
    console.log(`   SMTP_PASS=${hasPassword ? '[CONFIGURED]' : '[NOT SET]'}`);
    console.log('');
  }
};

if (require.main === module) {
  showCurrentConfig();
  setupSMTP().catch(console.error);
}

module.exports = { setupSMTP };
