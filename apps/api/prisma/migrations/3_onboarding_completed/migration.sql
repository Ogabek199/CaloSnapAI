-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

-- Existing profiles that were saved after creation went through goals/save (onboarding or profile edit).
UPDATE "user_profiles" SET "onboardingCompleted" = true WHERE "updatedAt" > "createdAt" + INTERVAL '2 seconds';
