@echo off
echo ========================================
echo Setting up OTP and Email Service
echo ========================================

echo.
echo Step 1: Installing nodemailer...
call npm install nodemailer
call npm install --save-dev @types/nodemailer

echo.
echo Step 2: Generating Prisma migration...
call npx prisma migrate dev --name add_otp_and_client_support

echo.
echo Step 3: Generating Prisma Client...
call npx prisma generate

echo.
echo Step 4: Updating .env file...
echo.
echo Please add these variables to your .env file:
echo.
echo # Email Configuration
echo SMTP_HOST=smtp.gmail.com
echo SMTP_PORT=587
echo SMTP_USER=your-email@gmail.com
echo SMTP_PASS=your-app-password
echo SMTP_FROM=noreply@tracsopro.com
echo.
echo # OTP Configuration
echo OTP_EXPIRY_MINUTES=10
echo OTP_LENGTH=6
echo.

echo ========================================
echo Setup Complete!
echo.
echo Next steps:
echo 1. Update your .env file with email credentials
echo 2. Restart your backend server
echo 3. Test OTP functionality
echo ========================================
pause
