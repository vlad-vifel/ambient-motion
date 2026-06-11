-- AlterTable
ALTER TABLE "GenerationSession" ADD COLUMN     "noAudio" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "noAudio" BOOLEAN NOT NULL DEFAULT false;
