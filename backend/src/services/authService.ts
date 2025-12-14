import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { signAccessToken, signRefreshToken, verifyToken, getTokenExpiresIn } from '../utils/jwt.js';
import { UnauthorizedError, ConflictError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import otpService from './otpService.js';
import clientService from './clientService.js';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');
const OTP_ENABLED = process.env.OTP_ENABLED !== 'false';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'GUARD' | 'ADMIN' | 'CLIENT';
  accountType?: 'INDIVIDUAL' | 'COMPANY';
  invitationCode?: string;
  // Admin registration fields
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
}


interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  async register(data: RegisterData) {
    const { email, password, firstName, lastName, phone, role, accountType, invitationCode, companyName, companyEmail, companyPhone } = data;

    // Validate registration requirements
    const userRole = role || 'GUARD';
    
    // Guard and Client MUST have invitation code
    if ((userRole === 'GUARD' || userRole === 'CLIENT') && !invitationCode) {
      throw new ValidationError(
        'Invitation code is required for Guard and Client registration. Please contact your security company administrator.'
      );
    }

    // Admin registration requires company details
    if (userRole === 'ADMIN') {
      if (!companyName || !companyEmail) {
        throw new ValidationError(
          'Company name and email are required for Admin registration.'
        );
      }
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        isEmailVerified: true,
        isActive: true,
      },
    });

    if (existingUser) {
      // If user exists but email is not verified, allow resending OTP
      if (!existingUser.isEmailVerified) {
        logger.info(`User ${existingUser.id} exists but email not verified. Resending OTP.`);
        
        // Generate and send new OTP
        const otp = otpService.generateOTP();
        await otpService.storeOTP(existingUser.id, otp);
        
        try {
          await otpService.sendOTPEmail(existingUser.email, otp, firstName);
          logger.info(`OTP resent to unverified user: ${existingUser.email}`);
        } catch (emailError: any) {
          // In dev mode, if SMTP is not configured, log OTP and continue
          const isDevMode = process.env.NODE_ENV !== 'production';
          const isSmtpError = emailError.message?.includes('SMTP') || 
                            emailError.message?.includes('email authentication') ||
                            emailError.message?.includes('Failed to send');
          
          if (isDevMode && isSmtpError) {
            logger.warn(`SMTP not configured - OTP not sent via email. DEV OTP: ${otp}`);
          } else {
            logger.error(`Failed to resend OTP email:`, emailError);
            throw emailError;
          }
        }
        
        // Return user info for OTP verification
        return {
          userId: existingUser.id,
          email: existingUser.email,
          role: role || 'GUARD',
          accountType: accountType || null,
          message: 'A new verification code has been sent to your email. Please verify your email to complete registration.',
        };
      }
      
      // If email is already verified, user should login instead
      throw new ConflictError('Email already registered. Please login instead.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role: role || 'GUARD',
          accountType: accountType || null,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          accountType: true,
          isActive: true,
          createdAt: true,
        },
      });

      // Create profiles based on role
      let guard = null;
      let client = null;
      let securityCompany = null;
      let companyUser = null;

      if (user.role === 'GUARD') {
        guard = await tx.guard.create({
          data: {
            userId: user.id,
            employeeId: `EMP${Date.now()}`,
            status: 'ACTIVE',
          },
        });
      } else if (user.role === 'CLIENT') {
        client = await tx.client.create({
          data: {
            userId: user.id,
            accountType: user.accountType || 'INDIVIDUAL',
          },
        });
      } else if (user.role === 'ADMIN') {
        // Admin registration: Create SecurityCompany with free tier
        securityCompany = await tx.securityCompany.create({
          data: {
            name: companyName!,
            email: companyEmail!,
            phone: companyPhone || phone || null,
            subscriptionPlan: 'BASIC', // Free tier
            subscriptionStatus: 'ACTIVE',
            subscriptionStartDate: new Date(),
            maxGuards: 2, // Free tier: 2 guards
            maxClients: 1, // Free tier: 1 client
            maxSites: 1, // Free tier: 1 site
          },
        });

        // Link admin to company as OWNER
        companyUser = await tx.companyUser.create({
          data: {
            securityCompanyId: securityCompany.id,
            userId: user.id,
            role: 'OWNER',
            isActive: true,
          },
        });

        logger.info(`Admin ${user.email} created SecurityCompany ${securityCompany.id} with free tier`);
      }

      // Handle invitation code if provided
      if (data.invitationCode) {
        const invitationService = (await import('./invitationService.js')).default;
        
        const validation = await invitationService.validateInvitation(
          data.invitationCode,
          user.email
        );

        if (!validation.valid) {
          throw new ValidationError(validation.error || 'Invalid invitation code');
        }

        const invitation = validation.invitation!;

        // Verify role matches invitation
        if (invitation.role !== user.role) {
          throw new ValidationError(
            `This invitation is for ${invitation.role} role, not ${user.role}`
          );
        }

        // Link to company
        if (user.role === 'GUARD' && guard) {
          await tx.companyGuard.create({
            data: {
              securityCompanyId: invitation.securityCompanyId,
              guardId: guard.id,
            },
          });
        } else if (user.role === 'CLIENT' && client) {
          await tx.companyClient.create({
            data: {
              securityCompanyId: invitation.securityCompanyId,
              clientId: client.id,
            },
          });
        }

        // Mark invitation as used
        await tx.invitation.update({
          where: { id: invitation.id },
          data: {
            usedAt: invitation.usedAt || new Date(),
            usedBy: user.id,
            currentUses: { increment: 1 },
          },
        });
      }

      // Return user with company info if admin
      if (user.role === 'ADMIN' && securityCompany) {
        return {
          ...user,
          securityCompanyId: securityCompany.id,
          companyName: securityCompany.name,
        };
      }

      return user;
    });

    const user = result;

    if (OTP_ENABLED) {
      // Generate and send OTP
      const otp = otpService.generateOTP();
      await otpService.storeOTP(user.id, otp);
      
      // Try to send OTP email, but don't fail registration if email fails in dev mode
      try {
        await otpService.sendOTPEmail(user.email, otp, user.firstName);
        logger.info(`User registered: ${user.email}, ID: ${user.id}, OTP sent`);
      } catch (emailError: any) {
        // In development mode, if email fails due to missing SMTP, bypass OTP
        const isDevMode = process.env.NODE_ENV !== 'production';
        const isSmtpError = emailError.message?.includes('SMTP') || 
                          emailError.message?.includes('email authentication') ||
                          emailError.message?.includes('Failed to send') ||
                          emailError.message?.includes('ECONNECTION') ||
                          emailError.code === 'EAUTH' ||
                          emailError.code === 'ECONNECTION';
        
        if (isDevMode && isSmtpError) {
          logger.warn(`SMTP not configured - bypassing OTP verification for dev mode. OTP: ${otp}`);
          
          // Mark email as verified automatically in dev mode when SMTP is missing
          await prisma.user.update({
            where: { id: user.id },
            data: { isEmailVerified: true },
          });
          
          const token = signAccessToken(user.id);
          const refreshToken = signRefreshToken(user.id);
          
          return {
            token,
            refreshToken,
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              phone: user.phone,
              role: user.role,
              isActive: user.isActive,
              createdAt: user.createdAt,
            },
            expiresIn: getTokenExpiresIn(),
            message: `Registration successful (OTP bypassed - SMTP not configured). DEV OTP: ${otp}`,
          };
        } else {
          // In production or non-SMTP errors, throw the error
          logger.error(`Failed to send OTP email for user ${user.id}:`, emailError);
          throw emailError;
        }
      }
      
      // Return user info without tokens (they'll get tokens after OTP verification)
      return {
        userId: user.id,
        email: user.email,
        role: user.role,
        accountType: user.accountType,
        message: 'Registration successful. Please verify your email with the OTP sent.',
      };
    } else {
      // Temporarily bypass OTP: mark verified and return tokens immediately
      await prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true },
      });

      const token = signAccessToken(user.id);
      const refreshToken = signRefreshToken(user.id);
      logger.info(`User registered (OTP bypass): ${user.email}, ID: ${user.id}`);

      return {
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
        expiresIn: getTokenExpiresIn(),
      };
    }
  }

  async login(data: LoginData) {
    const { email, password } = data;

    // Find user with profile data
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        guard: true,
        client: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    logger.info(`User logged in: ${user.email}`);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        guard: user.guard ? {
          id: user.guard.id,
          employeeId: user.guard.employeeId,
          status: user.guard.status,
        } : undefined,
        client: user.client ? {
          id: user.client.id,
          accountType: user.client.accountType,
        } : undefined,
      },
      expiresIn: getTokenExpiresIn(),
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = verifyToken(refreshToken);

      if (payload.type !== 'refresh') {
        throw new UnauthorizedError('Invalid token type');
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('User not found or inactive');
      }

      const newToken = signAccessToken(user.id);

      return {
        token: newToken,
        expiresIn: getTokenExpiresIn(),
      };
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        guard: {
          select: {
            id: true,
            employeeId: true,
            department: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    logger.info(`Password changed for user: ${user.email}`);

    return { message: 'Password changed successfully' };
  }

  async loginById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        accountType: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive');
    }

    const token = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    logger.info(`User logged in by ID: ${user.email}`);

    return {
      token,
      refreshToken,
      user,
      expiresIn: getTokenExpiresIn(),
    };
  }

  async resendOTP(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      throw new ValidationError('User not found');
    }

    if (user.isEmailVerified) {
      throw new ValidationError('Email already verified');
    }

    const otp = otpService.generateOTP();
    await otpService.storeOTP(user.id, otp);
    await otpService.sendOTPEmail(user.email, otp, user.firstName);

    logger.info(`OTP resent to: ${user.email}`);
  }

  async resetPassword(email: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new ValidationError('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    logger.info(`Password reset for user: ${user.email}`);
  }
}

export default new AuthService();
