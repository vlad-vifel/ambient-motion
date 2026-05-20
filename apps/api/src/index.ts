import 'dotenv/config';

import cors from 'cors';
import express from 'express';
import audioRoutes from './routes/audio';
import authRoutes from './routes/auth';
import assetsRoutes from './routes/assets';
import foldersRoutes from './routes/folders';
import videosRoutes from './routes/videos';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(
    cors({
        origin: (origin, cb) => {
            const allowed = process.env.CORS_ORIGIN?.split(',');
            if (allowed) return cb(null, allowed.includes(origin ?? '') ? origin : false);
            if (!origin || origin.startsWith('http://localhost')) return cb(null, origin ?? '*');
            cb(null, false);
        },
        credentials: true,
    }),
);
app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/folders', foldersRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/videos', videosRoutes);

app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
    console.log(`ambient motion API running on http://localhost:${PORT}`);
});

export default app;
