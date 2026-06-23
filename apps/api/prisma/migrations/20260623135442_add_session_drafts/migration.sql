-- AlterEnum
ALTER TYPE "VideoStatus" ADD VALUE 'DRAFT';

-- AlterTable
ALTER TABLE "GenerationSession" ADD COLUMN     "assetSource" TEXT,
ADD COLUMN     "autoAssign" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDraft" BOOLEAN NOT NULL DEFAULT false;
