-- IncidentReportStatus enum
CREATE TYPE "IncidentReportStatus" AS ENUM ('SUBMITTED', 'PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');

UPDATE "IncidentReport"
SET "status" = 'SUBMITTED'
WHERE "status" NOT IN ('SUBMITTED', 'PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');

ALTER TABLE "IncidentReport" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "IncidentReport"
  ALTER COLUMN "status" TYPE "IncidentReportStatus"
  USING ("status"::"IncidentReportStatus");
ALTER TABLE "IncidentReport"
  ALTER COLUMN "status" SET DEFAULT 'SUBMITTED'::"IncidentReportStatus";
