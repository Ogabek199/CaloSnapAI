-- CreateEnum
CREATE TYPE "HealthCondition" AS ENUM ('DIABETES_TYPE_1', 'DIABETES_TYPE_2', 'PREDIABETES', 'HYPERTENSION', 'HIGH_CHOLESTEROL');

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "healthConditions" "HealthCondition"[] DEFAULT ARRAY[]::"HealthCondition"[];
