import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import routes from './routes/index';
import v1Routes from './routes/v1/index.js';
import uploadRoutes from './routes/uploads.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import { apiRateLimiter } from './middleware/rateLimit.js';
import { handleStripeWebhook } from './controllers/paymentController.js';
import { initSentry } from './config/sentry.js';

dotenv.config();
void initSentry();

const parseCorsOrigins = (): string | string[] | boolean => {
  const configured = process.env.CORS_ORIGIN?.trim();
  if (!configured) {
    return process.env.NODE_ENV === 'production' ? false : '*';
  }
  if (configured === '*') {
    return process.env.NODE_ENV === 'production' ? false : '*';
  }
  if (configured.includes(',')) {
    return configured.split(',').map((origin) => origin.trim()).filter(Boolean);
  }
  return configured;
};

const app = express();

app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS — restrict origins in production; allow all in local development only
app.use(cors({
  origin: parseCorsOrigins(),
  credentials: true,
}));

// Stripe webhook requires raw body for signature verification (before JSON parser)
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Swagger configuration
const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Guard Tracking API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the Guard Tracking System',
      contact: {
        name: 'API Support',
        email: 'support@guardtracking.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.guardtracking.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique user identifier',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            firstName: {
              type: 'string',
              description: 'User first name',
            },
            lastName: {
              type: 'string',
              description: 'User last name',
            },
            phone: {
              type: 'string',
              description: 'User phone number',
            },
            role: {
              type: 'string',
              enum: ['GUARD', 'ADMIN', 'CLIENT'],
              description: 'User role in the system',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the user account is active',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'JWT access token',
                },
                refreshToken: {
                  type: 'string',
                  description: 'JWT refresh token',
                },
                user: {
                  $ref: '#/components/schemas/User',
                },
                expiresIn: {
                  type: 'number',
                  description: 'Token expiration time in seconds',
                },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Error message',
                },
                code: {
                  type: 'string',
                  description: 'Error code',
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Guards',
        description: 'Guard-specific endpoints',
      },
      {
        name: 'Shifts',
        description: 'Shift management endpoints',
      },
      {
        name: 'Reports',
        description: 'Report management endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

const swaggerEnabled =
  process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true';

const swaggerBasicAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = process.env.SWAGGER_USER;
  const pass = process.env.SWAGGER_PASS;
  if (!user || !pass) {
    return next();
  }
  const header = req.headers.authorization;
  if (!header?.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="API Docs"');
    return res.status(401).send('Authentication required');
  }
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const [username, password] = decoded.split(':');
  if (username === user && password === pass) {
    return next();
  }
  res.setHeader('WWW-Authenticate', 'Basic realm="API Docs"');
  return res.status(401).send('Invalid credentials');
};

if (swaggerEnabled) {
  app.use('/api-docs', swaggerBasicAuth, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Guard Tracking API Docs',
  }));

  app.get('/api-docs.json', swaggerBasicAuth, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

// Legacy public uploads (disable in production unless explicitly enabled)
if (process.env.LEGACY_PUBLIC_UPLOADS === 'true') {
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
}

// Global API rate limiting
app.use('/api', apiRateLimiter);

// Authenticated upload routes (profile pictures)
app.use('/api/uploads', uploadRoutes);

// API routes (versioned + legacy alias)
app.use('/api/v1', v1Routes);
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
