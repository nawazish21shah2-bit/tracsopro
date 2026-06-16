import jwt from 'jsonwebtoken';
import { UnauthorizedError } from './errors.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('Missing required environment variable JWT_SECRET');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

export interface TokenPayload {
  sub: string;
  type?: 'access' | 'refresh';
  jti?: string;
}

const parseDuration = (duration: string): number => {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 0;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  return value * (multipliers[unit] || 0);
};

export const signAccessToken = (userId: string): string => {
  return jwt.sign({ sub: userId, type: 'access' } as TokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const signRefreshToken = (userId: string, jti: string): string => {
  return jwt.sign({ sub: userId, type: 'refresh', jti } as TokenPayload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
};

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
};

export const getTokenExpiresIn = (): number => {
  return parseDuration(JWT_EXPIRES_IN);
};

export const getRefreshTokenExpiresIn = (): number => {
  return parseDuration(REFRESH_TOKEN_EXPIRES_IN);
};
