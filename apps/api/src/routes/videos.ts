import { Response, Router } from 'express';
import { prisma } from '../lib/prisma';
import { deleteFile, generateSignedUrl } from '../lib/s3';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const videos = await prisma.video.findMany({
            where: { userId: req.userId! },
            orderBy: { createdAt: 'desc' },
        });

        const videosWithSignedUrls = videos.map((video) => ({
            ...video,
            videoUrl:
                video.videoUrl && video.status === 'COMPLETED'
                    ? generateSignedUrl(video.videoUrl, req.userId!, 24 * 3600)
                    : null,
        }));

        res.json(videosWithSignedUrls);
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const { title, phrase } = req.body as { title: string; phrase: string };
        if (!title || !phrase) {
            res.status(400).json({ error: 'Title and phrase are required' });
            return;
        }
        const video = await prisma.video.create({
            data: { title, phrase, userId: req.userId!, status: 'QUEUED' },
        });
        res.status(201).json(video);
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const video = await prisma.video.findFirst({
            where: { id: String(req.params.id), userId: req.userId! },
        });
        if (!video) {
            res.status(404).json({ error: 'Video not found' });
            return;
        }

        if (video.videoUrl) {
            await deleteFile(video.videoUrl, req.userId!);
        }
        if (video.thumbnailUrl) {
            await deleteFile(video.thumbnailUrl, req.userId!);
        }

        await prisma.video.delete({ where: { id: String(req.params.id) } });
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
