import { Response, Router } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { presetDefinitions } from '../presets/registry';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req: AuthRequest, res: Response) => {
    try {
        const persistedPresets = await prisma.videoPreset.findMany({
            where: { id: { in: presetDefinitions.map((preset) => preset.id) } },
            select: { id: true, createdAt: true },
        });
        const persistedById = new Map(persistedPresets.map((preset) => [preset.id, preset]));
        const missingPreset = presetDefinitions.find((preset) => !persistedById.has(preset.id));
        if (missingPreset) {
            res.status(500).json({ error: `Preset ${missingPreset.id} is not installed` });
            return;
        }
        res.json(
            presetDefinitions.map((preset) => ({
                id: preset.id,
                component: preset.compositionId,
                ...preset.display,
                width: preset.width,
                height: preset.height,
                fps: preset.fps,
                createdAt: persistedById.get(preset.id)!.createdAt,
            })),
        );
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
