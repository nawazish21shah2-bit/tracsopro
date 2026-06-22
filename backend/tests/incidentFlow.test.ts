import './setup/env.js';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/database.js';
import {
  createTenantFixture,
  destroyFixturesByRunId,
  type TenantFixture,
} from './helpers/tenantFixtures.js';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('Incident flow', () => {
  const runId = `incident-${Date.now()}`;
  let tenant: TenantFixture;
  let incidentId: string;
  let locationId: string;

  before(async () => {
    tenant = await createTenantFixture('incident', runId);
  });

  after(async () => {
    if (incidentId) {
      await prisma.evidence.deleteMany({ where: { incidentId } }).catch(() => {});
      await prisma.incident.deleteMany({ where: { id: incidentId } }).catch(() => {});
    }
    if (locationId) {
      await prisma.location.deleteMany({ where: { id: locationId } }).catch(() => {});
    }
    await destroyFixturesByRunId(runId);
  });

  it('guard creates an incident with inline location', async () => {
    const res = await request(app)
      .post('/api/incidents')
      .set(auth(tenant.guard.token))
      .send({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'MEDIUM',
        title: 'Suspicious vehicle',
        description: 'Unmarked van parked near loading dock',
        location: {
          latitude: 40.7128,
          longitude: -74.006,
          address: 'Loading dock',
        },
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    incidentId = res.body.data.id;
    locationId = res.body.data.locationId;
    assert.ok(incidentId);
  });

  it('guard can read own incident', async () => {
    const res = await request(app)
      .get(`/api/incidents/${incidentId}`)
      .set(auth(tenant.guard.token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.id, incidentId);
  });

  it('admin lists and updates company incident', async () => {
    const list = await request(app)
      .get('/api/incidents?limit=50')
      .set(auth(tenant.admin.token));

    assert.equal(list.status, 200);
    const items = list.body.data?.items || [];
    assert.ok(items.some((i: { id: string }) => i.id === incidentId));

    const stats = await request(app)
      .get('/api/incidents/stats')
      .set(auth(tenant.admin.token));

    assert.equal(stats.status, 200);
    assert.ok(stats.body.data.total >= 1);

    const update = await request(app)
      .put(`/api/incidents/${incidentId}`)
      .set(auth(tenant.admin.token))
      .send({ status: 'INVESTIGATING', severity: 'HIGH' });

    assert.equal(update.status, 200);
    assert.equal(update.body.data.status, 'INVESTIGATING');
  });

  it('guard can attach evidence to own incident', async () => {
    const res = await request(app)
      .post(`/api/incidents/${incidentId}/evidence`)
      .set(auth(tenant.guard.token))
      .send({
        type: 'PHOTO',
        url: 'https://example.com/photo.jpg',
        description: 'Photo of vehicle',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.incidentId, incidentId);
  });
});
