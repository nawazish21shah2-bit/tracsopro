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

describe('Chat API flow', () => {
  const runId = `chat-${Date.now()}`;
  let tenant: TenantFixture;
  let chatId: string | undefined;

  before(async () => {
    tenant = await createTenantFixture('chat', runId);
  });

  after(async () => {
    if (chatId) {
      await prisma.message.deleteMany({ where: { conversationId: chatId } }).catch(() => {});
      await prisma.conversationParticipant.deleteMany({ where: { conversationId: chatId } }).catch(() => {});
      await prisma.conversation.deleteMany({ where: { id: chatId } }).catch(() => {});
    }
    await destroyFixturesByRunId(runId);
  });

  it('guard lists chats (empty initially)', async () => {
    const res = await request(app)
      .get('/api/chat')
      .set(auth(tenant.guard.token));

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  it('rejects chat search without query', async () => {
    const res = await request(app)
      .get('/api/chat/search')
      .set(auth(tenant.guard.token));

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it('guard creates direct chat with admin and sends a message', async () => {
    const create = await request(app)
      .post('/api/chat')
      .set(auth(tenant.guard.token))
      .send({
        type: 'direct',
        participantIds: [tenant.admin.userId],
      });

    assert.equal(create.status, 201);
    assert.equal(create.body.success, true);
    chatId = create.body.data.id;

    const send = await request(app)
      .post(`/api/chat/${chatId}/messages`)
      .set(auth(tenant.guard.token))
      .send({ content: 'Hello from chat integration test' });

    assert.equal(send.status, 201);
    assert.equal(send.body.success, true);

    const messages = await request(app)
      .get(`/api/chat/${chatId}/messages`)
      .set(auth(tenant.guard.token));

    assert.equal(messages.status, 200);
    assert.equal(messages.body.success, true);
    assert.ok(messages.body.data.length >= 1);

    const search = await request(app)
      .get('/api/chat/search?q=integration')
      .set(auth(tenant.guard.token));

    assert.equal(search.status, 200);
    assert.equal(search.body.success, true);
  });
});
