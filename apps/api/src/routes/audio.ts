import { parseBuffer } from 'music-metadata';
import { Response, Router } from 'express';
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

async function cropCoverToSquare(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
        .resize({ width: 400, height: 400, fit: 'cover', position: 'center' })
        .jpeg({ quality: 85 })
        .toBuffer();
}

async function getDurationFromBuffer(buffer: Buffer): Promise<number> {
    try {
        console.log(`[Audio] Attempting to parse duration with music-metadata`);
        const meta = await parseBuffer(buffer);
        const durationSec = meta.format.duration ?? 0;
        if (durationSec > 0) {
            return Math.round(durationSec * 1000);
        }
    } catch (err) {
        console.warn(`[Audio] music-metadata failed:`, err);
    }

    return 0;
}

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
        const durationMs = await getDurationFromBuffer(audioFile.buffer);
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
            const cropped = await cropCoverToSquare(coverFile.buffer);
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
