import app from './app.js';
import { createServer } from 'http';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';
import websocketService from './services/websocketService.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Create HTTP server
    const server = createServer(app);

    // Initialize WebSocket service
    websocketService.initialize(server);

    // Start live location broadcast
    websocketService.startLiveLocationBroadcast();

    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API: http://localhost:${PORT}/api`);
      logger.info(`❤️  Health: http://localhost:${PORT}/api/health`);
      logger.info(`🌐 WebSocket: ws://localhost:${PORT}`);
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
