CREATE TYPE "AudioSourceType" AS ENUM ('UPLOAD', 'SPOTIFY');

ALTER TABLE "Audio"
ADD COLUMN "sourceType" "AudioSourceType" NOT NULL DEFAULT 'UPLOAD',
ADD COLUMN "sourceUrl" TEXT,
ADD COLUMN "externalTrackId" TEXT,
ADD COLUMN "externalDurationMs" INTEGER;

ALTER TABLE "GenerationSession"
ALTER COLUMN "durationMs" DROP NOT NULL,
ALTER COLUMN "fadeInMs" DROP NOT NULL,
ALTER COLUMN "fadeOutMs" DROP NOT NULL;

ALTER TABLE "Video"
ADD COLUMN "audioStartMs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "audioFadeInMs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "audioFadeOutMs" INTEGER NOT NULL DEFAULT 0;

INSERT INTO "VideoPreset" ("id", "name", "description", "format", "component", "width", "height", "fps")
VALUES (
    'music-widget',
    'Music Widget',
    'Vertical music player composition based on the ambientmode50 reference',
    '9:16',
    'music-widget',
    1080,
    1920,
    30
);
