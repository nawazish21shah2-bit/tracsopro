import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AppError,
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from '../src/utils/errors.js';

describe('AppError hierarchy', () => {
  it('AppError carries statusCode and isOperational', () => {
    const err = new AppError('fail', 418, true);
    assert.equal(err.message, 'fail');
    assert.equal(err.statusCode, 418);
    assert.equal(err.isOperational, true);
  });

  it('ValidationError is 400', () => {
    const err = new ValidationError('invalid');
    assert.equal(err.statusCode, 400);
  });

  it('UnauthorizedError is 401', () => {
    assert.equal(new UnauthorizedError().statusCode, 401);
  });

  it('ForbiddenError is 403', () => {
    assert.equal(new ForbiddenError('nope').statusCode, 403);
  });

  it('NotFoundError is 404', () => {
    assert.equal(new NotFoundError().statusCode, 404);
  });

  it('ConflictError is 409', () => {
    assert.equal(new ConflictError('dup').statusCode, 409);
  });

  it('BadRequestError is 400', () => {
    assert.equal(new BadRequestError('bad').statusCode, 400);
  });
});
