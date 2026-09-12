import { renderMedia, selectComposition, type CancelSignal } from '@remotion/renderer';
import { getBundle } from './bundle';
import { getChromiumOptions } from './remotion-options';
import type { RenderParams } from './render-types';

async function verifyAssetUrl(url: string, type: string): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
        const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) {
            console.warn(`[Render] ${type} URL returned ${response.status} — continuing anyway`);
        } else {
            console.log(`[Render] ${type} URL ok - ${response.headers.get('content-type')}`);
        }
    } catch (err) {
        clearTimeout(timeoutId);
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[Render] ${type} URL check failed (${message}) — continuing anyway`);
    }
}

export async function renderVideo(
    params: RenderParams,
    cancelSignal?: CancelSignal,
): Promise<void> {
    const {
        presetId,
        imageUrl,
        audioUrl,
        phrase,
        durationMs,
        fadeInMs,
        fadeOutMs,
        choiceLeft,
        choiceRight,
        settings,
        title,
        artist,
        fullAudioDurationMs,
        audioStartMs,
        audioFadeInMs,
        audioFadeOutMs,
        outputPath,
    } = params;

    console.log(`[Render] Getting bundle...`);
    const serveUrl = await getBundle();
    console.log(`[Render] Bundle ready at ${serveUrl}`);

    const inputProps = {
        imageUrl,
        audioUrl,
        phrase,
        durationMs,
        fadeInMs,
        fadeOutMs,
        choiceLeft,
        choiceRight,
        settings,
        title,
        artist,
        fullAudioDurationMs,
        audioStartMs,
        audioFadeInMs,
        audioFadeOutMs,
    };

    await verifyAssetUrl(imageUrl, 'image');
    if (audioUrl) await verifyAssetUrl(audioUrl, 'audio');

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
            chromiumOptions: getChromiumOptions(),
            cancelSignal,
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
