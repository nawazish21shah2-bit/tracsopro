import prisma from '../config/database.js';
import { logger } from './logger.js';

const LEADER_LOCK_KEY = 8675309;

/**
 * Attempt to acquire a Postgres advisory lock for background job leadership.
 */
export async function tryAcquireJobLeaderLock(): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<{ pg_try_advisory_lock: boolean }[]>`
      SELECT pg_try_advisory_lock(${LEADER_LOCK_KEY})
    `;
    return Boolean(result[0]?.pg_try_advisory_lock);
  } catch (error) {
    logger.warn('Job leader lock unavailable', { error });
    return true;
  }
}

export async function releaseJobLeaderLock(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT pg_advisory_unlock(${LEADER_LOCK_KEY})`;
  } catch {
    // ignore on shutdown
  }
}
