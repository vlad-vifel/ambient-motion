import 'dotenv/config';

import cors from 'cors';
import express from 'express';
import audioRoutes from './routes/audio';
import authRoutes from './routes/auth';
import photosRoutes from './routes/photos';
import videosRoutes from './routes/videos';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(
    cors({
        origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
        credentials: true,
    }),
);
app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/photos', photosRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/videos', videosRoutes);

app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
    console.log(`ambient motion API running on http://localhost:${PORT}`);
});

export default app;
