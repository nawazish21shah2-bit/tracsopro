/**
 * Optional Redis cache — falls back to in-memory when REDIS_URL is unset.
 */
type CacheEntry = { value: string; expiresAt: number };

const memory = new Map<string, CacheEntry>();

type RedisClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: string, duration: number): Promise<unknown>;
  del(key: string): Promise<unknown>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  quit(): Promise<string>;
};

let redisClient: RedisClient | null = null;
let redisInit: Promise<RedisClient | null> | null = null;

async function getRedis(): Promise<RedisClient | null> {
  if (!process.env.REDIS_URL) return null;
  if (redisClient) return redisClient;
  if (redisInit) return redisInit;

  redisInit = (async () => {
    try {
      const ioredis = await import('ioredis');
      const Redis = ioredis.default ?? ioredis;
      const client = new Redis(process.env.REDIS_URL!) as RedisClient;
      redisClient = client;
      return client;
    } catch {
      return null;
    }
  })();

  return redisInit;
}

export async function cacheGet(key: string): Promise<string | null> {
  const redis = await getRedis();
  if (redis) {
    try {
      return await redis.get(key);
    } catch {
      /* fall through to memory */
    }
  }

  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    try {
      await redis.set(key, value, 'EX', ttlSeconds);
      return;
    } catch {
      /* fall through to memory */
    }
  }

  memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cacheDel(key: string): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    try {
      await redis.del(key);
    } catch {
      /* ignore */
    }
  }
  memory.delete(key);
}

export async function cacheIncr(key: string, ttlSeconds: number): Promise<number> {
  const redis = await getRedis();
  if (redis) {
    try {
      const next = await redis.incr(key);
      if (next === 1) {
        await redis.expire(key, ttlSeconds);
      }
      return next;
    } catch {
      /* fall through to memory */
    }
  }

  const current = await cacheGet(key);
  const next = (current ? parseInt(current, 10) : 0) + 1;
  await cacheSet(key, String(next), ttlSeconds);
  return next;
}

/** Reset in-memory cache (tests). */
export function resetMemoryCache(): void {
  memory.clear();
}

/** Close Redis connection (graceful shutdown). */
export async function closeCache(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    redisInit = null;
  }
}
