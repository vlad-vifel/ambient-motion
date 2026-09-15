import { Response, Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { generateSignedUrl } from '../lib/s3';
import { applyVideoSignedUrls } from './utils';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { triggerBatchVideoGeneration } from '../generator/dispatch';
import { getPresetDefinition, hasPresetDefinition } from '../presets/registry';
import { PresetAssetSource } from '../presets/types';

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

        const statusCounts = sessions.length
            ? await prisma.video.groupBy({
                  by: ['sessionId', 'status'],
                  where: {
                      sessionId: { in: sessions.map((session) => session.id) },
                      status: { not: 'DRAFT' },
                  },
                  _count: true,
              })
            : [];
        const trackCounts = sessions.length
            ? await prisma.video.groupBy({
                  by: ['sessionId'],
                  where: { sessionId: { in: sessions.map((session) => session.id) } },
                  _count: true,
              })
            : [];
        const trackCountBySession = new Map(
            trackCounts
                .filter((count) => count.sessionId)
                .map((count) => [count.sessionId!, count._count]),
        );
        const countsBySession = new Map<string, Map<string, number>>();
        for (const count of statusCounts) {
            if (!count.sessionId) continue;
            const counts = countsBySession.get(count.sessionId) ?? new Map<string, number>();
            counts.set(count.status, count._count);
            countsBySession.set(count.sessionId, counts);
        }

        const result = sessions.map((s) => {
            const counts = countsBySession.get(s.id);
            const videoCounts = {
                queued: counts?.get('QUEUED') ?? 0,
                generating: counts?.get('GENERATING') ?? 0,
                completed: counts?.get('COMPLETED') ?? 0,
                failed: counts?.get('FAILED') ?? 0,
            };
            return { ...s, trackCount: trackCountBySession.get(s.id) ?? 0, videoCounts };
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

        if (
            (!audioId && !noAudio) ||
            !assetIds?.length ||
            durationMs == null ||
            !presetId ||
            !hasPresetDefinition(presetId)
        ) {
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
            presetId?: string | null;
            entries?: {
                phrase: string;
                choiceLeft?: string | null;
                choiceRight?: string | null;
                assetId?: string | null;
                settings?: unknown;
                audioId?: string;
                trimStartMs?: number;
                trimEndMs?: number;
                audioFadeInMs?: number;
                audioFadeOutMs?: number;
            }[];
        };

        if (presetId != null && !hasPresetDefinition(presetId)) {
            res.status(400).json({ error: 'Invalid presetId' });
            return;
        }
        const preset = presetId ? getPresetDefinition(presetId) : null;
        const usesDedicatedAssetSource = preset?.assetSource === PresetAssetSource.AudioCover;
        if (!usesDedicatedAssetSource && durationMs == null) {
            res.status(400).json({ error: 'presetId and durationMs are required' });
            return;
        }

        const ids = usesDedicatedAssetSource ? [] : (assetIds ?? []);
        if (ids.length) {
            const owned = await prisma.asset.count({
                where: { id: { in: ids }, userId: req.userId! },
            });
            if (owned !== ids.length) {
                res.status(400).json({ error: 'One or more assets not found' });
                return;
            }
        }

        if (!usesDedicatedAssetSource && !noAudio && audioId) {
            const audio = await prisma.audio.findFirst({
                where: { id: audioId, userId: req.userId! },
            });
            if (!audio) {
                res.status(404).json({ error: 'Audio not found' });
                return;
            }
        }

        const phraseEntries = entries ?? [];
        if (!preset && phraseEntries.length) {
            res.status(400).json({ error: 'presetId is required when entries are provided' });
            return;
        }
        let draftVideosData: Prisma.VideoCreateManyInput[];
        if (preset?.workflow?.prepareDraft) {
            const result = await preset.workflow.prepareDraft(phraseEntries, req.userId!);
            if (!result.ok) {
                res.status(400).json({ error: result.error });
                return;
            }
            draftVideosData = result.videos;
        } else {
            const validEntryAssetIds = new Set(ids);
            draftVideosData = phraseEntries.map((entry) => ({
                title: entry.phrase,
                phrase: entry.phrase,
                choiceLeft: entry.choiceLeft ?? null,
                choiceRight: entry.choiceRight ?? null,
                settings: (entry.settings ?? undefined) as Prisma.InputJsonValue | undefined,
                status: 'DRAFT',
                presetId: presetId as string,
                assetId:
                    entry.assetId && validEntryAssetIds.has(entry.assetId) ? entry.assetId : null,
                sourceImageUrl: '',
                audioId: noAudio ? null : (audioId ?? null),
                noAudio: noAudio ?? false,
                sourceAudioUrl: '',
                durationMs,
                fadeInMs: fadeInMs ?? 0,
                fadeOutMs: fadeOutMs ?? 0,
                userId: req.userId!,
            }));
        }

        const sessionData = {
            name: name ?? null,
            durationMs: usesDedicatedAssetSource ? null : durationMs,
            fadeInMs: usesDedicatedAssetSource ? null : (fadeInMs ?? 0),
            fadeOutMs: usesDedicatedAssetSource ? null : (fadeOutMs ?? 0),
            assetSource: assetSource ?? null,
            autoAssign: autoAssign ?? false,
            audioId: usesDedicatedAssetSource ? null : noAudio ? null : (audioId ?? null),
            noAudio: usesDedicatedAssetSource ? false : (noAudio ?? false),
            presetId: presetId ?? null,
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
                        audio: {
                            select: {
                                id: true,
                                title: true,
                                artist: true,
                                coverUrl: true,
                                duration: true,
                                filename: true,
                                sourceType: true,
                                sourceUrl: true,
                            },
                        },
                        preset: { select: { id: true, name: true, component: true, format: true } },
                    },
                },
            },
        });

        if (!session) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        const videosWithUrls = session.videos.map((v) => applyVideoSignedUrls(v, req.userId!));

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

        if (!session.preset || !session.presetId) {
            res.status(400).json({ error: 'Select a preset before generating videos' });
            return;
        }

        const preset = getPresetDefinition(session.preset.id);
        const sessionPresetId = session.presetId;
        if (preset.workflow?.queueSession) {
            const result = await preset.workflow.queueSession(
                session.id,
                req.userId!,
                session.isDraft,
            );
            if (!result.ok) {
                res.status(400).json({ error: result.error });
                return;
            }
            res.status(201).json({ jobs: result.jobs });
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
                    presetId: sessionPresetId,
                    assetId: assetRecord.id,
                    sourceImageUrl,
                    audioId: session.audioId,
                    noAudio: session.noAudio,
                    sourceAudioUrl,
                    durationMs: session.durationMs ?? 30000,
                    fadeInMs: session.fadeInMs ?? 0,
                    fadeOutMs: session.fadeOutMs ?? 0,
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
