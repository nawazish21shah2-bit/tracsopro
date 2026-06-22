import { logger } from '../utils/logger.js';

export type RedisConnectionOptions = {
  url: string;
  maxRetriesPerRequest: null;
};

let pubClient: { duplicate(): unknown; quit(): Promise<string> } | null = null;
let pubInit: Promise<typeof pubClient> | null = null;

/** BullMQ / Socket.IO connection options from REDIS_URL. */
export function getRedisConnection(): RedisConnectionOptions | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;
  return { url, maxRetriesPerRequest: null };
}

/** Shared Redis client for pub/sub (Socket.IO adapter). */
export async function getRedisPubClient(): Promise<typeof pubClient> {
  const conn = getRedisConnection();
  if (!conn) return null;
  if (pubClient) return pubClient;
  if (pubInit) return pubInit;

  pubInit = (async () => {
    try {
      const { default: Redis } = await import('ioredis');
      const client = new Redis(conn.url, { maxRetriesPerRequest: null });
      client.on('error', (err: Error) => {
        logger.warn('Redis client error', { message: err.message });
      });
      pubClient = client;
      return pubClient;
    } catch (error) {
      logger.warn('Redis unavailable — install ioredis and set REDIS_URL', { error });
      return null;
    }
  })();

  return pubInit;
}

export async function closeRedisClients(): Promise<void> {
  if (pubClient) {
    try {
      await pubClient.quit();
    } catch {
      /* ignore */
    }
    pubClient = null;
    pubInit = null;
  }
}
