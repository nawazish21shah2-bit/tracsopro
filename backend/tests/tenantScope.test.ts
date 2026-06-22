import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReporterCompanyFilter,
  resolveTenantCompanyId,
} from '../src/utils/tenantScope.js';
import type { AuthRequest } from '../src/middleware/auth.js';

function mockReq(partial: Partial<AuthRequest>): AuthRequest {
  return partial as AuthRequest;
}

describe('tenantScope', () => {
  it('buildReporterCompanyFilter scopes by company relations', () => {
    const filter = buildReporterCompanyFilter('company-1');
    assert.ok(Array.isArray(filter.OR));
    assert.equal(filter.OR.length, 3);
  });

  it('resolveTenantCompanyId requires company for scoped super admin', () => {
    const result = resolveTenantCompanyId(
      mockReq({ user: { id: '1', role: 'SUPER_ADMIN', isActive: true } })
    );
    assert.equal(result.status, 400);
  });

  it('resolveTenantCompanyId allows unscoped super admin when configured', () => {
    const result = resolveTenantCompanyId(
      mockReq({ user: { id: '1', role: 'SUPER_ADMIN', isActive: true } }),
      { allowSuperAdminUnscoped: true }
    );
    assert.equal(result.securityCompanyId, undefined);
    assert.equal(result.error, undefined);
  });

  it('resolveTenantCompanyId uses query param for super admin', () => {
    const result = resolveTenantCompanyId(
      mockReq({
        user: { id: '1', role: 'SUPER_ADMIN', isActive: true },
        query: { securityCompanyId: 'co-123' },
      })
    );
    assert.equal(result.securityCompanyId, 'co-123');
  });

  it('resolveTenantCompanyId delegates to company auth for admin', () => {
    const result = resolveTenantCompanyId(
      mockReq({
        user: { id: '1', role: 'ADMIN', isActive: true },
        securityCompanyId: 'admin-co',
      })
    );
    assert.equal(result.securityCompanyId, 'admin-co');
  });
});
