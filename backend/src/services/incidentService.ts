import prisma from '../config/database.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { buildReporterCompanyFilter } from '../utils/tenantScope.js';

export class IncidentService {
  private mergeCompanyFilter(where: any, securityCompanyId?: string) {
    if (!securityCompanyId) {
      return where;
    }
    return {
      ...where,
      ...buildReporterCompanyFilter(securityCompanyId),
    };
  }

  async isIncidentInCompany(incidentId: string, securityCompanyId: string): Promise<boolean> {
    const count = await prisma.incident.count({
      where: {
        id: incidentId,
        ...buildReporterCompanyFilter(securityCompanyId),
      },
    });
    return count > 0;
  }

  async getAllIncidents(
    page: number = 1,
    limit: number = 50,
    filters?: any,
    securityCompanyId?: string
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.type) where.type = filters.type;
    if (filters?.reportedBy) where.reportedBy = filters.reportedBy;

    const scopedWhere = this.mergeCompanyFilter(where, securityCompanyId);

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where: scopedWhere,
        skip,
        take: limit,
        include: {
          reporter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          location: true,
          evidence: true,
        },
        orderBy: {
          reportedAt: 'desc',
        },
      }),
      prisma.incident.count({ where: scopedWhere }),
    ]);

    return {
      items: incidents,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getIncidentById(
    id: string,
    access: { userId: string; role: string; securityCompanyId?: string }
  ) {
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        location: true,
        evidence: true,
      },
    });

    if (!incident) {
      throw new NotFoundError('Incident not found');
    }

    if (incident.reportedBy === access.userId) {
      return incident;
    }

    if (access.role === 'SUPER_ADMIN') {
      return incident;
    }

    if (access.role === 'ADMIN') {
      if (!access.securityCompanyId) {
        throw new ForbiddenError('Access denied');
      }
      const inCompany = await this.isIncidentInCompany(id, access.securityCompanyId);
      if (!inCompany) {
        throw new ForbiddenError('Access denied');
      }
      return incident;
    }

    throw new ForbiddenError('Access denied');
  }

  async createIncident(reportedBy: string, data: any) {
    // Handle location - create if not provided as locationId
    let locationId = data.locationId;

    if (!locationId && data.location) {
      const location = await prisma.location.create({
        data: {
          name: data.location.address || 'Incident Location',
          address: data.location.address || '',
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          type: 'FACILITY',
          description: `Location for incident: ${data.title}`,
        },
      });
      locationId = location.id;
    }

    if (!locationId) {
      throw new Error('locationId or location coordinates are required');
    }

    const incident = await prisma.incident.create({
      data: {
        reportedBy,
        locationId,
        type: data.type,
        severity: data.severity,
        title: data.title,
        description: data.description,
        status: 'REPORTED',
      },
      include: {
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        location: true,
      },
    });

    logger.info(`Incident created: ${incident.id} by ${reportedBy}`);

    return incident;
  }

  async updateIncident(id: string, data: any, securityCompanyId?: string) {
    if (securityCompanyId) {
      const inCompany = await this.isIncidentInCompany(id, securityCompanyId);
      if (!inCompany) {
        throw new NotFoundError('Incident not found');
      }
    }

    const incident = await prisma.incident.findUnique({
      where: { id },
    });

    if (!incident) {
      throw new NotFoundError('Incident not found');
    }

    const updated = await prisma.incident.update({
      where: { id },
      data: {
        status: data.status,
        severity: data.severity,
        description: data.description,
        resolvedAt: data.status === 'RESOLVED' || data.status === 'CLOSED' ? new Date() : null,
      },
      include: {
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        location: true,
        evidence: true,
      },
    });

    logger.info(`Incident updated: ${id}`);

    return updated;
  }

  async addEvidence(
    incidentId: string,
    data: any,
    access: { userId: string; role: string; securityCompanyId?: string }
  ) {
    const incident = await this.getIncidentById(incidentId, access);

    const evidence = await prisma.evidence.create({
      data: {
        incidentId: incident.id,
        type: data.type,
        url: data.url,
        description: data.description,
      },
    });

    return evidence;
  }

  async getIncidentStats(startDate?: Date, endDate?: Date, securityCompanyId?: string) {
    const where: any = {};

    if (startDate || endDate) {
      where.reportedAt = {};
      if (startDate) where.reportedAt.gte = startDate;
      if (endDate) where.reportedAt.lte = endDate;
    }

    const scopedWhere = this.mergeCompanyFilter(where, securityCompanyId);

    const [total, byStatus, bySeverity, byType] = await Promise.all([
      prisma.incident.count({ where: scopedWhere }),
      prisma.incident.groupBy({
        by: ['status'],
        where: scopedWhere,
        _count: true,
      }),
      prisma.incident.groupBy({
        by: ['severity'],
        where: scopedWhere,
        _count: true,
      }),
      prisma.incident.groupBy({
        by: ['type'],
        where: scopedWhere,
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus,
      bySeverity,
      byType,
    };
  }
}

export default new IncidentService();
