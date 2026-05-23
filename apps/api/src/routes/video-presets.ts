import { Response, Router } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req: AuthRequest, res: Response) => {
    try {
        const presets = await prisma.videoPreset.findMany({
            orderBy: { createdAt: 'asc' },
        });
        res.json(presets);
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
