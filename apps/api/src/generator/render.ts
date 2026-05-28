import { renderMedia, selectComposition } from '@remotion/renderer';
import { getBundle } from './bundle';

interface RenderVideoParams {
    presetId: string;
    imageUrl: string;
    audioUrl: string;
    phrase: string;
    durationMs: number;
    fadeInMs: number;
    fadeOutMs: number;
    outputPath: string;
}

async function verifyAssetUrl(url: string, type: string): Promise<void> {
    try {
        console.log(`[Render] Verifying ${type} URL...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        try {
            const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            console.log(`[Render] ${type} URL verified - ${response.headers.get('content-type')}`);
        } catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Render] Failed to verify ${type} URL:`, message);
        throw new Error(`Cannot access ${type}: ${message}`);
    }
}

export async function renderVideo(params: RenderVideoParams): Promise<void> {
    const { presetId, imageUrl, audioUrl, phrase, durationMs, fadeInMs, fadeOutMs, outputPath } =
        params;

    console.log(`[Render] Getting bundle...`);
    const serveUrl = await getBundle();
    console.log(`[Render] Bundle ready at ${serveUrl}`);

    const inputProps = { imageUrl, audioUrl, phrase, durationMs, fadeInMs, fadeOutMs };

    console.log(`[Render] Verifying asset URLs...`);
    try {
        await verifyAssetUrl(imageUrl, 'image');
        await verifyAssetUrl(audioUrl, 'audio');
    } catch (err) {
        console.error(`[Render] Asset verification failed:`, err);
        throw err;
    }

    console.log(`[Render] Selecting composition ${presetId}...`);
    const composition = await selectComposition({
        serveUrl,
        id: presetId,
        inputProps,
        browserExecutable: process.env.CHROME_EXECUTABLE || undefined,
    });
    console.log(
        `[Render] Composition selected - ${composition.width}x${composition.height} @ ${composition.fps}fps`,
    );

    console.log(`[Render] Starting renderMedia...`);
    const renderStartTime = Date.now();
    try {
        await renderMedia({
            serveUrl,
            composition,
            codec: 'h264',
            outputLocation: outputPath,
            inputProps,
            concurrency: 1,
            crf: 23,
            browserExecutable: process.env.CHROME_EXECUTABLE || undefined,
            chromiumOptions: {
                gl: (process.env.REMOTION_GL as any) || 'angle',
            },
            timeoutInMilliseconds: 600000,
            verbose: false,
        });
        const renderDuration = Date.now() - renderStartTime;
        console.log(`[Render] renderMedia completed in ${renderDuration}ms, output: ${outputPath}`);
    } catch (err) {
        const renderDuration = Date.now() - renderStartTime;
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Render] renderMedia failed after ${renderDuration}ms:`, message);
        throw err;
    }
}
