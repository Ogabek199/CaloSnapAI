-- CreateEnum
CREATE TYPE "FoodSource" AS ENUM ('CATALOG', 'OPEN_FOOD_FACTS', 'AI_DETECTED', 'USER_SUBMITTED');

-- AlterTable
ALTER TABLE "foods" ADD COLUMN "source" "FoodSource" NOT NULL DEFAULT 'CATALOG',
ADD COLUMN "createdByUserId" TEXT;

-- Until now only the OpenFoodFacts lookup stored barcodes.
UPDATE "foods" SET "source" = 'OPEN_FOOD_FACTS' WHERE "barcode" IS NOT NULL;
