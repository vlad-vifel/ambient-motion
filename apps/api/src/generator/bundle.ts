import { bundle } from '@remotion/bundler';
import path from 'node:path';

let cached: Promise<string> | null = null;

export function getBundle(): Promise<string> {
    if (!cached) {
        console.log(`[Bundle] Starting bundle process...`);
        const entryPoint = path.resolve(__dirname, '../../src/remotion/index.ts');
        console.log(`[Bundle] Entry point: ${entryPoint}`);

        const bundleStart = Date.now();
        const bundlePromise = bundle(entryPoint);

        cached = Promise.race([
            bundlePromise.then((url) => {
                const duration = Date.now() - bundleStart;
                console.log(`[Bundle] Bundle succeeded in ${duration}ms, URL: ${url}`);
                return url;
            }),
            new Promise<string>((_resolve, reject) => {
                setTimeout(
                    () => {
                        reject(new Error('[Bundle] Bundle process timed out after 5 minutes'));
                    },
                    5 * 60 * 1000,
                );
            }),
        ]).catch((err) => {
            console.error(`[Bundle] Bundle failed:`, err);
            cached = null;
            throw err;
        });
    }
    return cached;
}
