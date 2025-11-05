import prisma from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

interface GuardProfileUpdateData {
  experience?: string;
  profilePictureUrl?: string;
  idCardFrontUrl?: string;
  idCardBackUrl?: string;
  certificationUrls?: string[];
}

export class GuardService {
  async getAllGuards(page: number = 1, limit: number = 50, status?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [guards, total] = await Promise.all([
      prisma.guard.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              isActive: true,
            },
          },
          emergencyContacts: true,
          qualifications: {
            where: {
              expiryDate: {
                gte: new Date(),
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.guard.count({ where }),
    ]);

    return {
      items: guards,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getGuardById(id: string) {
    const guard = await prisma.guard.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
            createdAt: true,
          },
        },
        emergencyContacts: true,
        qualifications: true,
        performanceMetrics: {
          orderBy: {
            year: 'desc',
            month: 'desc',
          },
          take: 12,
        },
        locations: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            location: true,
          },
        },
      },
    });

    if (!guard) {
      throw new NotFoundError('Guard not found');
    }

    return guard;
  }

  async updateGuardProfile(userId: string, data: GuardProfileUpdateData) {
    // Find the guard by userId
    const guard = await prisma.guard.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    if (!guard) {
      throw new NotFoundError('Guard profile not found');
    }

    const updated = await prisma.guard.update({
      where: { userId },
      data: {
        experience: data.experience,
        profilePictureUrl: data.profilePictureUrl,
        idCardFrontUrl: data.idCardFrontUrl,
        idCardBackUrl: data.idCardBackUrl,
        certificationUrls: data.certificationUrls || [],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    logger.info(`Guard profile updated: ${updated.user.email}, ID: ${updated.id}`);
    return updated;
  }

  async updateGuard(id: string, data: any) {
    const guard = await prisma.guard.findUnique({
      where: { id },
    });

    if (!guard) {
      throw new NotFoundError('Guard not found');
    }

    const updated = await prisma.guard.update({
      where: { id },
      data: {
        department: data.department,
        status: data.status,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    logger.info(`Guard updated: ${id}`);

    return updated;
  }

  async deleteGuard(id: string) {
    const guard = await prisma.guard.findUnique({
      where: { id },
    });

    if (!guard) {
      throw new NotFoundError('Guard not found');
    }

    await prisma.guard.delete({
      where: { id },
    });

    logger.info(`Guard deleted: ${id}`);

    return { message: 'Guard deleted successfully' };
  }

  async addEmergencyContact(guardId: string, data: any) {
    const guard = await prisma.guard.findUnique({
      where: { id: guardId },
    });

    if (!guard) {
      throw new NotFoundError('Guard not found');
    }

    const contact = await prisma.emergencyContact.create({
      data: {
        guardId,
        name: data.name,
        relationship: data.relationship,
        phone: data.phone,
        email: data.email,
        isPrimary: data.isPrimary || false,
      },
    });

    return contact;
  }

  async addQualification(guardId: string, data: any) {
    const guard = await prisma.guard.findUnique({
      where: { id: guardId },
    });

    if (!guard) {
      throw new NotFoundError('Guard not found');
    }

    const qualification = await prisma.qualification.create({
      data: {
        guardId,
        title: data.title,
        issuer: data.issuer,
        issueDate: new Date(data.issueDate),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        certificateUrl: data.certificateUrl,
        isVerified: data.isVerified || false,
      },
    });

    return qualification;
  }

  async getGuardPerformance(guardId: string, months: number = 6) {
    const guard = await prisma.guard.findUnique({
      where: { id: guardId },
    });

    if (!guard) {
      throw new NotFoundError('Guard not found');
    }

    const metrics = await prisma.performanceMetric.findMany({
      where: { guardId },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
      take: months,
    });

    return metrics;
  }
}

export default new GuardService();
