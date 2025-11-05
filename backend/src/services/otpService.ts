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
  
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@tracsopro.com',
    to: email,
    subject: 'Email Verification - tracSOpro',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Inter', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 2px solid #1C6CA9;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #1C6CA9;
          }
          .content {
            padding: 30px 0;
          }
          .otp-box {
            background-color: #F9FAFB;
            border: 2px solid #1C6CA9;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #1C6CA9;
            letter-spacing: 8px;
          }
          .footer {
            text-align: center;
            padding: 20px 0;
            border-top: 1px solid #E5E7EB;
            color: #6B7280;
            font-size: 12px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #1C6CA9;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">tracSOpro</div>
          </div>
          <div class="content">
            <h2>Email Verification</h2>
            <p>Hello${userName ? ` ${userName}` : ''},</p>
            <p>Thank you for registering with tracSOpro. Please use the following OTP code to verify your email address:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            
            <p><strong>This code will expire in ${process.env.OTP_EXPIRY_MINUTES || '10'} minutes.</strong></p>
            
            <p>If you didn't request this code, please ignore this email.</p>
            
            <p>Best regards,<br>The tracSOpro Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} tracSOpro. All rights reserved.</p>
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
    
    return info;
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

  // Verify OTP using constant-time comparison to prevent timing attacks
  const isValidOTP = crypto.timingSafeEqual(
    Buffer.from(user.emailVerificationToken),
    Buffer.from(otp)
  );

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
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@tracsopro.com',
    to: email,
    subject: 'Password Reset - tracSOpro',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #1C6CA9; }
          .logo { font-size: 24px; font-weight: bold; color: #1C6CA9; }
          .content { padding: 30px 0; }
          .otp-box { background-color: #F9FAFB; border: 2px solid #DC2626; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #DC2626; letter-spacing: 8px; }
          .footer { text-align: center; padding: 20px 0; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 12px; }
          .warning { background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px; margin: 20px 0; color: #991B1B; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">tracSOpro</div>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hello${userName ? ` ${userName}` : ''},</p>
            <p>We received a request to reset your password. Please use the following code to reset your password:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            
            <div class="warning">
              <strong>Security Notice:</strong> This code will expire in ${process.env.OTP_EXPIRY_MINUTES || '10'} minutes. If you didn't request this password reset, please ignore this email and consider changing your password.
            </div>
            
            <p>For security reasons, never share this code with anyone.</p>
            
            <p>Best regards,<br>The tracSOpro Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} tracSOpro. All rights reserved.</p>
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
