-- Phase 2 core shopping experience support.
ALTER TABLE "Address" ADD COLUMN "label" TEXT;
ALTER TABLE "Address" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Cart" ADD COLUMN "expiresAt" TIMESTAMP(3);

CREATE INDEX "Address_customerId_isDefault_idx" ON "Address"("customerId", "isDefault");
CREATE INDEX "Cart_guestId_status_idx" ON "Cart"("guestId", "status");
