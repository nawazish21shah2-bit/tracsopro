import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler.js';
import {
  AppError,
  ValidationError,
  NotFoundError,
} from '../src/utils/errors.js';
import type { Request, Response, NextFunction } from 'express';

function mockRes() {
  const res: Partial<Response> & { statusCode?: number; body?: unknown } = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res as Response;
  };
  res.json = (body: unknown) => {
    res.body = body;
    return res as Response;
  };
  return res as Response & { statusCode?: number; body?: Record<string, unknown> };
}

const noopNext: NextFunction = () => undefined;

describe('errorHandler', () => {
  it('handles ValidationError with field errors', () => {
    const res = mockRes();
    errorHandler(
      new ValidationError('Invalid input', { email: 'Invalid email' }),
      { path: '/test', method: 'POST' } as Request,
      res,
      noopNext
    );
    assert.equal(res.statusCode, 400);
    assert.equal((res.body as { message: string }).message, 'Invalid input');
    assert.deepEqual((res.body as { errors: Record<string, string> }).errors, {
      email: 'Invalid email',
    });
  });

  it('handles operational AppError', () => {
    const res = mockRes();
    errorHandler(
      new NotFoundError('Missing'),
      { path: '/x', method: 'GET' } as Request,
      res,
      noopNext
    );
    assert.equal(res.statusCode, 404);
    assert.equal((res.body as { message: string }).message, 'Missing');
  });

  it('handles generic errors as 500', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const res = mockRes();
    errorHandler(
      new Error('boom'),
      { path: '/x', method: 'GET' } as Request,
      res,
      noopNext
    );
    assert.equal(res.statusCode, 500);
    assert.equal((res.body as { message: string }).message, 'boom');
    process.env.NODE_ENV = prev;
  });

  it('masks unexpected errors in production', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const res = mockRes();
    errorHandler(
      new Error('database secret'),
      { path: '/x', method: 'GET' } as Request,
      res,
      noopNext
    );
    assert.equal(res.statusCode, 500);
    assert.equal((res.body as { message: string }).message, 'Internal server error');
    process.env.NODE_ENV = prev;
  });
});

describe('notFoundHandler', () => {
  it('returns 404 with route info', () => {
    const res = mockRes();
    notFoundHandler({ method: 'GET', path: '/api/missing' } as Request, res);
    assert.equal(res.statusCode, 404);
    assert.match((res.body as { message: string }).message, /GET.*\/api\/missing/);
  });
});
