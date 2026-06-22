import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors.js';

type RequestTarget = 'body' | 'query' | 'params';

export const validate =
  (schema: ZodSchema, target: RequestTarget = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      (req as any)[target] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string> = {};
        for (const issue of error.issues) {
          errors[issue.path.join('.') || 'value'] = issue.message;
        }
        next(new ValidationError('Validation failed', errors));
      } else {
        next(error);
      }
    }
  };

export const ok = <T>(res: Response, data: T, status = 200) =>
  res.status(status).json({ success: true, data });

export const fail = (res: Response, message: string, status = 500) =>
  res.status(status).json({ success: false, message });
