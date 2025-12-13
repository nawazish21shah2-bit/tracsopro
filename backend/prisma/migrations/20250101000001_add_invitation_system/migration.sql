-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "securityCompanyId" TEXT NOT NULL,
    "email" TEXT,
    "role" "Role" NOT NULL,
    "invitationCode" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedBy" TEXT,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_invitationCode_key" ON "Invitation"("invitationCode");

-- CreateIndex
CREATE INDEX "Invitation_securityCompanyId_idx" ON "Invitation"("securityCompanyId");

-- CreateIndex
CREATE INDEX "Invitation_invitationCode_idx" ON "Invitation"("invitationCode");

-- CreateIndex
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");

-- CreateIndex
CREATE INDEX "Invitation_expiresAt_idx" ON "Invitation"("expiresAt");

-- CreateIndex
CREATE INDEX "Invitation_isActive_idx" ON "Invitation"("isActive");

-- CreateIndex
CREATE INDEX "Invitation_role_idx" ON "Invitation"("role");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_securityCompanyId_fkey" FOREIGN KEY ("securityCompanyId") REFERENCES "SecurityCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



