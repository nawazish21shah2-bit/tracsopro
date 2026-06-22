import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const verifyOtpSchema = z.object({
  userId: z.string().uuid(),
  otp: z.string().regex(/^\d{6}$/),
});

export const checkInSchema = z.object({
  shiftId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
