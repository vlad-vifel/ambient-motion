import { renderStill, selectComposition } from '@remotion/renderer';
import { getBundle } from './bundle';

interface RenderThumbnailParams {
    presetId: string;
    imageUrl: string;
    audioUrl: string;
    phrase: string;
    durationMs: number;
    fadeInMs: number;
    fadeOutMs: number;
    outputPath: string;
}

export async function renderThumbnail(params: RenderThumbnailParams): Promise<void> {
    const { presetId, imageUrl, audioUrl, phrase, durationMs, fadeInMs, fadeOutMs, outputPath } =
        params;

    console.log(`[Thumbnail] Getting bundle...`);
    const serveUrl = await getBundle();
    console.log(`[Thumbnail] Bundle ready at ${serveUrl}`);

    const inputProps = { imageUrl, audioUrl, phrase, durationMs, fadeInMs, fadeOutMs };

    console.log(`[Thumbnail] Selecting composition ${presetId}...`);
    const composition = await selectComposition({
        serveUrl,
        id: presetId,
        inputProps,
        browserExecutable: process.env.CHROME_EXECUTABLE || undefined,
    });
    console.log(`[Thumbnail] Composition selected - ${composition.width}x${composition.height}`);

    const middleFrame = Math.floor((composition.fps * durationMs) / 2000);
    console.log(
        `[Thumbnail] Starting renderStill at frame ${middleFrame} (middle of ${durationMs}ms)...`,
    );
    await renderStill({
        serveUrl,
        composition: { ...composition, width: 240, height: 240 },
        output: outputPath,
        inputProps,
        frame: middleFrame,
        imageFormat: 'jpeg',
        jpegQuality: 70,
        browserExecutable: process.env.CHROME_EXECUTABLE || undefined,
        chromiumOptions: {
            gl: (process.env.REMOTION_GL as any) || 'angle',
        },
    });
    console.log(`[Thumbnail] renderStill completed, output: ${outputPath}`);
}
