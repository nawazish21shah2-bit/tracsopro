import './setup/env.js';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/config/database.js';
import shiftConflictService from '../src/services/shiftConflictService.js';
import {
  createTenantFixture,
  destroyFixturesByRunId,
  type TenantFixture,
} from './helpers/tenantFixtures.js';

describe('shiftConflictService', () => {
  it('hasBlockingConflicts returns true only for error severity', () => {
    assert.equal(
      shiftConflictService.hasBlockingConflicts([
        { type: 'OVERTIME', severity: 'warning', message: 'overtime' },
      ]),
      false
    );
    assert.equal(
      shiftConflictService.hasBlockingConflicts([
        { type: 'OVERLAP', severity: 'error', message: 'overlap' },
      ]),
      true
    );
  });

  it('returns no conflicts when guardId is omitted', async () => {
    const conflicts = await shiftConflictService.detectConflicts({
      scheduledStartTime: new Date(),
      scheduledEndTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    });
    assert.equal(conflicts.length, 0);
  });

  describe('with database fixtures', () => {
    const runId = `conflict-${Date.now()}`;
    let tenant: TenantFixture;
    let existingShiftId: string;

    before(async () => {
      tenant = await createTenantFixture('conflict', runId);

      const start = new Date();
      start.setHours(9, 0, 0, 0);
      const end = new Date(start);
      end.setHours(17, 0, 0, 0);

      const shift = await prisma.shift.create({
        data: {
          guardId: tenant.guard.guardId,
          siteId: tenant.siteId,
          clientId: tenant.client.clientId,
          locationName: 'Morning shift',
          locationAddress: 'Main',
          scheduledStartTime: start,
          scheduledEndTime: end,
          status: 'SCHEDULED',
        },
      });
      existingShiftId = shift.id;
    });

    after(async () => {
      await prisma.shift.deleteMany({ where: { guardId: tenant.guard.guardId } });
      await destroyFixturesByRunId(runId);
    });

    it('detects overlapping shifts for the same guard', async () => {
      const start = new Date();
      start.setHours(14, 0, 0, 0);
      const end = new Date(start);
      end.setHours(22, 0, 0, 0);

      const conflicts = await shiftConflictService.detectConflicts({
        guardId: tenant.guard.guardId,
        siteId: tenant.siteId,
        scheduledStartTime: start,
        scheduledEndTime: end,
      });

      const overlap = conflicts.find((c) => c.type === 'OVERLAP');
      assert.ok(overlap);
      assert.equal(overlap?.severity, 'error');
      assert.equal(overlap?.conflictingShiftId, existingShiftId);
    });

    it('detects insufficient rest before the next shift', async () => {
      const prevEnd = new Date();
      prevEnd.setHours(16, 0, 0, 0);
      const prevStart = new Date(prevEnd);
      prevStart.setHours(8, 0, 0, 0);

      await prisma.shift.create({
        data: {
          guardId: tenant.guard.guardId,
          siteId: tenant.siteId,
          clientId: tenant.client.clientId,
          locationName: 'Earlier shift',
          locationAddress: 'Main',
          scheduledStartTime: prevStart,
          scheduledEndTime: prevEnd,
          status: 'SCHEDULED',
        },
      });

      const nextStart = new Date(prevEnd);
      nextStart.setHours(20, 0, 0, 0);
      const nextEnd = new Date(nextStart);
      nextEnd.setHours(23, 0, 0, 0);

      const conflicts = await shiftConflictService.detectConflicts({
        guardId: tenant.guard.guardId,
        siteId: tenant.siteId,
        scheduledStartTime: nextStart,
        scheduledEndTime: nextEnd,
        excludeShiftId: existingShiftId,
      });

      const rest = conflicts.find((c) => c.type === 'REST_PERIOD');
      assert.ok(rest);
      assert.equal(rest?.severity, 'warning');
    });
  });
});
