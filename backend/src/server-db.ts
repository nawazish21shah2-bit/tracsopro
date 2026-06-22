import app from './app.js';
import { createServer } from 'http';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';
import websocketService from './services/websocketService.js';
import notificationService from './services/notificationService.js';
import { isFirebaseAdminInitialized, initializeFirebaseAdmin } from './config/firebase.js';
import ChatService from './services/chatService.js';
import { tryAcquireJobLeaderLock, releaseJobLeaderLock } from './utils/jobLeader.js';
import { closeCache } from './utils/cache.js';
import { closeRedisClients } from './config/redis.js';
import { closePushRetryQueue } from './jobs/pushRetryQueue.js';
import { startPushRetryWorker, stopPushRetryWorker } from './jobs/pushRetryWorker.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Initialize Firebase Admin for push notifications
    initializeFirebaseAdmin();
    if (isFirebaseAdminInitialized()) {
      logger.info('Firebase Admin ready — push notifications enabled');
    } else {
      logger.warn(
        'Firebase Admin NOT configured — push notifications disabled. ' +
          'Add backend/keys/firebase-service-account.json and set FIREBASE_SERVICE_ACCOUNT_PATH in .env'
      );
    }

    // Backfill conversation records from legacy message threads
    await ChatService.getInstance().initializeConversations();

    // Create HTTP server
    const server = createServer(app);

    // Initialize WebSocket service
    websocketService.initialize(server);
    await websocketService.attachRedisAdapter();

    const isJobLeader = await tryAcquireJobLeaderLock();
    if (isJobLeader) {
      logger.info('This instance is the background job leader');
      websocketService.startLiveLocationBroadcast();
      notificationService.startPushRetryProcessor();
      notificationService.startDeviceTokenCleanupProcessor();
      await startPushRetryWorker();
    } else {
      logger.info('Background jobs skipped — another instance holds leader lock');
    }

    // Start server - listen on all interfaces (0.0.0.0) for network access
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on http://0.0.0.0:${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API: http://localhost:${PORT}/api (or use your local IP)`);
      logger.info(`❤️  Health: http://localhost:${PORT}/api/health`);
      logger.info(`🌐 WebSocket: ws://localhost:${PORT} (or use your local IP)`);
      logger.info(`📱 For physical devices, use: http://YOUR_LOCAL_IP:${PORT}`);
      if (process.env.REDIS_URL) {
        logger.info('Redis enabled — OTP limits, BullMQ push retries, Socket.IO adapter');
      }
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        await stopPushRetryWorker();
        await closePushRetryQueue();
        await releaseJobLeaderLock();
        await closeCache();
        await closeRedisClients();
        await disconnectDatabase();
        
        logger.info('Graceful shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
