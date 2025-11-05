import prisma from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class IncidentService {
  async getAllIncidents(page: number = 1, limit: number = 50, filters?: any) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.type) where.type = filters.type;
    if (filters?.reportedBy) where.reportedBy = filters.reportedBy;

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
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
      prisma.incident.count({ where }),
    ]);

    return {
      items: incidents,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getIncidentById(id: string) {
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

    return incident;
  }

  async createIncident(reportedBy: string, data: any) {
    const incident = await prisma.incident.create({
      data: {
        reportedBy,
        locationId: data.locationId,
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

  async updateIncident(id: string, data: any) {
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

  async addEvidence(incidentId: string, data: any) {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundError('Incident not found');
    }

    const evidence = await prisma.evidence.create({
      data: {
        incidentId,
        type: data.type,
        url: data.url,
        description: data.description,
      },
    });

    return evidence;
  }

  async getIncidentStats(startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate || endDate) {
      where.reportedAt = {};
      if (startDate) where.reportedAt.gte = startDate;
      if (endDate) where.reportedAt.lte = endDate;
    }

    const [
      total,
      byStatus,
      bySeverity,
      byType,
    ] = await Promise.all([
      prisma.incident.count({ where }),
      prisma.incident.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.incident.groupBy({
        by: ['severity'],
        where,
        _count: true,
      }),
      prisma.incident.groupBy({
        by: ['type'],
        where,
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
