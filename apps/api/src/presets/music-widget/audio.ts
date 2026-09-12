import { spawn } from 'node:child_process';
import ffmpegStatic from 'ffmpeg-static';

const ffmpeg = process.env.FFMPEG_PATH || ffmpegStatic || 'ffmpeg';

function runFfmpeg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const process = spawn(ffmpeg, args, { stdio: ['ignore', 'ignore', 'pipe'] });
        let stderr = '';

        process.stderr.on('data', (chunk: Buffer) => {
            stderr += chunk.toString();
        });
        process.once('error', reject);
        process.once('close', (code, signal) => {
            if (code === 0) {
                resolve();
                return;
            }
            const reason = signal ? `signal ${signal}` : `code ${code}`;
            reject(new Error(`FFmpeg exited with ${reason}: ${stderr.slice(-1000)}`));
        });
    });
}

export async function prepareMusicWidgetAudio({
    sourceUrl,
    outputPath,
    startMs,
    durationMs,
    fadeInMs,
    fadeOutMs,
}: {
    sourceUrl: string;
    outputPath: string;
    startMs: number;
    durationMs: number;
    fadeInMs: number;
    fadeOutMs: number;
}): Promise<void> {
    const fadeFilters = [
        'aresample=48000:async=1:first_pts=0',
        fadeInMs > 0 ? `afade=t=in:st=0:d=${fadeInMs / 1000}:curve=tri` : null,
        fadeOutMs > 0
            ? `afade=t=out:st=${(durationMs - fadeOutMs) / 1000}:d=${fadeOutMs / 1000}:curve=tri`
            : null,
        'alimiter=limit=0.97',
    ].filter((filter): filter is string => Boolean(filter));

    await runFfmpeg([
        '-y',
        '-ss',
        String(startMs / 1000),
        '-i',
        sourceUrl,
        '-t',
        String(durationMs / 1000),
        '-vn',
        '-af',
        fadeFilters.join(','),
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-ar',
        '48000',
        outputPath,
    ]);
}
