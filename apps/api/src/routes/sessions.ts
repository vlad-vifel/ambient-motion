import { Response, Router } from 'express';
import { Prisma } from '@prisma/client';
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
                preset: { select: { id: true, name: true, component: true, format: true } },
                _count: { select: { videos: { where: { status: { not: 'DRAFT' } } } } },
            },
        });

        const statusCounts = await Promise.all(
            sessions.map(async (s) => {
                const counts = await prisma.video.groupBy({
                    by: ['status'],
                    where: { sessionId: s.id, status: { not: 'DRAFT' } },
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
        const { name, audioId, noAudio, assetIds, durationMs, fadeInMs, fadeOutMs, presetId } =
            req.body as {
                name?: string;
                audioId?: string;
                noAudio?: boolean;
                assetIds: string[];
                durationMs: number;
                fadeInMs?: number;
                fadeOutMs?: number;
                presetId: string;
            };

        if ((!audioId && !noAudio) || !assetIds?.length || durationMs == null || !presetId) {
            res.status(400).json({
                error: 'audioId (or noAudio), assetIds, durationMs and presetId are required',
            });
            return;
        }

        if (!noAudio) {
            const audio = await prisma.audio.findFirst({
                where: { id: audioId, userId: req.userId! },
            });
            if (!audio) {
                res.status(404).json({ error: 'Audio not found' });
                return;
            }
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
                audioId: noAudio ? null : audioId,
                noAudio: noAudio ?? false,
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

router.post('/draft', async (req: AuthRequest, res: Response) => {
    try {
        const {
            id,
            name,
            audioId,
            noAudio,
            assetIds,
            assetSource,
            autoAssign,
            durationMs,
            fadeInMs,
            fadeOutMs,
            presetId,
            entries,
        } = req.body as {
            id?: string;
            name?: string;
            audioId?: string;
            noAudio?: boolean;
            assetIds?: string[];
            assetSource?: string;
            autoAssign?: boolean;
            durationMs: number;
            fadeInMs?: number;
            fadeOutMs?: number;
            presetId: string;
            entries?: {
                phrase: string;
                choiceLeft?: string | null;
                choiceRight?: string | null;
                assetId?: string | null;
                settings?: unknown;
            }[];
        };

        if (!presetId || durationMs == null) {
            res.status(400).json({ error: 'presetId and durationMs are required' });
            return;
        }

        const ids = assetIds ?? [];
        if (ids.length) {
            const owned = await prisma.asset.count({
                where: { id: { in: ids }, userId: req.userId! },
            });
            if (owned !== ids.length) {
                res.status(400).json({ error: 'One or more assets not found' });
                return;
            }
        }

        if (!noAudio && audioId) {
            const audio = await prisma.audio.findFirst({
                where: { id: audioId, userId: req.userId! },
            });
            if (!audio) {
                res.status(404).json({ error: 'Audio not found' });
                return;
            }
        }

        const phraseEntries = entries ?? [];
        const validEntryAssetIds = new Set(ids);
        const draftVideosData = phraseEntries.map((e) => ({
            title: e.phrase,
            phrase: e.phrase,
            choiceLeft: e.choiceLeft ?? null,
            choiceRight: e.choiceRight ?? null,
            settings: (e.settings ?? undefined) as Prisma.InputJsonValue | undefined,
            status: 'DRAFT' as const,
            presetId,
            assetId: e.assetId && validEntryAssetIds.has(e.assetId) ? e.assetId : null,
            sourceImageUrl: '',
            audioId: noAudio ? null : (audioId ?? null),
            noAudio: noAudio ?? false,
            sourceAudioUrl: '',
            durationMs,
            fadeInMs: fadeInMs ?? 0,
            fadeOutMs: fadeOutMs ?? 0,
            userId: req.userId!,
        }));

        const sessionData = {
            name: name ?? null,
            durationMs,
            fadeInMs: fadeInMs ?? 0,
            fadeOutMs: fadeOutMs ?? 0,
            assetSource: assetSource ?? null,
            autoAssign: autoAssign ?? false,
            audioId: noAudio ? null : (audioId ?? null),
            noAudio: noAudio ?? false,
            presetId,
        };

        let sessionId = id;

        if (sessionId) {
            const existing = await prisma.generationSession.findFirst({
                where: { id: sessionId, userId: req.userId!, isDraft: true },
            });
            if (!existing) {
                res.status(404).json({ error: 'Draft not found' });
                return;
            }
            await prisma.$transaction([
                prisma.generationSession.update({
                    where: { id: sessionId },
                    data: sessionData,
                }),
                prisma.sessionAsset.deleteMany({ where: { sessionId } }),
                ...(ids.length
                    ? [
                          prisma.sessionAsset.createMany({
                              data: ids.map((assetId) => ({ sessionId: sessionId!, assetId })),
                          }),
                      ]
                    : []),
                prisma.video.deleteMany({ where: { sessionId, status: 'DRAFT' } }),
                ...(draftVideosData.length
                    ? [
                          prisma.video.createMany({
                              data: draftVideosData.map((v) => ({ ...v, sessionId: sessionId! })),
                          }),
                      ]
                    : []),
            ]);
        } else {
            const sessionCount = await prisma.generationSession.count({
                where: { userId: req.userId! },
            });
            const created = await prisma.generationSession.create({
                data: {
                    ...sessionData,
                    index: sessionCount,
                    isDraft: true,
                    userId: req.userId!,
                    assets: { create: ids.map((assetId) => ({ assetId })) },
                    videos: { create: draftVideosData },
                },
            });
            sessionId = created.id;
        }

        const session = await prisma.generationSession.findFirst({
            where: { id: sessionId },
            include: {
                audio: {
                    select: { id: true, title: true, artist: true, coverUrl: true, duration: true },
                },
                preset: { select: { id: true, name: true, component: true, format: true } },
            },
        });

        res.status(id ? 200 : 201).json(session);
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
                preset: { select: { id: true, name: true, component: true, format: true } },
                videos: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        asset: { select: { id: true, url: true, filename: true } },
                        preset: { select: { id: true, name: true, component: true, format: true } },
                    },
                },
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
        const rawPhrases = req.body.phrases as (
            | string
            | {
                  phrase: string;
                  choiceLeft?: string | null;
                  choiceRight?: string | null;
                  assetId?: string | null;
                  settings?: unknown;
              }
        )[];

        if (!rawPhrases?.length) {
            res.status(400).json({ error: 'phrases array is required and must not be empty' });
            return;
        }

        const phraseInputs = rawPhrases.map((p) =>
            typeof p === 'string'
                ? { phrase: p, choiceLeft: null, choiceRight: null, assetId: null, settings: null }
                : p,
        );

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

        if (!session.noAudio && !session.audio) {
            res.status(400).json({ error: 'Session audio has been deleted' });
            return;
        }

        if (!session.assets.length) {
            res.status(400).json({ error: 'Session has no assets' });
            return;
        }

        await prisma.video.deleteMany({ where: { sessionId: session.id, status: 'DRAFT' } });
        if (session.isDraft) {
            await prisma.generationSession.update({
                where: { id: session.id },
                data: { isDraft: false },
            });
        }

        const sourceAudioUrl = session.audio
            ? generateSignedUrl(`audio/${session.audio.filename}`, req.userId!, 24 * 3600)
            : '';

        const shuffledAssets = [...session.assets].sort(() => Math.random() - 0.5);

        const specificIds = [
            ...new Set(phraseInputs.filter((p) => p.assetId).map((p) => p.assetId!)),
        ];
        const specificAssetsData =
            specificIds.length > 0
                ? await prisma.asset.findMany({
                      where: { id: { in: specificIds }, userId: req.userId! },
                  })
                : [];
        const assetMap = new Map(specificAssetsData.map((a) => [a.id, a]));

        const jobs = [];
        let shuffleIdx = 0;

        for (const { phrase, choiceLeft, choiceRight, assetId, settings } of phraseInputs) {
            let assetRecord;
            if (assetId) {
                assetRecord = assetMap.get(assetId);
                if (!assetRecord) continue;
            } else {
                if (shuffleIdx >= shuffledAssets.length) continue;
                assetRecord = shuffledAssets[shuffleIdx].asset;
                shuffleIdx++;
            }

            const sourceImageUrl = generateSignedUrl(
                assetRecord.storageKey,
                req.userId!,
                24 * 3600,
            );

            const job = await prisma.video.create({
                data: {
                    title: phrase,
                    phrase,
                    choiceLeft: choiceLeft ?? null,
                    choiceRight: choiceRight ?? null,
                    settings: (settings ?? undefined) as Prisma.InputJsonValue | undefined,
                    status: 'QUEUED',
                    sessionId: session.id,
                    presetId: session.presetId,
                    assetId: assetRecord.id,
                    sourceImageUrl,
                    audioId: session.audioId,
                    noAudio: session.noAudio,
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
