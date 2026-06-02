import { Response, Router } from 'express';
import { prisma } from '../lib/prisma';
import { generateSignedUrl } from '../lib/s3';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { triggerBatchVideoGeneration } from '../generator/dispatch';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const sessions = await prisma.generationSession.findMany({
            where: { userId: req.userId! },
            orderBy: { createdAt: 'desc' },
            include: {
                audio: {
                    select: { id: true, title: true, artist: true, coverUrl: true, duration: true },
                },
                assets: {
                    include: { asset: { select: { id: true, url: true, filename: true } } },
                    take: 4,
                },
                _count: { select: { videos: true } },
            },
        });

        const statusCounts = await Promise.all(
            sessions.map(async (s) => {
                const counts = await prisma.video.groupBy({
                    by: ['status'],
                    where: { sessionId: s.id },
                    _count: true,
                });
                return { sessionId: s.id, counts };
            }),
        );

        const countMap = new Map(statusCounts.map((c) => [c.sessionId, c.counts]));

        const result = sessions.map((s) => {
            const counts = countMap.get(s.id) ?? [];
            const videoCounts = {
                queued: counts.find((c) => c.status === 'QUEUED')?._count ?? 0,
                generating: counts.find((c) => c.status === 'GENERATING')?._count ?? 0,
                completed: counts.find((c) => c.status === 'COMPLETED')?._count ?? 0,
                failed: counts.find((c) => c.status === 'FAILED')?._count ?? 0,
            };
            return { ...s, videoCounts };
        });

        res.json(result);
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const { name, audioId, assetIds, durationMs, fadeInMs, fadeOutMs, presetId } = req.body as {
            name?: string;
            audioId: string;
            assetIds: string[];
            durationMs: number;
            fadeInMs?: number;
            fadeOutMs?: number;
            presetId: string;
        };

        if (!audioId || !assetIds?.length || durationMs == null || !presetId) {
            res.status(400).json({
                error: 'audioId, assetIds, durationMs and presetId are required',
            });
            return;
        }

        const audio = await prisma.audio.findFirst({ where: { id: audioId, userId: req.userId! } });
        if (!audio) {
            res.status(404).json({ error: 'Audio not found' });
            return;
        }

        const assets = await prisma.asset.findMany({
            where: { id: { in: assetIds }, userId: req.userId! },
        });

        if (assets.length !== assetIds.length) {
            res.status(400).json({ error: 'One or more assets not found' });
            return;
        }

        const sessionCount = await prisma.generationSession.count({
            where: { userId: req.userId! },
        });

        const session = await prisma.generationSession.create({
            data: {
                name: name ?? null,
                index: sessionCount,
                durationMs,
                fadeInMs: fadeInMs ?? 0,
                fadeOutMs: fadeOutMs ?? 0,
                audioId,
                presetId,
                userId: req.userId!,
                assets: {
                    create: assetIds.map((assetId) => ({ assetId })),
                },
            },
            include: {
                audio: true,
                assets: { include: { asset: true } },
            },
        });

        res.status(201).json(session);
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const session = await prisma.generationSession.findFirst({
            where: { id: String(req.params.id), userId: req.userId! },
            include: {
                audio: true,
                assets: { include: { asset: true } },
                videos: { orderBy: { createdAt: 'desc' } },
            },
        });

        if (!session) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        const videosWithUrls = session.videos.map((v) => ({
            ...v,
            videoUrl:
                v.videoUrl && v.status === 'COMPLETED'
                    ? generateSignedUrl(v.videoUrl, req.userId!, 24 * 3600)
                    : null,
            thumbnailUrl:
                v.thumbnailUrl && v.status === 'COMPLETED'
                    ? generateSignedUrl(v.thumbnailUrl, req.userId!, 24 * 3600)
                    : null,
        }));

        res.json({ ...session, videos: videosWithUrls });
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.body as { name: string };

        const session = await prisma.generationSession.findFirst({
            where: { id: String(req.params.id), userId: req.userId! },
        });

        if (!session) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        const updated = await prisma.generationSession.update({
            where: { id: String(req.params.id) },
            data: { name: name ?? null },
        });

        res.json(updated);
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const session = await prisma.generationSession.findFirst({
            where: { id: String(req.params.id), userId: req.userId! },
        });

        if (!session) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        await prisma.generationSession.delete({ where: { id: String(req.params.id) } });

        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:id/generate', async (req: AuthRequest, res: Response) => {
    try {
        const { phrases } = req.body as { phrases: string[] };

        if (!phrases?.length) {
            res.status(400).json({ error: 'phrases array is required and must not be empty' });
            return;
        }

        const session = await prisma.generationSession.findFirst({
            where: { id: String(req.params.id), userId: req.userId! },
            include: {
                audio: true,
                assets: { include: { asset: true } },
                preset: true,
            },
        });

        if (!session) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        if (!session.audio) {
            res.status(400).json({ error: 'Session audio has been deleted' });
            return;
        }

        if (!session.assets.length) {
            res.status(400).json({ error: 'Session has no assets' });
            return;
        }

        const audioStorageKey = `audio/${session.audio.filename}`;
        const sourceAudioUrl = generateSignedUrl(audioStorageKey, req.userId!, 24 * 3600);

        const shuffledAssets = [...session.assets].sort(() => Math.random() - 0.5);

        const limitedPhrases = phrases.slice(0, shuffledAssets.length);

        const jobs = [];
        for (let index = 0; index < limitedPhrases.length; index++) {
            const phrase = limitedPhrases[index];
            const randomAsset = shuffledAssets[index].asset;
            const sourceImageUrl = generateSignedUrl(
                randomAsset.storageKey,
                req.userId!,
                24 * 3600,
            );

            const job = await prisma.video.create({
                data: {
                    title: phrase,
                    phrase,
                    status: 'QUEUED',
                    sessionId: session.id,
                    presetId: session.presetId,
                    assetId: randomAsset.id,
                    sourceImageUrl,
                    audioId: session.audioId,
                    sourceAudioUrl,
                    durationMs: session.durationMs,
                    fadeInMs: session.fadeInMs,
                    fadeOutMs: session.fadeOutMs,
                    userId: req.userId!,
                },
            });
            jobs.push(job);
        }

        await triggerBatchVideoGeneration(jobs.map((job) => job.id));

        res.status(201).json({ jobs });
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
