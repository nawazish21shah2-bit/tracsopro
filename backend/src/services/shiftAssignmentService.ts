import prisma from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError, UnauthorizedError } from '../utils/errors.js';

interface CheckInData {
  latitude?: number;
  longitude?: number;
  notes?: string;
}

interface CheckOutData {
  latitude?: number;
  longitude?: number;
  notes?: string;
}

interface CreateReportData {
  type: 'INCIDENT' | 'MAINTENANCE' | 'SECURITY_BREACH' | 'MEDICAL_EMERGENCY' | 'GENERAL';
  title: string;
  description: string;
}

export class ShiftAssignmentService {
  // Get guard's assigned shifts
  async getGuardAssignments(guardId: string, page = 1, limit = 10, status?: string) {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = { guardId };
      if (status) {
        whereClause.status = status;
      }

      const [assignments, total] = await Promise.all([
        prisma.shiftAssignment.findMany({
          where: whereClause,
          include: {
            shiftPosting: {
              include: {
                site: true,
                client: {
                  include: {
                    user: {
                      select: { firstName: true, lastName: true, email: true, phone: true }
                    }
                  }
                }
              }
            },
            site: true,
            reports: {
              orderBy: { submittedAt: 'desc' }
            }
          },
          orderBy: { startTime: 'desc' },
          skip,
          take: limit
        }),
        prisma.shiftAssignment.count({ where: whereClause })
      ]);

      return {
        assignments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching guard assignments:', error);
      throw error;
    }
  }

  // Get client's shift assignments
  async getClientAssignments(clientId: string, page = 1, limit = 10, status?: string) {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = {
        shiftPosting: { clientId }
      };
      if (status) {
        whereClause.status = status;
      }

      const [assignments, total] = await Promise.all([
        prisma.shiftAssignment.findMany({
          where: whereClause,
          include: {
            shiftPosting: {
              include: {
                site: true
              }
            },
            guard: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true, phone: true }
                }
              }
            },
            site: true,
            reports: {
              orderBy: { submittedAt: 'desc' }
            }
          },
          orderBy: { startTime: 'desc' },
          skip,
          take: limit
        }),
        prisma.shiftAssignment.count({ where: whereClause })
      ]);

      return {
        assignments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching client assignments:', error);
      throw error;
    }
  }

  // Check in to a shift
  async checkIn(assignmentId: string, guardId: string, data: CheckInData) {
    try {
      const assignment = await prisma.shiftAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          shiftPosting: {
            include: {
              site: true,
              client: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true, email: true }
                  }
                }
              }
            }
          },
          guard: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true }
              }
            }
          }
        }
      });

      if (!assignment) {
        throw new NotFoundError('Assignment not found');
      }

      if (assignment.guardId !== guardId) {
        throw new UnauthorizedError('Access denied');
      }

      if (assignment.status !== 'ASSIGNED') {
        throw new ValidationError('Cannot check in to this assignment');
      }

      if (assignment.checkInTime) {
        throw new ValidationError('Already checked in to this assignment');
      }

      // Check if it's within reasonable time of shift start (e.g., 30 minutes early to 2 hours late)
      const now = new Date();
      const shiftStart = new Date(assignment.startTime);
      const thirtyMinutesEarly = new Date(shiftStart.getTime() - 30 * 60 * 1000);
      const twoHoursLate = new Date(shiftStart.getTime() + 2 * 60 * 60 * 1000);

      if (now < thirtyMinutesEarly) {
        throw new ValidationError('Cannot check in more than 30 minutes early');
      }

      if (now > twoHoursLate) {
        throw new ValidationError('Cannot check in more than 2 hours late');
      }

      const updatedAssignment = await prisma.shiftAssignment.update({
        where: { id: assignmentId },
        data: {
          status: 'IN_PROGRESS',
          checkInTime: now,
          checkInLatitude: data.latitude,
          checkInLongitude: data.longitude,
          notes: data.notes,
        },
        include: {
          shiftPosting: {
            include: {
              site: true,
              client: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true, email: true }
                  }
                }
              }
            }
          },
          guard: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true }
              }
            }
          }
        }
      });

      logger.info(`Guard checked in: ${guardId} for assignment ${assignmentId}`);
      return updatedAssignment;
    } catch (error) {
      logger.error('Error checking in:', error);
      throw error;
    }
  }

  // Check out from a shift
  async checkOut(assignmentId: string, guardId: string, data: CheckOutData) {
    try {
      const assignment = await prisma.shiftAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          shiftPosting: {
            include: {
              site: true,
              client: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true, email: true }
                  }
                }
              }
            }
          },
          guard: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true }
              }
            }
          }
        }
      });

      if (!assignment) {
        throw new NotFoundError('Assignment not found');
      }

      if (assignment.guardId !== guardId) {
        throw new UnauthorizedError('Access denied');
      }

      if (assignment.status !== 'IN_PROGRESS') {
        throw new ValidationError('Cannot check out from this assignment');
      }

      if (!assignment.checkInTime) {
        throw new ValidationError('Must check in before checking out');
      }

      if (assignment.checkOutTime) {
        throw new ValidationError('Already checked out from this assignment');
      }

      const now = new Date();
      const updatedAssignment = await prisma.shiftAssignment.update({
        where: { id: assignmentId },
        data: {
          status: 'COMPLETED',
          checkOutTime: now,
          checkOutLatitude: data.latitude,
          checkOutLongitude: data.longitude,
          notes: assignment.notes ? `${assignment.notes}\n\nCheck-out: ${data.notes || ''}` : data.notes,
        },
        include: {
          shiftPosting: {
            include: {
              site: true,
              client: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true, email: true }
                  }
                }
              }
            }
          },
          guard: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true }
              }
            }
          }
        }
      });

      logger.info(`Guard checked out: ${guardId} from assignment ${assignmentId}`);
      return updatedAssignment;
    } catch (error) {
      logger.error('Error checking out:', error);
      throw error;
    }
  }

  // Create assignment report
  async createAssignmentReport(assignmentId: string, guardId: string, data: CreateReportData) {
    try {
      // Verify assignment belongs to guard
      const assignment = await prisma.shiftAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          shiftPosting: {
            include: { site: true }
          }
        }
      });

      if (!assignment) {
        throw new NotFoundError('Assignment not found');
      }

      if (assignment.guardId !== guardId) {
        throw new UnauthorizedError('Access denied');
      }

      if (assignment.status === 'ASSIGNED') {
        throw new ValidationError('Cannot create reports before checking in');
      }

      const report = await prisma.assignmentReport.create({
        data: {
          shiftAssignmentId: assignmentId,
          guardId,
          type: data.type,
          title: data.title,
          description: data.description,
        },
        include: {
          shiftAssignment: {
            include: {
              shiftPosting: {
                include: {
                  site: true,
                  client: {
                    include: {
                      user: {
                        select: { firstName: true, lastName: true, email: true }
                      }
                    }
                  }
                }
              }
            }
          },
          guard: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true }
              }
            }
          }
        }
      });

      logger.info(`Assignment report created: ${report.id} for assignment ${assignmentId}`);
      return report;
    } catch (error) {
      logger.error('Error creating assignment report:', error);
      throw error;
    }
  }

  // Get assignment reports for client
  async getAssignmentReports(clientId: string, page = 1, limit = 10, type?: string) {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = {
        shiftAssignment: {
          shiftPosting: { clientId }
        }
      };
      if (type) {
        whereClause.type = type;
      }

      const [reports, total] = await Promise.all([
        prisma.assignmentReport.findMany({
          where: whereClause,
          include: {
            shiftAssignment: {
              include: {
                shiftPosting: {
                  include: { site: true }
                }
              }
            },
            guard: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true }
                }
              }
            }
          },
          orderBy: { submittedAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.assignmentReport.count({ where: whereClause })
      ]);

      return {
        reports,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching assignment reports:', error);
      throw error;
    }
  }

  // Get assignment by ID
  async getAssignmentById(assignmentId: string, userId: string, userRole: string) {
    try {
      const assignment = await prisma.shiftAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          shiftPosting: {
            include: {
              site: true,
              client: {
                include: {
                  user: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                  }
                }
              }
            }
          },
          guard: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, email: true }
              }
            }
          },
          reports: {
            orderBy: { submittedAt: 'desc' }
          }
        }
      });

      if (!assignment) {
        throw new NotFoundError('Assignment not found');
      }

      // Authorization check
      const isGuard = assignment.guard.user.id === userId;
      const isClient = assignment.shiftPosting.client.user.id === userId;
      const isAdmin = userRole === 'ADMIN';

      if (!isGuard && !isClient && !isAdmin) {
        throw new UnauthorizedError('Access denied');
      }

      return assignment;
    } catch (error) {
      logger.error('Error fetching assignment:', error);
      throw error;
    }
  }

  // Mark assignment as missed (automated or manual)
  async markAsMissed(assignmentId: string) {
    try {
      const assignment = await prisma.shiftAssignment.findUnique({
        where: { id: assignmentId }
      });

      if (!assignment) {
        throw new NotFoundError('Assignment not found');
      }

      if (assignment.status !== 'ASSIGNED') {
        throw new ValidationError('Assignment cannot be marked as missed');
      }

      const updatedAssignment = await prisma.shiftAssignment.update({
        where: { id: assignmentId },
        data: { status: 'MISSED' },
        include: {
          shiftPosting: {
            include: {
              site: true,
              client: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true, email: true }
                  }
                }
              }
            }
          },
          guard: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true }
              }
            }
          }
        }
      });

      logger.info(`Assignment marked as missed: ${assignmentId}`);
      return updatedAssignment;
    } catch (error) {
      logger.error('Error marking assignment as missed:', error);
      throw error;
    }
  }
}

export default new ShiftAssignmentService();
