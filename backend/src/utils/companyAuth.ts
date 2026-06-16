import { AuthRequest } from '../middleware/auth.js';

export interface ResolveCompanyIdResult {
  securityCompanyId?: string;
  error?: string;
  status?: number;
}

export const resolveSecurityCompanyId = (
  req: AuthRequest,
  overrideCompanyId?: string,
  superAdminMissingMessage = 'Security company ID is required in request body for SUPER_ADMIN.'
): ResolveCompanyIdResult => {
  if (req.user?.role === 'SUPER_ADMIN') {
    if (!overrideCompanyId) {
      return {
        error: superAdminMissingMessage,
        status: 400,
      };
    }

    return {
      securityCompanyId: overrideCompanyId,
    };
  }

  if (!req.securityCompanyId) {
    return {
      error: 'Security company ID not found. Admin must be linked to a company.',
      status: 403,
    };
  }

  return {
    securityCompanyId: req.securityCompanyId,
  };
};
