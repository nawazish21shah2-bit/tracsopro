import { AuthRequest } from '../middleware/auth.js';
import { resolveSecurityCompanyId } from './companyAuth.js';

/** Prisma filter: incidents whose reporter belongs to the given security company. */
export const buildReporterCompanyFilter = (securityCompanyId: string) => ({
  OR: [
    {
      reporter: {
        guard: {
          companyGuards: { some: { securityCompanyId, isActive: true } },
        },
      },
    },
    {
      reporter: {
        client: {
          companyClients: { some: { securityCompanyId, isActive: true } },
        },
      },
    },
    {
      reporter: {
        companyUsers: { some: { securityCompanyId, isActive: true } },
      },
    },
  ],
});

export interface TenantCompanyResult {
  securityCompanyId?: string;
  error?: string;
  status?: number;
}

/**
 * Resolve tenant company for admin routes. SUPER_ADMIN may pass ?securityCompanyId=.
 * When allowSuperAdminUnscoped is true, SUPER_ADMIN may query without a company filter.
 */
export const resolveTenantCompanyId = (
  req: AuthRequest,
  options?: { allowSuperAdminUnscoped?: boolean }
): TenantCompanyResult => {
  if (req.user?.role === 'SUPER_ADMIN') {
    const fromQuery = req.query.securityCompanyId as string | undefined;
    if (fromQuery) {
      return { securityCompanyId: fromQuery };
    }
    if (options?.allowSuperAdminUnscoped) {
      return {};
    }
    return {
      error: 'Security company ID is required (query param: securityCompanyId).',
      status: 400,
    };
  }

  return resolveSecurityCompanyId(req);
};
