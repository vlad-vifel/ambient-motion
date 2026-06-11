-- FKs on GenerationSession.presetId and Video.presetId use ON UPDATE CASCADE,
-- so renaming the preset id propagates to all referencing rows automatically.
UPDATE "VideoPreset" SET "id" = 'ambient-motion' WHERE "id" = 'ambient-motion-1';
