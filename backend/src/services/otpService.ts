import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';

const prisma = new PrismaClient();

// Rate limiting storage (in production, use Redis)
const otpAttempts = new Map<string, { count: number; lastAttempt: number }>();
const emailAttempts = new Map<string, { count: number; lastAttempt: number }>();

// Configure email transporter with enhanced settings
const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates in development
    },
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000, // 30 seconds
    socketTimeout: 60000, // 60 seconds
  };

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn('SMTP credentials not configured. Email sending will fail.');
  }

  return nodemailer.createTransport(config);
};

const transporter = createTransporter();

/**
 * Generate a cryptographically secure random OTP code
 */
export const generateOTP = (): string => {
  const length = parseInt(process.env.OTP_LENGTH || '6');
  
  // Use crypto.randomBytes for better security
  let otp = '';
  const bytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    otp += (bytes[i] % 10).toString();
  }
  
  logger.info(`Generated OTP with length: ${length}`);
  return otp;
};

/**
 * Calculate OTP expiry time with validation
 */
export const getOTPExpiry = (): Date => {
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');
  
  if (expiryMinutes < 1 || expiryMinutes > 60) {
    throw new ValidationError('OTP expiry must be between 1 and 60 minutes');
  }
  
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + expiryMinutes);
  
  logger.debug(`OTP expiry set to: ${expiry.toISOString()}`);
  return expiry;
};

/**
 * Check rate limiting for OTP requests
 */
export const checkRateLimit = (identifier: string, type: 'otp' | 'email'): boolean => {
  const storage = type === 'otp' ? otpAttempts : emailAttempts;
  const windowMs = parseInt(process.env.OTP_RATE_LIMIT_WINDOW || '300000'); // 5 minutes
  const maxAttempts = parseInt(process.env.OTP_RATE_LIMIT_MAX || '3');
  const now = Date.now();
  
  const attempts = storage.get(identifier);
  
  if (!attempts) {
    storage.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Reset if window has passed
  if (now - attempts.lastAttempt > windowMs) {
    storage.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Check if limit exceeded
  if (attempts.count >= maxAttempts) {
    logger.warn(`Rate limit exceeded for ${type}: ${identifier}`);
    return false;
  }
  
  // Increment count
  attempts.count++;
  attempts.lastAttempt = now;
  storage.set(identifier, attempts);
  
  return true;
};

/**
 * Send OTP email to user
 */
export const sendOTPEmail = async (email: string, otp: string, userName?: string): Promise<void> => {
  // DEV ONLY: Log OTP to console for testing
  console.log(`🔐 DEV OTP for ${email}: ${otp}`);
  
  // Logo URL - Update this to your hosted logo URL or use base64 encoded image
  const logoUrl = process.env.EMAIL_LOGO_URL || 'https://via.placeholder.com/180x60/1C6CA9/FFFFFF?text=tracSOpro';
  
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@tracsopro.com',
    to: email,
    subject: 'Email Verification - tracSOpro',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #000000;
            background-color: #F8F9FA;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          .email-wrapper {
            background-color: #F8F9FA;
            padding: 40px 20px;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #FFFFFF;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06);
          }
          .header {
            background: linear-gradient(135deg, #1C6CA9 0%, #0F4A73 100%);
            padding: 40px 30px;
            text-align: center;
          }
          .logo-container {
            display: inline-block;
            background-color: #FFFFFF;
            padding: 12px 24px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .logo {
            max-width: 180px;
            height: auto;
            display: block;
          }
          .logo-text {
            font-size: 28px;
            font-weight: 700;
            color: #FFFFFF;
            letter-spacing: -0.5px;
            margin-top: 12px;
          }
          .content {
            padding: 48px 40px;
          }
          .greeting {
            font-size: 24px;
            font-weight: 600;
            color: #000000;
            margin-bottom: 16px;
            line-height: 1.3;
          }
          .message {
            font-size: 16px;
            color: #828282;
            margin-bottom: 32px;
            line-height: 1.7;
          }
          .otp-container {
            background: linear-gradient(135deg, #E8F4FD 0%, #ACD3F1 100%);
            border-radius: 16px;
            padding: 32px 24px;
            margin: 32px 0;
            text-align: center;
            border: 2px solid #1C6CA9;
            box-shadow: 0 4px 12px rgba(28, 108, 169, 0.15);
          }
          .otp-label {
            font-size: 14px;
            font-weight: 500;
            color: #0F4A73;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
          }
          .otp-code {
            font-size: 42px;
            font-weight: 700;
            color: #1C6CA9;
            letter-spacing: 12px;
            font-family: 'Courier New', monospace;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .expiry-notice {
            background-color: #F8F9FA;
            border-left: 4px solid #1C6CA9;
            padding: 16px 20px;
            margin: 24px 0;
            border-radius: 8px;
          }
          .expiry-notice strong {
            color: #1C6CA9;
            font-size: 14px;
          }
          .expiry-notice p {
            color: #828282;
            font-size: 14px;
            margin: 4px 0 0 0;
          }
          .security-note {
            background-color: #FFF9E6;
            border: 1px solid #FFE082;
            border-radius: 8px;
            padding: 16px 20px;
            margin: 24px 0;
          }
          .security-note p {
            color: #F57C00;
            font-size: 14px;
            margin: 0;
          }
          .signature {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #E5E7EB;
          }
          .signature p {
            color: #828282;
            font-size: 15px;
            margin: 8px 0;
          }
          .signature strong {
            color: #000000;
          }
          .footer {
            background-color: #F8F9FA;
            padding: 32px 40px;
            text-align: center;
            border-top: 1px solid #E5E7EB;
          }
          .footer-text {
            font-size: 12px;
            color: #828282;
            line-height: 1.6;
            margin: 8px 0;
          }
          .footer-text a {
            color: #1C6CA9;
            text-decoration: none;
          }
          .footer-text a:hover {
            text-decoration: underline;
          }
          @media only screen and (max-width: 600px) {
            .email-wrapper {
              padding: 20px 10px;
            }
            .header {
              padding: 30px 20px;
            }
            .content {
              padding: 32px 24px;
            }
            .footer {
              padding: 24px 20px;
            }
            .otp-code {
              font-size: 36px;
              letter-spacing: 8px;
            }
            .greeting {
              font-size: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <div class="logo-container">
                <img src="${logoUrl}" alt="tracSOpro Logo" class="logo" />
              </div>
              <div class="logo-text">tracSOpro</div>
            </div>
            <div class="content">
              <h1 class="greeting">Email Verification</h1>
              <p class="message">Hello${userName ? ` ${userName}` : ''},</p>
              <p class="message">Thank you for registering with tracSOpro. Please use the verification code below to complete your email verification:</p>
              
              <div class="otp-container">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-code">${otp}</div>
              </div>
              
              <div class="expiry-notice">
                <strong>⏱️ Expires in ${process.env.OTP_EXPIRY_MINUTES || '10'} minutes</strong>
                <p>For security reasons, this code will expire shortly. Please verify your email as soon as possible.</p>
              </div>
              
              <div class="security-note">
                <p>🔒 <strong>Security Tip:</strong> If you didn't request this verification code, please ignore this email. Your account remains secure.</p>
              </div>
              
              <div class="signature">
                <p><strong>Best regards,</strong></p>
                <p>The tracSOpro Team</p>
              </div>
            </div>
            <div class="footer">
              <p class="footer-text">This is an automated email. Please do not reply to this message.</p>
              <p class="footer-text">&copy; ${new Date().getFullYear()} tracSOpro. All rights reserved.</p>
              <p class="footer-text">Need help? Contact us at <a href="mailto:support@tracsopro.com">support@tracsopro.com</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  // Check rate limiting
  if (!checkRateLimit(email, 'email')) {
    throw new ValidationError('Too many email requests. Please wait before requesting another OTP.');
  }

  try {
    // Verify transporter configuration
    await transporter.verify();
    
    const info = await transporter.sendMail(mailOptions);
    logger.info(`OTP email sent successfully to ${email}`, { messageId: info.messageId });
  } catch (error: any) {
    logger.error('Error sending OTP email:', { 
      email, 
      error: error.message,
      code: error.code,
      command: error.command 
    });
    
    // Provide specific error messages based on error type
    if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Please check SMTP credentials.');
    } else if (error.code === 'ECONNECTION') {
      throw new Error('Failed to connect to email server. Please try again later.');
    } else if (error.code === 'EMESSAGE') {
      throw new Error('Invalid email message format.');
    } else {
      throw new Error('Failed to send verification email. Please try again later.');
    }
  }
};

/**
 * Store OTP in database with enhanced security
 */
export const storeOTP = async (userId: string, otp: string): Promise<void> => {
  const expiry = getOTPExpiry();
  
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: otp,
        emailVerificationExpiry: expiry,
      },
    });
    
    logger.info(`OTP stored for user: ${userId}`, { expiresAt: expiry.toISOString() });
  } catch (error: any) {
    logger.error('Failed to store OTP:', { userId, error: error.message });
    throw new Error('Failed to store verification code');
  }
};

/**
 * Verify OTP code with enhanced security and rate limiting
 */
export const verifyOTP = async (userId: string, otp: string): Promise<boolean> => {
  // Check rate limiting for OTP attempts
  if (!checkRateLimit(userId, 'otp')) {
    logger.warn(`OTP verification rate limit exceeded for user: ${userId}`);
    throw new ValidationError('Too many OTP attempts. Please wait before trying again.');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      emailVerificationToken: true,
      emailVerificationExpiry: true,
    },
  });

  if (!user) {
    logger.warn(`OTP verification attempted for non-existent user: ${userId}`);
    return false;
  }

  // Check if OTP exists
  if (!user.emailVerificationToken) {
    logger.warn(`No OTP found for user: ${userId}`);
    return false;
  }

  // Check if OTP is expired
  if (!user.emailVerificationExpiry || user.emailVerificationExpiry < new Date()) {
    logger.warn(`Expired OTP verification attempt for user: ${userId}`);
    return false;
  }

  // Normalize OTP strings (trim whitespace, ensure same length)
  const storedOTP = user.emailVerificationToken.trim();
  const providedOTP = otp.trim();

  // Check length first (timingSafeEqual requires same length)
  if (storedOTP.length !== providedOTP.length) {
    logger.warn(`OTP length mismatch for user: ${userId} (stored: ${storedOTP.length}, provided: ${providedOTP.length})`);
    return false;
  }

  // Verify OTP using constant-time comparison to prevent timing attacks
  let isValidOTP = false;
  try {
    isValidOTP = crypto.timingSafeEqual(
      Buffer.from(storedOTP),
      Buffer.from(providedOTP)
    );
  } catch (error: any) {
    logger.error(`Error during OTP comparison for user: ${userId}`, { error: error.message });
    return false;
  }

  if (!isValidOTP) {
    logger.warn(`Invalid OTP verification attempt for user: ${userId}`);
    return false;
  }

  try {
    // Mark email as verified and clear OTP
    await prisma.user.update({
      where: { id: userId },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    logger.info(`Email verified successfully for user: ${userId}`);
    
    // Clear rate limiting attempts on successful verification
    otpAttempts.delete(userId);
    
    return true;
  } catch (error: any) {
    logger.error('Failed to update user verification status:', { userId, error: error.message });
    throw new Error('Failed to complete email verification');
  }
};

/**
 * Verify OTP by email (for password reset)
 */
export const verifyOTPByEmail = async (email: string, otp: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      emailVerificationToken: true,
      emailVerificationExpiry: true,
    },
  });

  if (!user) {
    return false;
  }

  return verifyOTP(user.id, otp);
};

/**
 * Send OTP for password reset with enhanced security
 */
export const sendPasswordResetOTP = async (email: string): Promise<void> => {
  // Check rate limiting
  if (!checkRateLimit(email, 'email')) {
    throw new ValidationError('Too many password reset requests. Please wait before trying again.');
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
    },
  });

  if (!user) {
    // Don't reveal if user exists for security
    logger.warn(`Password reset attempted for non-existent email: ${email}`);
    throw new ValidationError('If this email is registered, you will receive a password reset code.');
  }

  if (!user.isActive) {
    logger.warn(`Password reset attempted for inactive user: ${email}`);
    throw new ValidationError('Account is inactive. Please contact support.');
  }

  try {
    const otp = generateOTP();
    await storeOTP(user.id, otp);
    
    // DEV ONLY: Log OTP to console for testing
    console.log(`🔐 DEV OTP for ${user.email}: ${otp}`);
    
    const userName = `${user.firstName} ${user.lastName}`.trim();
    await sendPasswordResetOTP_Email(email, otp, userName);
    
    logger.info(`Password reset OTP sent to: ${email}`);
  } catch (error: any) {
    logger.error('Failed to send password reset OTP:', { email, error: error.message });
    throw new Error('Failed to send password reset code. Please try again later.');
  }
};

/**
 * Send password reset OTP email with custom template
 */
export const sendPasswordResetOTP_Email = async (email: string, otp: string, userName?: string): Promise<void> => {
  // Logo URL - Update this to your hosted logo URL or use base64 encoded image
  const logoUrl = process.env.EMAIL_LOGO_URL || 'https://via.placeholder.com/180x60/1C6CA9/FFFFFF?text=tracSOpro';
  
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@tracsopro.com',
    to: email,
    subject: 'Password Reset - tracSOpro',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #000000;
            background-color: #F8F9FA;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          .email-wrapper {
            background-color: #F8F9FA;
            padding: 40px 20px;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #FFFFFF;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06);
          }
          .header {
            background: linear-gradient(135deg, #F44336 0%, #D32F2F 100%);
            padding: 40px 30px;
            text-align: center;
          }
          .logo-container {
            display: inline-block;
            background-color: #FFFFFF;
            padding: 12px 24px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .logo {
            max-width: 180px;
            height: auto;
            display: block;
          }
          .logo-text {
            font-size: 28px;
            font-weight: 700;
            color: #FFFFFF;
            letter-spacing: -0.5px;
            margin-top: 12px;
          }
          .content {
            padding: 48px 40px;
          }
          .greeting {
            font-size: 24px;
            font-weight: 600;
            color: #000000;
            margin-bottom: 16px;
            line-height: 1.3;
          }
          .message {
            font-size: 16px;
            color: #828282;
            margin-bottom: 32px;
            line-height: 1.7;
          }
          .otp-container {
            background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%);
            border-radius: 16px;
            padding: 32px 24px;
            margin: 32px 0;
            text-align: center;
            border: 2px solid #F44336;
            box-shadow: 0 4px 12px rgba(244, 67, 54, 0.15);
          }
          .otp-label {
            font-size: 14px;
            font-weight: 500;
            color: #C62828;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
          }
          .otp-code {
            font-size: 42px;
            font-weight: 700;
            color: #D32F2F;
            letter-spacing: 12px;
            font-family: 'Courier New', monospace;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .expiry-notice {
            background-color: #F8F9FA;
            border-left: 4px solid #F44336;
            padding: 16px 20px;
            margin: 24px 0;
            border-radius: 8px;
          }
          .expiry-notice strong {
            color: #D32F2F;
            font-size: 14px;
          }
          .expiry-notice p {
            color: #828282;
            font-size: 14px;
            margin: 4px 0 0 0;
          }
          .warning-box {
            background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);
            border: 2px solid #FF9800;
            border-radius: 12px;
            padding: 20px 24px;
            margin: 24px 0;
            box-shadow: 0 2px 8px rgba(255, 152, 0, 0.1);
          }
          .warning-box strong {
            color: #E65100;
            font-size: 15px;
            display: block;
            margin-bottom: 8px;
          }
          .warning-box p {
            color: #E65100;
            font-size: 14px;
            margin: 0;
            line-height: 1.6;
          }
          .security-note {
            background-color: #F3E5F5;
            border-left: 4px solid #9C27B0;
            border-radius: 8px;
            padding: 16px 20px;
            margin: 24px 0;
          }
          .security-note p {
            color: #7B1FA2;
            font-size: 14px;
            margin: 0;
            line-height: 1.6;
          }
          .signature {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #E5E7EB;
          }
          .signature p {
            color: #828282;
            font-size: 15px;
            margin: 8px 0;
          }
          .signature strong {
            color: #000000;
          }
          .footer {
            background-color: #F8F9FA;
            padding: 32px 40px;
            text-align: center;
            border-top: 1px solid #E5E7EB;
          }
          .footer-text {
            font-size: 12px;
            color: #828282;
            line-height: 1.6;
            margin: 8px 0;
          }
          .footer-text a {
            color: #1C6CA9;
            text-decoration: none;
          }
          .footer-text a:hover {
            text-decoration: underline;
          }
          @media only screen and (max-width: 600px) {
            .email-wrapper {
              padding: 20px 10px;
            }
            .header {
              padding: 30px 20px;
            }
            .content {
              padding: 32px 24px;
            }
            .footer {
              padding: 24px 20px;
            }
            .otp-code {
              font-size: 36px;
              letter-spacing: 8px;
            }
            .greeting {
              font-size: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <div class="logo-container">
                <img src="${logoUrl}" alt="tracSOpro Logo" class="logo" />
              </div>
              <div class="logo-text">tracSOpro</div>
            </div>
            <div class="content">
              <h1 class="greeting">Password Reset Request</h1>
              <p class="message">Hello${userName ? ` ${userName}` : ''},</p>
              <p class="message">We received a request to reset your password for your tracSOpro account. Use the verification code below to proceed with resetting your password:</p>
              
              <div class="otp-container">
                <div class="otp-label">Your Reset Code</div>
                <div class="otp-code">${otp}</div>
              </div>
              
              <div class="expiry-notice">
                <strong>⏱️ Expires in ${process.env.OTP_EXPIRY_MINUTES || '10'} minutes</strong>
                <p>For security reasons, this code will expire shortly. Please reset your password as soon as possible.</p>
              </div>
              
              <div class="warning-box">
                <strong>⚠️ Important Security Notice</strong>
                <p>If you didn't request this password reset, please ignore this email immediately. Your account remains secure, but we recommend changing your password as a precaution.</p>
              </div>
              
              <div class="security-note">
                <p>🔒 <strong>Security Tip:</strong> Never share this code with anyone. tracSOpro staff will never ask for your verification code.</p>
              </div>
              
              <div class="signature">
                <p><strong>Best regards,</strong></p>
                <p>The tracSOpro Security Team</p>
              </div>
            </div>
            <div class="footer">
              <p class="footer-text">This is an automated email. Please do not reply to this message.</p>
              <p class="footer-text">&copy; ${new Date().getFullYear()} tracSOpro. All rights reserved.</p>
              <p class="footer-text">Need help? Contact us at <a href="mailto:support@tracsopro.com">support@tracsopro.com</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.verify();
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Password reset OTP email sent to ${email}`, { messageId: info.messageId });
  } catch (error: any) {
    logger.error('Error sending password reset OTP email:', { email, error: error.message });
    throw new Error('Failed to send password reset email');
  }
};

export default {
  generateOTP,
  getOTPExpiry,
  checkRateLimit,
  sendOTPEmail,
  storeOTP,
  verifyOTP,
  verifyOTPByEmail,
  sendPasswordResetOTP,
  sendPasswordResetOTP_Email,
};
