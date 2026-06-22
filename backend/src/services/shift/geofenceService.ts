/**
 * Shared geofence distance calculations for shift check-in/out.
 */
import { BadRequestError } from '../../utils/errors.js';

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isWithinSiteRadius(
  guardLat: number,
  guardLon: number,
  siteLat: number,
  siteLon: number,
  radiusMeters: number,
): { allowed: boolean; distanceMeters: number } {
  const distanceMeters = calculateDistanceMeters(guardLat, guardLon, siteLat, siteLon);
  return { allowed: distanceMeters <= radiusMeters, distanceMeters };
}

export function getEffectiveSiteRadiusMeters(radiusMeters?: number | null): number {
  return Math.max(20, radiusMeters || 100);
}

export interface SiteGeofenceTarget {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number | null;
}

export function assertWithinSiteRadius(
  guardLat: number,
  guardLon: number,
  site: SiteGeofenceTarget,
  actionLabel: string,
): void {
  const allowedRadiusMeters = getEffectiveSiteRadiusMeters(site.radiusMeters);
  const { allowed, distanceMeters } = isWithinSiteRadius(
    guardLat,
    guardLon,
    site.latitude,
    site.longitude,
    allowedRadiusMeters,
  );

  if (!allowed) {
    const roundedDistance = Math.round(distanceMeters);
    const message = `${actionLabel}. You are ${roundedDistance}m away from ${site.name}; maximum allowed radius is ${allowedRadiusMeters}m.`;
    const error = new BadRequestError(message) as BadRequestError & {
      details?: Record<string, unknown>;
    };
    error.details = {
      reason: 'OUTSIDE_SITE_RADIUS',
      siteId: site.id,
      siteName: site.name,
      distanceMeters: roundedDistance,
      allowedRadiusMeters,
    };
    throw error;
  }
}
