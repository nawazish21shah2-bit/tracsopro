import { getApiBaseUrl } from '../config/apiConfig';
import { securityManager } from './security';

type PictureSource = {
  profilePictureUrl?: string | null;
  avatar?: string | null;
  profilePicture?: string | null;
  user?: {
    profilePictureUrl?: string | null;
    avatar?: string | null;
  } | null;
  guard?: {
    profilePictureUrl?: string | null;
    avatar?: string | null;
  } | null;
} | null | undefined;

/**
 * Normalize profile picture URLs for device/emulator (localhost, relative paths).
 */
export function resolveProfilePictureUrl(url?: string | null): string | undefined {
  if (!url || typeof url !== 'string') return undefined;

  const trimmed = url.trim();
  if (!trimmed) return undefined;

  let imageSource = trimmed;

  if (imageSource.startsWith('http://localhost') || imageSource.startsWith('http://127.0.0.1')) {
    const baseUrl = getApiBaseUrl().replace(/\/api$/, '');
    imageSource = imageSource.replace(/^http:\/\/(localhost|127\.0\.0\.1):\d+/, baseUrl);
  } else if (imageSource.startsWith('/uploads')) {
    const baseUrl = getApiBaseUrl().replace(/\/api$/, '');
    imageSource = `${baseUrl}/api${imageSource}`;
  }

  return imageSource;
}

/**
 * Append access token for authenticated profile image requests (React Native Image).
 */
export async function resolveAuthenticatedProfilePictureUrl(
  url?: string | null
): Promise<string | undefined> {
  const resolved = resolveProfilePictureUrl(url);
  if (!resolved || !resolved.includes('/api/uploads/')) {
    return resolved;
  }
  try {
    const tokens = await securityManager.getTokens();
    if (tokens?.accessToken) {
      const separator = resolved.includes('?') ? '&' : '?';
      return `${resolved}${separator}access_token=${encodeURIComponent(tokens.accessToken)}`;
    }
  } catch {
    // fall through without token
  }
  return resolved;
}

/**
 * Pick the first usable profile picture from common API field shapes.
 */
export function pickProfilePictureUrl(source?: PictureSource): string | undefined {
  if (!source) return undefined;

  const candidates = [
    source.profilePictureUrl,
    source.avatar,
    source.profilePicture,
    source.user?.profilePictureUrl,
    source.user?.avatar,
    source.guard?.profilePictureUrl,
    source.guard?.avatar,
  ];

  for (const candidate of candidates) {
    const resolved = resolveProfilePictureUrl(candidate);
    if (resolved) return resolved;
  }

  return undefined;
}
