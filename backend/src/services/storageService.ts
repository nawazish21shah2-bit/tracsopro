import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

const PROFILE_PREFIX = 'profile-pictures/';

export function isS3StorageEnabled(): boolean {
  return Boolean(
    process.env.S3_BUCKET &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY,
  );
}

function localProfileDir(): string {
  return path.join(process.cwd(), 'uploads', 'profile-pictures');
}

function parseS3Reference(stored: string): { bucket: string; key: string } | null {
  if (!stored.startsWith('s3://')) return null;
  const withoutScheme = stored.slice('s3://'.length);
  const slash = withoutScheme.indexOf('/');
  if (slash <= 0) return null;
  return {
    bucket: withoutScheme.slice(0, slash),
    key: withoutScheme.slice(slash + 1),
  };
}

async function getS3Client() {
  const { S3Client } = await import('@aws-sdk/client-s3');
  return new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

export function buildProfilePictureFilename(userId: string, originalName: string): string {
  const ext = path.extname(originalName).toLowerCase() || '.jpg';
  return `profile_${userId}_${Date.now()}${ext}`;
}

/** Public URL stored in DB — local disk or API proxy path for S3-backed files. */
export function buildProfilePicturePublicUrl(filename: string): string {
  const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
  return `${baseUrl}/api/uploads/profile-pictures/${filename}`;
}

/** Client-facing URL (always the authenticated API proxy path). */
export function clientFacingProfilePictureUrl(storedUrl: string): string {
  const s3Ref = parseS3Reference(storedUrl);
  if (s3Ref) {
    return buildProfilePicturePublicUrl(path.basename(s3Ref.key));
  }
  if (
    storedUrl.includes('/uploads/profile-pictures/') &&
    !storedUrl.includes('/api/uploads/profile-pictures/')
  ) {
    const filename = storedUrl.split('/').pop();
    if (filename) {
      return buildProfilePicturePublicUrl(filename);
    }
  }
  return storedUrl;
}

export function resolveProfilePictureUrlForClient(
  stored: string | null | undefined
): string | null {
  if (!stored) return null;
  if (stored.startsWith('s3://') || stored.includes('/uploads/profile-pictures/')) {
    return clientFacingProfilePictureUrl(stored);
  }
  return stored;
}

/** Persist uploaded profile picture; returns value to store in user.profilePictureUrl. */
export async function storeProfilePicture(
  userId: string,
  localFilePath: string,
  originalName: string,
): Promise<string> {
  const filename = buildProfilePictureFilename(userId, originalName);

  if (!isS3StorageEnabled()) {
    return buildProfilePicturePublicUrl(path.basename(localFilePath));
  }

  const bucket = process.env.S3_BUCKET!;
  const key = `${PROFILE_PREFIX}${filename}`;
  const body = fs.readFileSync(localFilePath);
  const contentType = guessContentType(filename);

  try {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    fs.unlinkSync(localFilePath);
    return `s3://${bucket}/${key}`;
  } catch (error) {
    logger.error('S3 upload failed — keeping local file', { error, userId });
    return buildProfilePicturePublicUrl(path.basename(localFilePath));
  }
}

export async function deleteStoredProfilePicture(storedUrl: string): Promise<void> {
  const s3Ref = parseS3Reference(storedUrl);
  if (s3Ref) {
    try {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const client = await getS3Client();
      await client.send(
        new DeleteObjectCommand({ Bucket: s3Ref.bucket, Key: s3Ref.key }),
      );
    } catch (error) {
      logger.warn('Failed to delete S3 profile picture', { error, storedUrl });
    }
    return;
  }

  const filename = storedUrl.split('/').pop();
  if (!filename) return;
  const filePath = path.join(localProfileDir(), filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/** Resolve stored URL to a readable path or signed redirect URL. */
export async function resolveProfilePictureAccess(
  storedUrl: string,
  filename: string,
): Promise<{ type: 'file'; filePath: string } | { type: 'redirect'; url: string } | null> {
  const s3Ref = parseS3Reference(storedUrl);
  if (s3Ref) {
    try {
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      const client = await getS3Client();
      const url = await getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: s3Ref.bucket, Key: s3Ref.key }),
        { expiresIn: 3600 },
      );
      return { type: 'redirect', url };
    } catch (error) {
      logger.warn('Failed to sign S3 profile picture URL', { error, filename });
      return null;
    }
  }

  const filePath = path.join(localProfileDir(), filename);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return { type: 'file', filePath };
}

function guessContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}
