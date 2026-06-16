import { Region } from 'react-native-maps';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export function parseCoordinate(value: unknown): number | undefined {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

export function isValidLatLng(lat?: unknown, lng?: unknown): boolean {
  const latitude = parseCoordinate(lat);
  const longitude = parseCoordinate(lng);
  if (latitude === undefined || longitude === undefined) return false;
  if (latitude === 0 && longitude === 0) return false;
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

export function computeRegionForPoints(
  points: LatLng[],
  minDelta = 0.006,
): Region {
  if (points.length === 0) {
    return {
      latitude: 37.7749,
      longitude: -122.4194,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }

  if (points.length === 1) {
    return {
      latitude: points[0].latitude,
      longitude: points[0].longitude,
      latitudeDelta: minDelta,
      longitudeDelta: minDelta,
    };
  }

  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latDelta = Math.max((maxLat - minLat) * 1.6, minDelta);
  const lngDelta = Math.max((maxLng - minLng) * 1.6, minDelta);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

export function collectMapPoints(input: {
  siteLatitude?: unknown;
  siteLongitude?: unknown;
  guardLatitude?: unknown;
  guardLongitude?: unknown;
}): LatLng[] {
  const points: LatLng[] = [];
  const siteLat = parseCoordinate(input.siteLatitude);
  const siteLng = parseCoordinate(input.siteLongitude);
  const guardLat = parseCoordinate(input.guardLatitude);
  const guardLng = parseCoordinate(input.guardLongitude);

  if (isValidLatLng(siteLat, siteLng)) {
    points.push({ latitude: siteLat!, longitude: siteLng! });
  }
  if (isValidLatLng(guardLat, guardLng)) {
    points.push({ latitude: guardLat!, longitude: guardLng! });
  }
  return points;
}
