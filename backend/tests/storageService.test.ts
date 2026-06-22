import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  isS3StorageEnabled,
  buildProfilePicturePublicUrl,
  clientFacingProfilePictureUrl,
  resolveProfilePictureUrlForClient,
} from '../src/services/storageService.js';

describe('storageService', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.API_URL = 'https://api.example.com';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('isS3StorageEnabled is false without S3 env', () => {
    delete process.env.S3_BUCKET;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    assert.equal(isS3StorageEnabled(), false);
  });

  it('isS3StorageEnabled is true when all S3 env vars are set', () => {
    process.env.S3_BUCKET = 'my-bucket';
    process.env.AWS_ACCESS_KEY_ID = 'key';
    process.env.AWS_SECRET_ACCESS_KEY = 'secret';
    assert.equal(isS3StorageEnabled(), true);
  });

  it('buildProfilePicturePublicUrl uses API_URL', () => {
    const url = buildProfilePicturePublicUrl('profile_user1_123.jpg');
    assert.equal(
      url,
      'https://api.example.com/api/uploads/profile-pictures/profile_user1_123.jpg'
    );
  });

  it('clientFacingProfilePictureUrl maps s3 refs to API proxy path', () => {
    const stored = 's3://my-bucket/profile-pictures/profile_user1_123.jpg';
    const url = clientFacingProfilePictureUrl(stored);
    assert.equal(
      url,
      'https://api.example.com/api/uploads/profile-pictures/profile_user1_123.jpg'
    );
  });

  it('clientFacingProfilePictureUrl normalizes legacy upload paths', () => {
    const legacy = 'https://api.example.com/uploads/profile-pictures/profile_user1_123.jpg';
    const url = clientFacingProfilePictureUrl(legacy);
    assert.equal(
      url,
      'https://api.example.com/api/uploads/profile-pictures/profile_user1_123.jpg'
    );
  });

  it('resolveProfilePictureUrlForClient returns null for empty input', () => {
    assert.equal(resolveProfilePictureUrlForClient(null), null);
    assert.equal(resolveProfilePictureUrlForClient(undefined), null);
  });
});
