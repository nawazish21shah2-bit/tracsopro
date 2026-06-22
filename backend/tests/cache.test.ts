import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  cacheGet,
  cacheSet,
  cacheDel,
  cacheIncr,
  resetMemoryCache,
} from '../src/utils/cache.js';

describe('cache (in-memory fallback)', () => {
  beforeEach(() => {
    resetMemoryCache();
    delete process.env.REDIS_URL;
  });

  it('cacheSet and cacheGet round-trip a value', async () => {
    await cacheSet('test-key', 'hello', 60);
    assert.equal(await cacheGet('test-key'), 'hello');
  });

  it('cacheDel removes a key', async () => {
    await cacheSet('del-key', 'x', 60);
    await cacheDel('del-key');
    assert.equal(await cacheGet('del-key'), null);
  });

  it('cacheIncr increments from zero', async () => {
    assert.equal(await cacheIncr('counter', 60), 1);
    assert.equal(await cacheIncr('counter', 60), 2);
    assert.equal(await cacheGet('counter'), '2');
  });

  it('expires in-memory entries after ttl', async () => {
    await cacheSet('ttl-key', 'temp', 1);
    assert.equal(await cacheGet('ttl-key'), 'temp');
    await new Promise((r) => setTimeout(r, 1100));
    assert.equal(await cacheGet('ttl-key'), null);
  });
});
