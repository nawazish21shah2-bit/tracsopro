import { LiveGuardMarker, LiveGuardStatus } from '../types/liveTracking.types';
import { isValidLatLng, parseCoordinate } from './mapRegionUtils';

const roundCoord = (value: number) => Math.round(value * 10000) / 10000;

export const distanceMeters = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** Stable signature for map/state updates (~11 m precision). */
export const buildLiveGuardSignature = (guards: LiveGuardMarker[]): string =>
  guards
    .map(
      (g) =>
        `${g.guardId}:${roundCoord(g.latitude)}:${roundCoord(g.longitude)}:${g.status}`,
    )
    .sort()
    .join('|');

export const guardMovedMeaningfully = (
  prev: Pick<LiveGuardMarker, 'latitude' | 'longitude'>,
  next: Pick<LiveGuardMarker, 'latitude' | 'longitude'>,
  thresholdMeters = 12,
): boolean =>
  distanceMeters(prev.latitude, prev.longitude, next.latitude, next.longitude) >=
  thresholdMeters;

const isValidCoordinate = (lat?: number | null, lng?: number | null): boolean =>
  isValidLatLng(lat, lng);

export { isValidCoordinate };

const normalizeStatus = (status?: string): LiveGuardStatus => {
  switch ((status || '').toLowerCase()) {
    case 'on_break':
    case 'on break':
      return 'on_break';
    case 'offline':
    case 'off_duty':
      return 'offline';
    case 'emergency':
      return 'emergency';
    default:
      return 'active';
  }
};

/** Normalize /tracking/live-locations API rows */
export const mapLiveLocationsApiResponse = (rows: any[]): LiveGuardMarker[] =>
  (rows || [])
    .filter((row) => isValidCoordinate(row?.location?.latitude, row?.location?.longitude))
    .map((row) => ({
      guardId: row.guardId,
      guardName: row.guardName || 'Guard',
      latitude: row.location.latitude,
      longitude: row.location.longitude,
      accuracy: row.location.accuracy || 0,
      status: 'active' as LiveGuardStatus,
      siteName: row.siteName,
      timestamp: row.location.timestamp
        ? new Date(row.location.timestamp).getTime()
        : Date.now(),
    }));

/** Normalize WebSocket getRealTimeLocationData payloads */
export const mapRealtimeWsPayload = (rows: any[]): LiveGuardMarker[] =>
  (rows || [])
    .filter((row) => isValidCoordinate(row?.location?.latitude, row?.location?.longitude))
    .map((row) => ({
      guardId: row.guard?.id || row.guardId,
      guardName: row.guard?.name || row.guardName || 'Guard',
      latitude: row.location.latitude,
      longitude: row.location.longitude,
      accuracy: row.location.accuracy || 0,
      status: normalizeStatus(row.guard?.status),
      siteName: row.siteName || row.currentShift?.site?.name,
      timestamp: row.lastUpdate
        ? new Date(row.lastUpdate).getTime()
        : row.location.timestamp
          ? new Date(row.location.timestamp).getTime()
          : Date.now(),
    }));

/** Normalize admin operations guard status rows */
export const mapOperationsGuardStatuses = (rows: any[]): LiveGuardMarker[] =>
  (rows || [])
    .filter((row) => isValidCoordinate(row?.location?.latitude, row?.location?.longitude))
    .map((row) => ({
      guardId: row.guardId,
      guardName: row.guardName || 'Guard',
      latitude: row.location.latitude,
      longitude: row.location.longitude,
      accuracy: row.location.accuracy || 0,
      status: normalizeStatus(row.status),
      siteName: row.currentSite,
      timestamp: row.location.timestamp || row.lastUpdate || Date.now(),
    }));

/** Merge supplemental metadata (names, sites, status) into live coordinates */
export const mergeLiveGuardMarkers = (
  base: LiveGuardMarker[],
  overlay: Partial<LiveGuardMarker>[]
): LiveGuardMarker[] => {
  const overlayMap = new Map(overlay.map((item) => [item.guardId!, item]));

  const merged = base.map((guard) => {
    const extra = overlayMap.get(guard.guardId);
    if (!extra) return guard;
    return {
      ...guard,
      ...extra,
      latitude: guard.latitude,
      longitude: guard.longitude,
      accuracy: guard.accuracy ?? extra.accuracy ?? 0,
      timestamp: guard.timestamp ?? extra.timestamp ?? Date.now(),
    };
  });

  overlay.forEach((extra) => {
    if (!extra.guardId) return;
    if (merged.some((g) => g.guardId === extra.guardId)) return;
    if (!isValidCoordinate(extra.latitude, extra.longitude)) return;
    merged.push({
      guardId: extra.guardId,
      guardName: extra.guardName || 'Guard',
      latitude: extra.latitude!,
      longitude: extra.longitude!,
      accuracy: extra.accuracy || 0,
      status: extra.status || 'active',
      siteName: extra.siteName,
      timestamp: extra.timestamp || Date.now(),
    });
  });

  return merged;
};

export const liveGuardMapById = (guards: LiveGuardMarker[]): Map<string, LiveGuardMarker> => {
  const map = new Map<string, LiveGuardMarker>();
  guards.forEach((guard) => {
    map.set(guard.guardId, guard);
    if (guard.userId) {
      map.set(guard.userId, guard);
    }
  });
  return map;
};
