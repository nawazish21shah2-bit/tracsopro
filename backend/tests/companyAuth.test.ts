import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSecurityCompanyId } from '../src/utils/companyAuth.js';
import type { AuthRequest } from '../src/middleware/auth.js';

function mockReq(partial: Partial<AuthRequest>): AuthRequest {
  return partial as AuthRequest;
}

describe('resolveSecurityCompanyId', () => {
  it('requires company id for SUPER_ADMIN without override', () => {
    const result = resolveSecurityCompanyId(
      mockReq({ user: { id: '1', role: 'SUPER_ADMIN', isActive: true } })
    );
    assert.equal(result.status, 400);
    assert.ok(result.error);
  });

  it('uses override company id for SUPER_ADMIN', () => {
    const companyId = 'company-uuid';
    const result = resolveSecurityCompanyId(
      mockReq({ user: { id: '1', role: 'SUPER_ADMIN', isActive: true } }),
      companyId
    );
    assert.equal(result.securityCompanyId, companyId);
  });

  it('returns 403 when admin has no company link', () => {
    const result = resolveSecurityCompanyId(
      mockReq({ user: { id: '1', role: 'ADMIN', isActive: true } })
    );
    assert.equal(result.status, 403);
  });

  it('returns admin company id from request', () => {
    const companyId = 'admin-company';
    const result = resolveSecurityCompanyId(
      mockReq({
        user: { id: '1', role: 'ADMIN', isActive: true },
        securityCompanyId: companyId,
      })
    );
    assert.equal(result.securityCompanyId, companyId);
  });
});
