import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistanceMeters,
  isWithinSiteRadius,
  getEffectiveSiteRadiusMeters,
  assertWithinSiteRadius,
} from '../src/services/shift/geofenceService.js';
import { BadRequestError } from '../src/utils/errors.js';

describe('geofenceService', () => {
  it('calculateDistanceMeters returns 0 for identical coordinates', () => {
    assert.equal(calculateDistanceMeters(40.7128, -74.006, 40.7128, -74.006), 0);
  });

  it('isWithinSiteRadius allows guard at site center', () => {
    const result = isWithinSiteRadius(40.7128, -74.006, 40.7128, -74.006, 100);
    assert.equal(result.allowed, true);
    assert.equal(result.distanceMeters, 0);
  });

  it('isWithinSiteRadius rejects guard far from site', () => {
    const result = isWithinSiteRadius(40.7128, -74.006, 34.0522, -118.2437, 100);
    assert.equal(result.allowed, false);
    assert.ok(result.distanceMeters > 100);
  });

  it('isWithinSiteRadius respects custom radius', () => {
    const siteLat = 40.7128;
    const siteLon = -74.006;
    const nearbyLat = 40.7129;
    const nearbyLon = -74.006;
    const distance = calculateDistanceMeters(siteLat, siteLon, nearbyLat, nearbyLon);
    const within = isWithinSiteRadius(nearbyLat, nearbyLon, siteLat, siteLon, distance + 1);
    const outside = isWithinSiteRadius(nearbyLat, nearbyLon, siteLat, siteLon, distance - 1);
    assert.equal(within.allowed, true);
    assert.equal(outside.allowed, false);
  });

  it('getEffectiveSiteRadiusMeters enforces minimum radius', () => {
    assert.equal(getEffectiveSiteRadiusMeters(5), 20);
    assert.equal(getEffectiveSiteRadiusMeters(150), 150);
  });

  it('assertWithinSiteRadius throws BadRequestError when outside radius', () => {
    assert.throws(
      () =>
        assertWithinSiteRadius(40.8, -74.1, {
          id: 'site-1',
          name: 'HQ',
          latitude: 40.7128,
          longitude: -74.006,
          radiusMeters: 100,
        }, 'Check-in denied'),
      BadRequestError
    );
  });

  it('assertWithinSiteRadius passes when inside radius', () => {
    assert.doesNotThrow(() =>
      assertWithinSiteRadius(40.7128, -74.006, {
        id: 'site-1',
        name: 'HQ',
        latitude: 40.7128,
        longitude: -74.006,
        radiusMeters: 100,
      }, 'Check-in denied')
    );
  });
});
