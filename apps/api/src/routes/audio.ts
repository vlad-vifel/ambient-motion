import { parseBuffer } from 'music-metadata';
import { Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import sharp from 'sharp';
import { prisma } from '../lib/prisma';
import { deleteFile, uploadFile } from '../lib/s3';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
    { name: 'file', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
]);

type UploadedFiles = { [fieldname: string]: Express.Multer.File[] };

async function cropCoverToSquare(buffer: Buffer, size = 400, quality = 85): Promise<Buffer> {
    return sharp(buffer)
        .resize({
            width: size,
            height: size,
            fit: 'cover',
            position: 'center',
            withoutEnlargement: true,
        })
        .jpeg({ quality })
        .toBuffer();
}

async function getDurationFromBuffer(
    buffer: Buffer,
    mimeType: string = 'audio/mpeg',
): Promise<number> {
    try {
        console.log(`[Audio] Attempting to parse duration with music-metadata`);
        const meta = await parseBuffer(buffer, { mimeType }, { duration: true });
        const durationSec = meta.format.duration ?? 0;
        console.log(
            `[Audio] Parsed duration: ${durationSec}s, format: ${meta.format.container}, codec: ${meta.format.codec}`,
        );
        if (durationSec > 0) {
            return Math.round(durationSec * 1000);
        }
    } catch (err) {
        console.error(`[Audio] music-metadata failed:`, err);
    }

    return 0;
}

type SpotifyLookupToken = {
    userId: string;
    trackId: string;
    sourceUrl: string;
    title: string;
    artist: string;
    durationMs: number;
    artworkUrl?: string;
};

function spotifyTrackId(value: string): string | null {
    const urlMatch = value.match(
        /^https?:\/\/open\.spotify\.com\/track\/([A-Za-z0-9]{22})(?:[/?].*)?$/,
    );
    if (urlMatch) return urlMatch[1];
    const uriMatch = value.match(/^spotify:track:([A-Za-z0-9]{22})$/);
    return uriMatch?.[1] ?? null;
}

function normalize(value: string): string {
    return value
        .normalize('NFKD')
        .toLowerCase()
        .replace(/[\p{P}\p{S}]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

async function findAppleArtwork(
    title: string,
    artist: string,
    durationMs: number,
): Promise<string | null> {
    const term = encodeURIComponent(`${title} ${artist}`);
    const response = await fetch(
        `https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=10`,
        { signal: AbortSignal.timeout(8000) },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as {
        results?: {
            trackName?: string;
            artistName?: string;
            trackTimeMillis?: number;
            artworkUrl100?: string;
        }[];
    };
    const targetTitle = normalize(title);
    const targetArtist = normalize(artist);
    const match = (data.results ?? [])
        .filter((item) => {
            const titleMatch = normalize(item.trackName ?? '') === targetTitle;
            const artistMatch = normalize(item.artistName ?? '').includes(targetArtist);
            const durationMatch = Math.abs((item.trackTimeMillis ?? 0) - durationMs) <= 3000;
            return titleMatch && artistMatch && durationMatch && !!item.artworkUrl100;
        })
        .sort(
            (a, b) =>
                Math.abs((a.trackTimeMillis ?? 0) - durationMs) -
                Math.abs((b.trackTimeMillis ?? 0) - durationMs),
        )[0];
    if (!match?.artworkUrl100) return null;
    return match.artworkUrl100.replace(/\d+x\d+bb/, '3000x3000bb');
}

async function fetchArtwork(url: string): Promise<Buffer> {
    const parsed = new URL(url);
    if (parsed.hostname !== 'mzstatic.com' && !parsed.hostname.endsWith('.mzstatic.com')) {
        throw new Error('Invalid artwork source');
    }
    const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error('Unable to download artwork');
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > 15 * 1024 * 1024) throw new Error('Artwork is too large');
    const buffer = Buffer.from(arrayBuffer);
    const meta = await sharp(buffer).metadata();
    if (!meta.width || !meta.height || Math.min(meta.width, meta.height) < 1000) {
        throw new Error('Artwork is not high resolution');
    }
    return buffer;
}

router.post('/spotify/lookup', async (req: AuthRequest, res: Response) => {
    try {
        const trackId = spotifyTrackId(String(req.body?.sourceUrl ?? '').trim());
        if (!trackId) {
            res.status(400).json({ error: 'Enter a valid Spotify track link' });
            return;
        }
        const response = await fetch(`https://open.spotify.com/embed/track/${trackId}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) {
            res.status(response.status === 404 ? 404 : 502).json({
                error: 'Spotify track was not found',
            });
            return;
        }
        const page = await response.text();
        const nextData = page.match(
            /<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/,
        )?.[1];
        if (!nextData) throw new Error('Spotify track metadata is unavailable');
        const entity = (
            JSON.parse(nextData) as {
                props?: {
                    pageProps?: {
                        state?: {
                            data?: {
                                entity?: {
                                    title?: string;
                                    name?: string;
                                    duration?: number;
                                    artists?: { name?: string }[];
                                };
                            };
                        };
                    };
                };
            }
        ).props?.pageProps?.state?.data?.entity;
        const title = entity?.title ?? entity?.name;
        const artist = entity?.artists?.[0]?.name ?? '';
        const durationMs = entity?.duration;
        if (!title || !artist || !durationMs)
            throw new Error('Spotify track metadata is incomplete');
        const artworkUrl = await findAppleArtwork(title, artist, durationMs);
        const payload: SpotifyLookupToken = {
            userId: req.userId!,
            trackId,
            sourceUrl: `https://open.spotify.com/track/${trackId}`,
            title,
            artist,
            durationMs,
            artworkUrl: artworkUrl ?? undefined,
        };
        const lookupToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' });
        res.json({
            lookupToken,
            track: payload,
            cover: artworkUrl
                ? { url: artworkUrl, requiresManualUpload: false }
                : { url: null, requiresManualUpload: true },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Spotify lookup failed';
        res.status(502).json({ error: message });
    }
});

router.post('/spotify', upload, async (req: AuthRequest, res: Response) => {
    try {
        const files = req.files as UploadedFiles;
        const audioFile = files['file']?.[0];
        const manualCover = files['cover']?.[0];
        if (!audioFile || !req.body.lookupToken) {
            res.status(400).json({ error: 'Spotify lookup and MP3 file are required' });
            return;
        }
        if (
            !audioFile.originalname.toLowerCase().endsWith('.mp3') ||
            !['audio/mpeg', 'audio/mp3'].includes(audioFile.mimetype)
        ) {
            res.status(400).json({ error: 'Only MP3 files are supported for Spotify tracks' });
            return;
        }
        const lookup = jwt.verify(
            req.body.lookupToken,
            process.env.JWT_SECRET!,
        ) as SpotifyLookupToken;
        if (lookup.userId !== req.userId!) {
            res.status(403).json({ error: 'Invalid Spotify import token' });
            return;
        }
        const durationMs = await getDurationFromBuffer(audioFile.buffer, audioFile.mimetype);
        if (!durationMs || Math.abs(durationMs - lookup.durationMs) > 3000) {
            res.status(400).json({
                error: 'MP3 duration must match the Spotify track within 3 seconds',
            });
            return;
        }
        const title = String(req.body.title ?? lookup.title).trim() || lookup.title;
        const artist = String(req.body.artist ?? lookup.artist).trim() || lookup.artist;
        if (title.length > 200 || artist.length > 200) {
            res.status(400).json({ error: 'Title and artist must be 200 characters or fewer' });
            return;
        }
        let coverSource: Buffer;
        if (manualCover) {
            const meta = await sharp(manualCover.buffer).metadata();
            if (!meta.width || !meta.height || Math.min(meta.width, meta.height) < 1000) {
                res.status(400).json({
                    error: 'Manual cover must be at least 1000px on each side',
                });
                return;
            }
            coverSource = manualCover.buffer;
        } else if (lookup.artworkUrl) {
            coverSource = await fetchArtwork(lookup.artworkUrl);
        } else {
            res.status(400).json({ error: 'Upload a high-resolution cover for this track' });
            return;
        }
        const filename = `${Date.now()}-${audioFile.originalname}`;
        const coverFilename = `${Date.now()}-spotify-cover.jpg`;
        const [url, coverUrl] = await Promise.all([
            uploadFile(`audio/${filename}`, audioFile.buffer, 'audio/mpeg', req.userId!),
            uploadFile(
                `covers/${coverFilename}`,
                await cropCoverToSquare(coverSource, 3000, 92),
                'image/jpeg',
                req.userId!,
            ),
        ]);
        const audio = await prisma.audio.create({
            data: {
                title,
                artist,
                filename,
                url,
                coverFilename,
                coverUrl,
                duration: durationMs,
                sourceType: 'SPOTIFY',
                sourceUrl: lookup.sourceUrl,
                externalTrackId: lookup.trackId,
                externalDurationMs: lookup.durationMs,
                userId: req.userId!,
            },
        });
        res.status(201).json(audio);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Spotify import failed';
        res.status(400).json({ error: message });
    }
});

router.post('/', upload, async (req: AuthRequest, res: Response) => {
    try {
        const files = req.files as UploadedFiles;
        const audioFile = files['file']?.[0];
        const coverFile = files['cover']?.[0];

        if (!audioFile) {
            res.status(400).json({ error: 'No audio file provided' });
            return;
        }

        const filename = `${Date.now()}-${audioFile.originalname}`;
        const url = await uploadFile(
            `audio/${filename}`,
            audioFile.buffer,
            audioFile.mimetype,
            req.userId!,
        );

        let coverUrl: string | undefined;
        let coverFilename: string | undefined;

        if (coverFile) {
            const cropped = await cropCoverToSquare(coverFile.buffer);
            coverFilename = `${Date.now()}-cover.jpg`;
            coverUrl = await uploadFile(
                `covers/${coverFilename}`,
                cropped,
                'image/jpeg',
                req.userId!,
            );
        }

        const title = req.body.title || audioFile.originalname.replace(/\.[^/.]+$/, '');
        const artist = req.body.artist || '';

        console.log(`[Audio] Getting duration for ${audioFile.originalname}`);
        const durationMs = await getDurationFromBuffer(audioFile.buffer, audioFile.mimetype);
        console.log(`[Audio] Duration: ${durationMs}ms (${(durationMs / 1000).toFixed(1)}s)`);

        const audio = await prisma.audio.create({
            data: {
                title,
                artist,
                filename,
                url,
                coverFilename,
                coverUrl: coverUrl ?? null,
                duration: durationMs,
                userId: req.userId!,
            },
        });

        res.status(201).json(audio);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const audios = await prisma.audio.findMany({
            where: { userId: req.userId! },
            orderBy: { uploadedAt: 'desc' },
        });
        res.json(audios);
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/:id', upload, async (req: AuthRequest, res: Response) => {
    try {
        const files = req.files as UploadedFiles;
        const coverFile = files?.['cover']?.[0];

        const audio = await prisma.audio.findFirst({
            where: { id: String(req.params.id), userId: req.userId! },
        });
        if (!audio) {
            res.status(404).json({ error: 'Audio not found' });
            return;
        }

        const data: { [key: string]: unknown } = {};
        if (req.body.title !== undefined) data.title = req.body.title;
        if (req.body.artist !== undefined) data.artist = req.body.artist;

        if (coverFile) {
            if (audio.coverFilename) await deleteFile(`covers/${audio.coverFilename}`, req.userId!);
            const cropped = await cropCoverToSquare(
                coverFile.buffer,
                audio.sourceType === 'SPOTIFY' ? 3000 : 400,
                audio.sourceType === 'SPOTIFY' ? 92 : 85,
            );
            const coverFilename = `${Date.now()}-cover.jpg`;
            const coverUrl = await uploadFile(
                `covers/${coverFilename}`,
                cropped,
                'image/jpeg',
                req.userId!,
            );
            data.coverFilename = coverFilename;
            data.coverUrl = coverUrl;
        } else if (req.body.removeCover === 'true' && audio.coverFilename) {
            await deleteFile(`covers/${audio.coverFilename}`, req.userId!);
            data.coverFilename = null;
            data.coverUrl = null;
        }

        const updated = await prisma.audio.update({
            where: { id: String(req.params.id) },
            data,
        });
        res.json(updated);
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const audio = await prisma.audio.findFirst({
            where: { id: String(req.params.id), userId: req.userId! },
        });
        if (!audio) {
            res.status(404).json({ error: 'Audio not found' });
            return;
        }

        await deleteFile(`audio/${audio.filename}`, req.userId!);
        if (audio.coverFilename) await deleteFile(`covers/${audio.coverFilename}`, req.userId!);
        await prisma.audio.delete({ where: { id: String(req.params.id) } });

        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
