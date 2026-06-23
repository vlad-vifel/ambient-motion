import fs from 'node:fs/promises';
import { renderStill, selectComposition } from '@remotion/renderer';
import { getBundle } from './bundle';
import { cropCenterSquare } from './ffmpeg-grain';

const THUMBNAIL_SIZE = 240;

interface RenderThumbnailParams {
    presetId: string;
    imageUrl: string;
    audioUrl: string;
    phrase: string;
    durationMs: number;
    fadeInMs: number;
    fadeOutMs: number;
    choiceLeft?: string;
    choiceRight?: string;
    settings?: unknown;
    outputPath: string;
}

export async function renderThumbnail(params: RenderThumbnailParams): Promise<void> {
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
        outputPath,
    } = params;

    console.log(`[Thumbnail] Getting bundle...`);
    const serveUrl = await getBundle();
    console.log(`[Thumbnail] Bundle ready at ${serveUrl}`);

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
    };

    console.log(`[Thumbnail] Selecting composition ${presetId}...`);
    const composition = await selectComposition({
        serveUrl,
        id: presetId,
        inputProps,
        browserExecutable: process.env.CHROME_EXECUTABLE || undefined,
    });
    console.log(`[Thumbnail] Composition selected - ${composition.width}x${composition.height}`);

    const middleFrame = Math.floor((composition.fps * durationMs) / 2000);
    const scale = THUMBNAIL_SIZE / Math.min(composition.width, composition.height);
    const stillWidth = Math.round(composition.width * scale);
    const stillHeight = Math.round(composition.height * scale);
    const fullPath = `${outputPath}.full.jpg`;
    console.log(
        `[Thumbnail] Starting renderStill at frame ${middleFrame} (middle of ${durationMs}ms), ${stillWidth}x${stillHeight}...`,
    );
    await renderStill({
        serveUrl,
        composition: { ...composition, width: stillWidth, height: stillHeight },
        output: fullPath,
        inputProps,
        frame: middleFrame,
        imageFormat: 'jpeg',
        jpegQuality: 70,
        browserExecutable: process.env.CHROME_EXECUTABLE || undefined,
        chromiumOptions: {
            gl: (process.env.REMOTION_GL as any) || 'angle',
        },
    });
    console.log(`[Thumbnail] renderStill completed, cropping center square...`);
    await cropCenterSquare(fullPath, outputPath, THUMBNAIL_SIZE);
    await fs.rm(fullPath, { force: true });
    console.log(`[Thumbnail] thumbnail ready, output: ${outputPath}`);
}
