/*
  Warnings:

  - You are about to drop the column `durationSec` on the `GenerationSession` table. All the data in the column will be lost.
  - You are about to drop the column `presetId` on the `GenerationSession` table. All the data in the column will be lost.
  - You are about to drop the column `durationSec` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `presetId` on the `Video` table. All the data in the column will be lost.
  - Added the required column `durationMs` to the `GenerationSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GenerationSession" DROP COLUMN "durationSec",
DROP COLUMN "presetId",
ADD COLUMN     "durationMs" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Video" DROP COLUMN "durationSec",
DROP COLUMN "presetId",
ADD COLUMN     "durationMs" INTEGER NOT NULL DEFAULT 30000;
