import { logger } from '../utils/logger.js';
import { getRedisConnection } from '../config/redis.js';
import { PUSH_RETRY_QUEUE_NAME, type PushRetryJobPayload } from './pushRetryQueue.js';
import notificationService from '../services/notificationService.js';

type WorkerCloser = () => Promise<void>;

let workerCloser: WorkerCloser | null = null;

/**
 * Process push retries from BullMQ when REDIS_URL is configured.
 * Returns a shutdown function, or null when Redis/BullMQ is unavailable.
 */
export async function startPushRetryWorker(): Promise<WorkerCloser | null> {
  const connection = getRedisConnection();
  if (!connection) {
    return null;
  }
  if (workerCloser) {
    return workerCloser;
  }

  try {
    const { Worker } = await import('bullmq');
    const worker = new Worker(
      PUSH_RETRY_QUEUE_NAME,
      async (job) => {
        const payload = job.data as PushRetryJobPayload;
        const result = await notificationService.retryPushDelivery(payload.userId, {
          title: payload.title,
          body: payload.body,
          type: payload.type,
          data: payload.data,
          priority: payload.priority,
        });

        if (result === 'failed') {
          throw new Error(`Push delivery failed for user ${payload.userId}`);
        }
      },
      { connection, concurrency: 5 },
    );

    worker.on('failed', (job, error) => {
      logger.warn('Push retry job failed', {
        jobId: job?.id,
        userId: (job?.data as PushRetryJobPayload | undefined)?.userId,
        error: error.message,
      });
    });

    worker.on('completed', (job) => {
      logger.debug('Push retry job completed', { jobId: job.id });
    });

    workerCloser = async () => {
      await worker.close();
      workerCloser = null;
    };

    logger.info('BullMQ push-retry worker started');
    return workerCloser;
  } catch (error) {
    logger.warn('BullMQ push-retry worker unavailable', { error });
    return null;
  }
}

export async function stopPushRetryWorker(): Promise<void> {
  if (workerCloser) {
    await workerCloser();
  }
}

/** Standalone worker entry: `tsx src/jobs/pushRetryWorker.ts` */
async function runStandaloneWorker(): Promise<void> {
  const { connectDatabase, disconnectDatabase } = await import('../config/database.js');
  const { initializeFirebaseAdmin } = await import('../config/firebase.js');

  await connectDatabase();
  initializeFirebaseAdmin();

  const closer = await startPushRetryWorker();
  if (!closer) {
    logger.error('Cannot start push-retry worker — set REDIS_URL and install bullmq/ioredis');
    process.exit(1);
  }

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — stopping push-retry worker`);
    await closer();
    const { closePushRetryQueue } = await import('./pushRetryQueue.js');
    await closePushRetryQueue();
    const { closeRedisClients } = await import('../config/redis.js');
    await closeRedisClients();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  logger.info('Push-retry worker running (standalone mode)');
}

const isStandalone =
  process.argv[1]?.replace(/\\/g, '/').includes('pushRetryWorker');

if (isStandalone) {
  runStandaloneWorker().catch((error) => {
    logger.error('Push-retry worker crashed', { error });
    process.exit(1);
  });
}
