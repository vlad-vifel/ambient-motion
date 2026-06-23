import { Response, Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { deleteFile, generateSignedUrl } from '../lib/s3';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { VIDEO_PRESETS } from '../remotion/presets';
import { triggerVideoGeneration } from '../generator/dispatch';

const router = Router();
router.use(requireAuth);

function applySignedUrls(
    video: {
        status: string;
        videoUrl: string | null;
        thumbnailUrl: string | null;
        [key: string]: unknown;
    },
    userId: string,
) {
    return {
        ...video,
        videoUrl:
            video.videoUrl && video.status === 'COMPLETED'
                ? generateSignedUrl(video.videoUrl, userId, 24 * 3600)
                : null,
        thumbnailUrl:
            video.thumbnailUrl && video.status === 'COMPLETED'
                ? generateSignedUrl(video.thumbnailUrl, userId, 24 * 3600)
                : null,
    };
}

router.get('/presets', (_req, res: Response) => {
    const presets = Object.entries(VIDEO_PRESETS).map(([id, p]) => ({
        id,
        label: id === 'square_1080' ? '1:1 Square (1080×1080)' : '9:16 Vertical (1080×1920)',
        ...p,
    }));
    res.json(presets);
});

router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const videos = await prisma.video.findMany({
            where: { userId: req.userId!, status: { not: 'DRAFT' } },
            orderBy: { createdAt: 'desc' },
            include: {
                session: { select: { id: true, name: true } },
                asset: { select: { id: true, url: true, filename: true } },
                preset: { select: { id: true, name: true, component: true, format: true } },
            },
        });

        res.json(videos.map((v) => applySignedUrls(v, req.userId!)));
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const video = await prisma.video.findFirst({
            where: { id: String(req.params.id), userId: req.userId! },
            include: {
                session: { select: { id: true, name: true } },
                asset: { select: { id: true, url: true, filename: true } },
                preset: { select: { id: true, name: true, component: true, format: true } },
            },
        });

        if (!video) {
            res.status(404).json({ error: 'Video not found' });
            return;
        }

        res.json(applySignedUrls(video, req.userId!));
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id/download', async (req: AuthRequest, res: Response) => {
    try {
        const video = await prisma.video.findFirst({
            where: { id: String(req.params.id), userId: req.userId! },
        });

        if (!video || !video.videoUrl || video.status !== 'COMPLETED') {
            res.status(404).json({ error: 'Video not found or not ready' });
            return;
        }

        const signedUrl = generateSignedUrl(video.videoUrl, req.userId!, 300);
        const upstream = await fetch(signedUrl);

        if (!upstream.ok) {
            res.status(502).json({ error: 'Failed to fetch video from storage' });
            return;
        }

        const filename = `${(video.phrase || 'video').replace(/[^a-z0-9 ]/gi, '')}.mp4`;
        res.set('Content-Type', 'video/mp4');
        res.set('Content-Disposition', `attachment; filename="${filename}"`);

        if (upstream.headers.get('content-length')) {
            res.set('Content-Length', upstream.headers.get('content-length')!);
        }

        const { Readable } = await import('node:stream');
        Readable.fromWeb(upstream.body as import('stream/web').ReadableStream).pipe(res);
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { phrase, assetId, choiceLeft, choiceRight, settings } = req.body as {
            phrase?: string;
            assetId?: string;
            choiceLeft?: string;
            choiceRight?: string;
            settings?: unknown;
        };

        if (
            !phrase?.trim() &&
            !assetId &&
            choiceLeft == null &&
            choiceRight == null &&
            settings === undefined
        ) {
            res.status(400).json({ error: 'at least one field to update is required' });
            return;
        }

        const video = await prisma.video.findFirst({
            where: { id: String(req.params.id), userId: req.userId! },
            include: { preset: true, asset: true, audio: true },
        });

        if (!video) {
            res.status(404).json({ error: 'Video not found' });
            return;
        }

        const newPhrase = phrase?.trim() ?? video.phrase;
        const newAssetId = assetId ?? video.assetId;
        const newChoiceLeft =
            choiceLeft !== undefined ? choiceLeft.trim() || null : video.choiceLeft;
        const newChoiceRight =
            choiceRight !== undefined ? choiceRight.trim() || null : video.choiceRight;
        const newSettings = settings !== undefined ? settings : video.settings;

        const settingsChanged =
            settings !== undefined && JSON.stringify(settings) !== JSON.stringify(video.settings);

        if (
            newPhrase === video.phrase &&
            newAssetId === video.assetId &&
            newChoiceLeft === video.choiceLeft &&
            newChoiceRight === video.choiceRight &&
            !settingsChanged
        ) {
            res.status(400).json({ error: 'No changes detected' });
            return;
        }

        let assetRecord = video.asset!;
        if (assetId && assetId !== video.assetId) {
            const found = await prisma.asset.findFirst({
                where: { id: assetId, userId: req.userId! },
            });
            if (!found) {
                res.status(404).json({ error: 'Asset not found' });
                return;
            }
            assetRecord = found;
        }

        if (video.videoUrl) await deleteFile(video.videoUrl, req.userId!);
        if (video.thumbnailUrl) await deleteFile(video.thumbnailUrl, req.userId!);

        const sourceImageUrl = generateSignedUrl(assetRecord.storageKey, req.userId!, 24 * 3600);
        const sourceAudioUrl = video.audio
            ? generateSignedUrl(`audio/${video.audio.filename}`, req.userId!, 24 * 3600)
            : '';

        const updated = await prisma.video.update({
            where: { id: String(req.params.id) },
            data: {
                phrase: newPhrase,
                choiceLeft: newChoiceLeft,
                choiceRight: newChoiceRight,
                settings: (newSettings ?? Prisma.JsonNull) as
                    | Prisma.InputJsonValue
                    | typeof Prisma.JsonNull,
                assetId: newAssetId,
                status: 'QUEUED',
                videoUrl: null,
                thumbnailUrl: null,
                startedAt: null,
                completedAt: null,
                errorMessage: null,
                sourceImageUrl,
                sourceAudioUrl,
            },
        });

        await triggerVideoGeneration({
            videoId: updated.id,
            phrase: updated.phrase,
            presetComponent: video.preset.component,
            sourceImageUrl,
            sourceAudioUrl,
            durationMs: updated.durationMs,
            fadeInMs: updated.fadeInMs,
            fadeOutMs: updated.fadeOutMs,
            settings: updated.settings ?? undefined,
            userId: updated.userId,
        });

        res.json(updated);
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

        if (video.videoUrl) await deleteFile(video.videoUrl, req.userId!);
        if (video.thumbnailUrl) await deleteFile(video.thumbnailUrl, req.userId!);

        await prisma.video.delete({ where: { id: String(req.params.id) } });
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
