import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { validate } from '../src/middleware/validate.js';
import { loginSchema } from '../src/validators/authSchemas.js';
import { ValidationError } from '../src/utils/errors.js';
import type { Request, Response, NextFunction } from 'express';

describe('validate middleware', () => {
  it('parses valid body and calls next', () => {
    const req = {
      body: { email: 'user@example.com', password: 'password123' },
    } as Request;
    let passed = false;
    validate(loginSchema)(req, {} as Response, () => {
      passed = true;
    });
    assert.equal(passed, true);
    assert.equal(req.body.email, 'user@example.com');
  });

  it('forwards ValidationError on invalid body', () => {
    const req = { body: { email: 'bad', password: 'short' } } as Request;
    let err: unknown;
    validate(loginSchema)(req, {} as Response, (e) => {
      err = e;
    });
    assert.ok(err instanceof ValidationError);
    assert.equal((err as ValidationError).message, 'Validation failed');
  });

  it('validates query target when specified', () => {
    const schema = z.object({ email: z.string().email() });
    const req = { query: { email: 'user@example.com' } } as unknown as Request;
    let passed = false;
    validate(schema, 'query')(req, {} as Response, () => {
      passed = true;
    });
    assert.equal(passed, true);
  });
});
