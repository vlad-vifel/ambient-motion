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

router.post('/', upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file provided' });
            return;
        }

        const filename = `${Date.now()}-${req.file.originalname}`;
        const url = await uploadFile(
            `photos/${filename}`,
            req.file.buffer,
            req.file.mimetype,
            req.userId!,
        );

        const photo = await prisma.photo.create({
            data: {
                filename,
                url,
                userId: req.userId!,
            },
        });

        res.status(201).json(photo);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const photos = await prisma.photo.findMany({
            where: { userId: req.userId! },
            orderBy: { uploadedAt: 'desc' },
        });
        res.json(photos);
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const photo = await prisma.photo.findFirst({
            where: { id: String(req.params.id), userId: req.userId! },
        });
        if (!photo) {
            res.status(404).json({ error: 'Photo not found' });
            return;
        }

        await deleteFile(`photos/${photo.filename}`, req.userId!);
        await prisma.photo.delete({ where: { id: String(req.params.id) } });

        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
