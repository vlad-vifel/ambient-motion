import { bundle } from '@remotion/bundler';
import path from 'node:path';

let cached: Promise<string> | null = null;

export function getBundle(): Promise<string> {
    if (!cached) {
        console.log(`[Bundle] Starting bundle process...`);
        const entryPoint = path.resolve(__dirname, '../../src/remotion/index.ts');
        console.log(`[Bundle] Entry point: ${entryPoint}`);

        cached = bundle(entryPoint)
            .then((url) => {
                console.log(`[Bundle] Bundle succeeded, URL: ${url}`);
                return url;
            })
            .catch((err) => {
                console.error(`[Bundle] Bundle failed:`, err);
                cached = null;
                throw err;
            });
    }
    return cached;
}
