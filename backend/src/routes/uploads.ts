import { Router, Response, NextFunction } from 'express';

import path from 'path';

import fs from 'fs';

import { authenticate, AuthRequest } from '../middleware/auth.js';

import { verifyToken } from '../utils/jwt.js';

import { ForbiddenError, NotFoundError, UnauthorizedError } from '../utils/errors.js';

import prisma from '../config/database.js';

import {

  isS3StorageEnabled,

  resolveProfilePictureAccess,

} from '../services/storageService.js';



const router = Router();



const uploadsDir = path.join(process.cwd(), 'uploads', 'profile-pictures');



function parseProfileOwnerId(filename: string): string | null {

  const match = filename.match(/^profile_([^_]+)_\d+\.[a-zA-Z0-9]+$/);

  return match ? match[1] : null;

}



async function resolveUploadAuth(

  req: AuthRequest,

  res: Response,

  next: NextFunction

): Promise<void> {

  try {

    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {

      return authenticate(req, res, next);

    }



    const queryToken = typeof req.query.access_token === 'string' ? req.query.access_token : null;

    if (!queryToken) {

      throw new UnauthorizedError('No token provided');

    }



    const payload = verifyToken(queryToken);

    if (payload.type !== 'access') {

      throw new UnauthorizedError('Invalid token type');

    }



    const user = await prisma.user.findUnique({

      where: { id: payload.sub },

      select: { id: true, role: true, isActive: true },

    });



    if (!user || !user.isActive) {

      throw new UnauthorizedError('User not found or inactive');

    }



    req.userId = user.id;

    req.user = user;

    next();

  } catch (error) {

    next(error);

  }

}



router.get('/profile-pictures/:filename', resolveUploadAuth, async (req: AuthRequest, res, next) => {

  try {

    const { filename } = req.params;

    if (!filename || filename.includes('..') || filename.includes('/')) {

      throw new NotFoundError('File not found');

    }



    const ownerId = parseProfileOwnerId(filename);

    if (!ownerId) {

      throw new NotFoundError('File not found');

    }



    const isOwner = req.userId === ownerId;

    const isPrivileged = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

    if (!isOwner && !isPrivileged) {

      throw new ForbiddenError('Access denied');

    }



    const owner = await prisma.user.findUnique({

      where: { id: ownerId },

      select: { profilePictureUrl: true },

    });



    const storedUrl =

      owner?.profilePictureUrl ||

      (isS3StorageEnabled()

        ? `s3://${process.env.S3_BUCKET}/profile-pictures/${filename}`

        : '');



    if (storedUrl) {

      const access = await resolveProfilePictureAccess(storedUrl, filename);

      if (access?.type === 'redirect') {

        res.redirect(access.url);

        return;

      }

      if (access?.type === 'file') {

        res.sendFile(access.filePath);

        return;

      }

    }



    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {

      throw new NotFoundError('File not found');

    }



    res.sendFile(filePath);

  } catch (error) {

    next(error);

  }

});



export default router;

