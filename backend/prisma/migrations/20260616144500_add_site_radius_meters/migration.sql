-- Add configurable geofence radius per site
ALTER TABLE "Site"
ADD COLUMN "radiusMeters" INTEGER NOT NULL DEFAULT 100;
