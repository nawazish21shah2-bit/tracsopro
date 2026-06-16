import './setup/env.js';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import {
  createTenantFixture,
  destroyFixturesByRunId,
  type TenantFixture,
} from './helpers/tenantFixtures.js';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('Cross-tenant authorization', () => {
  const runId = `run-${Date.now()}`;
  let tenantA: TenantFixture;
  let tenantB: TenantFixture;

  before(async () => {
    tenantA = await createTenantFixture('tenant-a', runId);
    tenantB = await createTenantFixture('tenant-b', runId);
  });

  after(async () => {
    await destroyFixturesByRunId(runId);
  });

  it('blocks admin from reading another company site by id', async () => {
    const res = await request(app)
      .get(`/api/sites/${tenantB.siteId}`)
      .set(auth(tenantA.admin.token));

    assert.equal(res.status, 401);
    assert.match(res.body.message, /access denied/i);
  });

  it('blocks admin from updating another company site', async () => {
    const res = await request(app)
      .put(`/api/admin/sites/${tenantB.siteId}`)
      .set(auth(tenantA.admin.token))
      .send({ name: 'Cross-tenant rename attempt' });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /does not belong to your company/i);
  });

  it('blocks admin from deleting another company user', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${tenantB.guard.userId}`)
      .set(auth(tenantA.admin.token));

    assert.equal(res.status, 404);
    assert.match(res.body.message, /not found or does not belong/i);
  });

  it('does not expose another company incident reports in admin list', async () => {
    const res = await request(app)
      .get('/api/incident-reports/admin/all?limit=100')
      .set(auth(tenantA.admin.token));

    assert.equal(res.status, 200);
    const reports = res.body.data?.reports || [];
    const foreignReport = reports.find((r: { id: string }) => r.id === tenantB.incidentReportId);
    assert.equal(foreignReport, undefined);
    const ownReport = reports.find((r: { id: string }) => r.id === tenantA.incidentReportId);
    assert.ok(ownReport, 'expected tenant A admin to see own company report');
  });

  it('blocks admin from reading another company incident by id', async () => {
    const res = await request(app)
      .get(`/api/incidents/${tenantB.incidentId}`)
      .set(auth(tenantA.admin.token));

    assert.equal(res.status, 403);
    assert.match(res.body.message, /access denied/i);
  });

  it('does not expose another company incidents in admin incident list', async () => {
    const res = await request(app)
      .get('/api/incidents?limit=100')
      .set(auth(tenantA.admin.token));

    assert.equal(res.status, 200);
    const incidents = res.body.data?.items || [];
    const foreignIncident = incidents.find((i: { id: string }) => i.id === tenantB.incidentId);
    assert.equal(foreignIncident, undefined);
  });

  it('scopes admin site list to own company', async () => {
    const res = await request(app)
      .get('/api/admin/sites?limit=100')
      .set(auth(tenantA.admin.token));

    assert.equal(res.status, 200);
    const sites = res.body.data?.sites || [];
    const foreignSite = sites.find((s: { id: string }) => s.id === tenantB.siteId);
    assert.equal(foreignSite, undefined);
    const ownSite = sites.find((s: { id: string }) => s.id === tenantA.siteId);
    assert.ok(ownSite, 'expected tenant A admin to see own company site');
  });
});
