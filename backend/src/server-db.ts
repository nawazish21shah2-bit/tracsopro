import app from './app.js';
import { createServer } from 'http';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';
import websocketService from './services/websocketService.js';
import notificationService from './services/notificationService.js';
import { isFirebaseAdminInitialized, initializeFirebaseAdmin } from './config/firebase.js';
import ChatService from './services/chatService.js';

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

    // Start live location broadcast
    websocketService.startLiveLocationBroadcast();

    // Retry failed emergency push notifications
    notificationService.startPushRetryProcessor();

    // Purge dead FCM tokens and cap active tokens per user
    notificationService.startDeviceTokenCleanupProcessor();

    // Start server - listen on all interfaces (0.0.0.0) for network access
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on http://0.0.0.0:${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API: http://localhost:${PORT}/api (or use your local IP)`);
      logger.info(`❤️  Health: http://localhost:${PORT}/api/health`);
      logger.info(`🌐 WebSocket: ws://localhost:${PORT} (or use your local IP)`);
      logger.info(`📱 For physical devices, use: http://YOUR_LOCAL_IP:${PORT}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
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
