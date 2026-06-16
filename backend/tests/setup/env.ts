import dotenv from 'dotenv';

dotenv.config();

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'integration-test-jwt-secret-min-32-chars!!';
process.env.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX || '10000';
process.env.AUTH_RATE_LIMIT_MAX = process.env.AUTH_RATE_LIMIT_MAX || '1000';
