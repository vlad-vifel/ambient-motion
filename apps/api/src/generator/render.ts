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

export async function renderVideo(params: RenderVideoParams): Promise<void> {
    const { presetId, imageUrl, audioUrl, phrase, durationMs, fadeInMs, fadeOutMs, outputPath } =
        params;

    console.log(`[Render] Getting bundle...`);
    const serveUrl = await getBundle();
    console.log(`[Render] Bundle ready at ${serveUrl}`);

    const inputProps = { imageUrl, audioUrl, phrase, durationMs, fadeInMs, fadeOutMs };

    console.log(`[Render] Selecting composition ${presetId}...`);
    const composition = await selectComposition({
        serveUrl,
        id: presetId,
        inputProps,
    });
    console.log(
        `[Render] Composition selected - ${composition.width}x${composition.height} @ ${composition.fps}fps`,
    );

    console.log(`[Render] Starting renderMedia...`);
    await renderMedia({
        serveUrl,
        composition,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps,
        concurrency: 1,
        crf: 23,
        chromiumOptions: {
            gl: 'angle',
        },
    });
    console.log(`[Render] renderMedia completed, output: ${outputPath}`);
}
