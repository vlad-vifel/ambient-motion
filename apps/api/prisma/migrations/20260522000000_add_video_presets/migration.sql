-- CreateEnum
CREATE TYPE "VideoFormat" AS ENUM ('16:9', '4:3', '1:1', '3:4', '9:16');

-- CreateTable
CREATE TABLE "VideoPreset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "format" "VideoFormat" NOT NULL,
    "component" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "fps" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VideoPreset_pkey" PRIMARY KEY ("id")
);

-- Seed default preset
INSERT INTO "VideoPreset" ("id", "name", "description", "format", "component", "width", "height", "fps")
VALUES (
    'ambient-motion-1',
    'Ambient Motion 1',
    'Cinematic melancholic square video with centered photo and phrase overlay',
    '1:1',
    'ambient-motion-1',
    1080,
    1080,
    30
);

-- AddColumn presetId to GenerationSession (with default first, then drop default after FK)
ALTER TABLE "GenerationSession" ADD COLUMN "presetId" TEXT NOT NULL DEFAULT 'ambient-motion-1';

-- AddColumn presetId to Video
ALTER TABLE "Video" ADD COLUMN "presetId" TEXT NOT NULL DEFAULT 'ambient-motion-1';

-- AddForeignKey
ALTER TABLE "GenerationSession" ADD CONSTRAINT "GenerationSession_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "VideoPreset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "VideoPreset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: remove defaults (data already set)
ALTER TABLE "GenerationSession" ALTER COLUMN "presetId" DROP DEFAULT;
ALTER TABLE "Video" ALTER COLUMN "presetId" DROP DEFAULT;
