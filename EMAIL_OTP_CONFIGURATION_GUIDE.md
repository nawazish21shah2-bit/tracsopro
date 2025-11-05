# Email OTP Configuration Guide

## Overview
This guide covers the complete email OTP module configuration for the Guard Tracking App authentication system.

## 🚀 Features Implemented

### Backend Enhancements
- **Enhanced OTP Service** with cryptographically secure OTP generation
- **Rate Limiting** to prevent abuse (configurable limits)
- **Professional Email Templates** with tracSOpro branding
- **Comprehensive Error Handling** with specific error messages
- **Security Features** including timing-safe comparisons
- **Logging & Monitoring** for debugging and security auditing

### Frontend Integration
- **Redux Integration** for OTP verification and resend
- **Enhanced Error Handling** with user-friendly messages
- **Rate Limit Awareness** with proper user feedback
- **Improved UX** with loading states and success confirmations

## 📧 Email Configuration

### 1. Environment Variables
Add these to your `.env` file:

```bash
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@tracsopro.com

# OTP Configuration
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
OTP_RATE_LIMIT_WINDOW=300000
OTP_RATE_LIMIT_MAX=3
```

### 2. Gmail Setup (Recommended)
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `SMTP_PASS`

### 3. Alternative SMTP Providers

#### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

#### AWS SES
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-access-key
SMTP_PASS=your-ses-secret-key
```

## 🔧 Configuration Options

### OTP Settings
- **OTP_LENGTH**: Length of OTP code (default: 6)
- **OTP_EXPIRY_MINUTES**: OTP validity period (default: 10 minutes)
- **OTP_MAX_ATTEMPTS**: Max verification attempts (default: 5)

### Rate Limiting
- **OTP_RATE_LIMIT_WINDOW**: Time window in milliseconds (default: 5 minutes)
- **OTP_RATE_LIMIT_MAX**: Max requests per window (default: 3)

## 🎨 Email Templates

### Registration OTP Email
- **Subject**: "Email Verification - tracSOpro"
- **Design**: Professional blue theme matching app branding
- **Features**: 
  - Large, easy-to-read OTP code
  - Expiry time display
  - Security warnings
  - Responsive design

### Password Reset OTP Email
- **Subject**: "Password Reset - tracSOpro"
- **Design**: Red accent for security emphasis
- **Features**:
  - Security warnings
  - Clear instructions
  - Professional branding

## 🔒 Security Features

### 1. Cryptographic Security
- **Secure OTP Generation**: Uses `crypto.randomBytes()` instead of `Math.random()`
- **Timing-Safe Comparison**: Prevents timing attacks during verification
- **Rate Limiting**: Prevents brute force attacks

### 2. Input Validation
- **Email Format Validation**: Regex-based email validation
- **OTP Format Validation**: Ensures 6-digit numeric format
- **Password Strength**: Minimum 8 characters for reset

### 3. Error Handling
- **Generic Error Messages**: Don't reveal system internals
- **Rate Limit Messages**: Clear user guidance
- **Logging**: Comprehensive security event logging

## 📱 Frontend Integration

### Redux Actions
```typescript
// Verify OTP
const result = await dispatch(verifyOTP({ userId, otp }));

// Resend OTP
const result = await dispatch(resendOTP(userId));

// Forgot Password
const result = await dispatch(forgotPassword(email));
```

### Error Handling
```typescript
if (verifyOTP.fulfilled.match(result)) {
  // Success
} else {
  const errorMessage = result.payload as string;
  // Handle specific errors
}
```

## 🧪 Testing

### 1. Backend Testing
```bash
# Start the backend server
cd backend
npm run dev

# Test endpoints with curl or Postman
POST /api/auth/register
POST /api/auth/verify-otp
POST /api/auth/resend-otp
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### 2. Frontend Testing
```bash
# Start React Native app
cd GuardTrackingApp
npm start

# Test flows:
# 1. Registration → OTP → Verification
# 2. Login → Forgot Password → OTP → Reset
# 3. Rate limiting scenarios
```

### 3. Email Testing
- **Development**: Use Gmail with app password
- **Production**: Use professional SMTP service
- **Testing Tools**: 
  - Mailtrap (development)
  - MailHog (local testing)

## 🚨 Troubleshooting

### Common Issues

#### 1. Email Not Sending
```bash
# Check SMTP credentials
# Verify network connectivity
# Check firewall settings
# Review server logs
```

#### 2. Rate Limiting Issues
```bash
# Clear rate limit storage (development)
# Adjust rate limit settings
# Check user behavior patterns
```

#### 3. OTP Verification Failures
```bash
# Check OTP expiry settings
# Verify database timestamps
# Review user input validation
```

### Debug Commands
```bash
# Check email transporter
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({...});
transporter.verify().then(console.log).catch(console.error);
"

# Test OTP generation
node -e "
const crypto = require('crypto');
console.log(crypto.randomBytes(6).toString());
"
```

## 📊 Monitoring

### Key Metrics
- **OTP Success Rate**: Percentage of successful verifications
- **Email Delivery Rate**: Successful email sends
- **Rate Limit Hits**: Frequency of rate limiting
- **Error Rates**: Types and frequency of errors

### Logging
```typescript
// Example log entries
logger.info('OTP sent successfully', { email, messageId });
logger.warn('Rate limit exceeded', { identifier, type });
logger.error('Email sending failed', { email, error });
```

## 🔄 Production Deployment

### 1. Environment Setup
- Use production SMTP service (SendGrid, Mailgun, SES)
- Configure proper DNS records (SPF, DKIM, DMARC)
- Set up monitoring and alerting

### 2. Security Hardening
- Use Redis for rate limiting storage
- Implement IP-based rate limiting
- Add CAPTCHA for repeated failures
- Monitor for suspicious patterns

### 3. Performance Optimization
- Connection pooling for SMTP
- Async email sending with queues
- Template caching
- Database query optimization

## 📚 API Documentation

### Endpoints

#### POST /api/auth/verify-otp
```json
{
  "userId": "string",
  "otp": "string"
}
```

#### POST /api/auth/resend-otp
```json
{
  "userId": "string"
}
```

#### POST /api/auth/forgot-password
```json
{
  "email": "string"
}
```

#### POST /api/auth/reset-password
```json
{
  "email": "string",
  "otp": "string",
  "newPassword": "string"
}
```

## 🎯 Next Steps

1. **Test Email Configuration**: Set up SMTP credentials and test email sending
2. **Configure Rate Limits**: Adjust limits based on usage patterns
3. **Monitor Performance**: Set up logging and monitoring
4. **Security Review**: Conduct security audit of OTP flow
5. **User Testing**: Test complete authentication flows

## 📞 Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify SMTP configuration and credentials
3. Test with different email providers
4. Review rate limiting settings
5. Contact development team for assistance

---

**Status**: ✅ Complete Email OTP Module Implementation
**Last Updated**: $(date)
**Version**: 1.0.0
