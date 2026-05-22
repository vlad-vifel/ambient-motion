-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('QUEUED', 'GENERATING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'User',
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Folder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "folderId" TEXT,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Audio" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL DEFAULT '',
    "filename" TEXT NOT NULL,
    "coverFilename" TEXT,
    "coverUrl" TEXT,
    "duration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Audio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationSession" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "presetId" TEXT NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "audioId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "GenerationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionAsset" (
    "sessionId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,

    CONSTRAINT "SessionAsset_pkey" PRIMARY KEY ("sessionId","assetId")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "status" "VideoStatus" NOT NULL DEFAULT 'QUEUED',
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "sessionId" TEXT,
    "assetId" TEXT,
    "sourceImageUrl" TEXT NOT NULL DEFAULT '',
    "audioId" TEXT,
    "sourceAudioUrl" TEXT NOT NULL DEFAULT '',
    "presetId" TEXT NOT NULL DEFAULT 'square_1080',
    "durationSec" INTEGER NOT NULL DEFAULT 30,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "GenerationSession_userId_createdAt_idx" ON "GenerationSession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SessionAsset_assetId_idx" ON "SessionAsset"("assetId");

-- CreateIndex
CREATE INDEX "Video_userId_createdAt_idx" ON "Video"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Video_sessionId_idx" ON "Video"("sessionId");

-- CreateIndex
CREATE INDEX "Video_status_idx" ON "Video"("status");

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audio" ADD CONSTRAINT "Audio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationSession" ADD CONSTRAINT "GenerationSession_audioId_fkey" FOREIGN KEY ("audioId") REFERENCES "Audio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationSession" ADD CONSTRAINT "GenerationSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAsset" ADD CONSTRAINT "SessionAsset_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GenerationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAsset" ADD CONSTRAINT "SessionAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GenerationSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_audioId_fkey" FOREIGN KEY ("audioId") REFERENCES "Audio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
