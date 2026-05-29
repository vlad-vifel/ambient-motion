import 'dotenv/config';
import { startWorker } from './worker';

console.log('[Worker] Local worker process starting...');
startWorker().catch((err) => {
    console.error('[Worker] Fatal error:', err);
    process.exit(1);
});
