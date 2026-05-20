import { Response, Router } from 'express';
import { prisma } from '../lib/prisma';
import { deleteFile } from '../lib/s3';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const folders = await prisma.folder.findMany({
            where: { userId: req.userId! },
            orderBy: { createdAt: 'asc' },
        });
        res.json(folders);
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.body as { name: string };
        if (!name?.trim()) {
            res.status(400).json({ error: 'Name is required' });
            return;
        }
        const folder = await prisma.folder.create({
            data: { name: name.trim(), userId: req.userId! },
        });
        res.status(201).json(folder);
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.body as { name: string };
        if (!name?.trim()) {
            res.status(400).json({ error: 'Name is required' });
            return;
        }
        const folder = await prisma.folder.findFirst({
            where: { id: String(req.params.id), userId: req.userId! },
        });
        if (!folder) {
            res.status(404).json({ error: 'Folder not found' });
            return;
        }
        const updated = await prisma.folder.update({
            where: { id: String(req.params.id) },
            data: { name: name.trim() },
        });
        res.json(updated);
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const folder = await prisma.folder.findFirst({
            where: { id: String(req.params.id), userId: req.userId! },
        });
        if (!folder) {
            res.status(404).json({ error: 'Folder not found' });
            return;
        }

        const assets = await prisma.asset.findMany({
            where: { folderId: String(req.params.id) },
        });
        await Promise.all(
            assets.map((a) => (a.storageKey ? deleteFile(a.storageKey, req.userId!) : null)),
        );

        await prisma.folder.delete({ where: { id: String(req.params.id) } });
        res.json({ success: true });
    } catch (err) {
        console.error('Folder delete error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
