import { Response, Router } from 'express';
import multer from 'multer';
import { prisma } from '../lib/prisma';
import { deleteFile, uploadFile } from '../lib/s3';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images allowed'));
        }
    },
});

router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { folderId } = req.query as { folderId?: string };
        const where: { userId: string; folderId?: string | null } = { userId: req.userId! };
        if (folderId === 'root') {
            where.folderId = null;
        } else if (folderId) {
            where.folderId = folderId;
        }
        const assets = await prisma.asset.findMany({
            where,
            orderBy: { uploadedAt: 'desc' },
            include: { _count: { select: { videos: true } } },
        });
        res.json(assets.map(({ _count, ...a }) => ({ ...a, isUsed: _count.videos > 0 })));
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', upload.array('files'), async (req: AuthRequest, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[] | undefined;
        if (!files || files.length === 0) {
            res.status(400).json({ error: 'No files provided' });
            return;
        }

        const folderId = req.body.folderId || null;

        if (folderId) {
            const folder = await prisma.folder.findFirst({
                where: { id: folderId, userId: req.userId! },
            });
            if (!folder) {
                res.status(400).json({ error: 'Folder not found' });
                return;
            }
        }

        const created = await Promise.all(
            files.map(async (file) => {
                const storageKey = `assets/${Date.now()}-${file.originalname}`;
                const url = await uploadFile(storageKey, file.buffer, file.mimetype, req.userId!);
                return prisma.asset.create({
                    data: {
                        filename: file.originalname,
                        storageKey,
                        url,
                        size: file.size,
                        userId: req.userId!,
                        folderId,
                    },
                });
            }),
        );

        res.status(201).json(created);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { filename } = req.body as { filename: string };
        if (!filename?.trim()) {
            res.status(400).json({ error: 'Filename is required' });
            return;
        }
        const asset = await prisma.asset.findFirst({
            where: { id: String(req.params.id), userId: req.userId! },
        });
        if (!asset) {
            res.status(404).json({ error: 'Asset not found' });
            return;
        }
        const updated = await prisma.asset.update({
            where: { id: String(req.params.id) },
            data: { filename: filename.trim() },
        });
        res.json(updated);
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const asset = await prisma.asset.findFirst({
            where: { id: String(req.params.id), userId: req.userId! },
        });
        if (!asset) {
            res.status(404).json({ error: 'Asset not found' });
            return;
        }

        if (asset.storageKey) {
            await deleteFile(asset.storageKey, req.userId!);
        }
        await prisma.asset.delete({ where: { id: String(req.params.id) } });

        res.json({ success: true });
    } catch (err) {
        console.error('Asset delete error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
