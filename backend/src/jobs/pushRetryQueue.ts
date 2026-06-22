import { logger } from '../utils/logger.js';
import { getRedisConnection } from '../config/redis.js';

export const PUSH_RETRY_QUEUE_NAME = 'push-retry';

export interface PushRetryJobPayload {
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: unknown;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

type BullQueue = {
  add(name: string, data: PushRetryJobPayload, opts?: Record<string, unknown>): Promise<unknown>;
  close(): Promise<void>;
};

let queueInstance: BullQueue | null = null;
let queueInit: Promise<BullQueue | null> | null = null;

async function getPushRetryQueue(): Promise<BullQueue | null> {
  const connection = getRedisConnection();
  if (!connection) return null;
  if (queueInstance) return queueInstance;
  if (queueInit) return queueInit;

  queueInit = (async () => {
    try {
      const { Queue } = await import('bullmq');
      queueInstance = new Queue(PUSH_RETRY_QUEUE_NAME, { connection }) as BullQueue;
      return queueInstance;
    } catch (error) {
      logger.warn('BullMQ queue unavailable — install bullmq for Redis push retries', { error });
      return null;
    }
  })();

  return queueInit;
}

export async function enqueuePushRetry(payload: PushRetryJobPayload): Promise<boolean> {
  const queue = await getPushRetryQueue();
  if (!queue) {
    return false;
  }

  try {
    await queue.add('retry', payload, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });
    logger.debug('Enqueued push retry job', { userId: payload.userId, type: payload.type });
    return true;
  } catch (error) {
    logger.warn('Failed to enqueue push retry job', { error, userId: payload.userId });
    return false;
  }
}

export async function closePushRetryQueue(): Promise<void> {
  if (queueInstance) {
    await queueInstance.close();
    queueInstance = null;
    queueInit = null;
  }
}
