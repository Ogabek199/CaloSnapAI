-- DropForeignKey
ALTER TABLE "food_scan_items" DROP CONSTRAINT "food_scan_items_foodId_fkey";

-- DropForeignKey
ALTER TABLE "meal_items" DROP CONSTRAINT "meal_items_foodId_fkey";

-- DropForeignKey
ALTER TABLE "password_reset_otps" DROP CONSTRAINT "password_reset_otps_userId_fkey";

-- DropIndex
DROP INDEX "food_scans_userId_idx";

-- AlterTable
ALTER TABLE "food_scans" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- DropTable
DROP TABLE "password_reset_otps";

-- CreateIndex
CREATE INDEX "food_scans_userId_createdAt_idx" ON "food_scans"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "food_scan_items" ADD CONSTRAINT "food_scan_items_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "foods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "foods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

